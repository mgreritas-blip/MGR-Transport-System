const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Broadcast to specific role rooms
// ─────────────────────────────────────────────────────────────────────────────
function broadcastToRoles(roles, event, payload) {
  roles.forEach(role => io.to(`room:${role}`).emit(event, payload));
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO — ROOM MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Client joins role-based room on login
  socket.on('joinRoom', ({ role }) => {
    const room = `room:${role}`;
    socket.join(room);
    console.log(`[WS] ${socket.id} joined ${room}`);

    // On join, send current active alerts for their role
    sendInitialData(socket, role);
  });

  // Maintenance staff acknowledges an issue
  socket.on('acknowledgeIssue', async ({ id, acknowledgedBy }) => {
    try {
      const updated = await prisma.maintenanceAlert.update({
        where: { id },
        data: { status: 'Acknowledged', acknowledgedBy: acknowledgedBy || 'Maintenance Staff' }
      });
      // Tell all maintenance clients about the update
      broadcastToRoles(['maintenance'], 'alertStatusUpdated', updated);
      // Also update the admin dashboard
      broadcastToRoles(['superadmin', 'deptadmin'], 'alertStatusUpdated', updated);
      console.log(`[WS] Issue ${id} acknowledged by ${acknowledgedBy}`);
    } catch (err) {
      console.error('[WS] acknowledgeIssue error:', err.message);
    }
  });

  // Maintenance staff marks issue resolved
  socket.on('resolveIssue', async ({ id }) => {
    try {
      const updated = await prisma.maintenanceAlert.update({
        where: { id },
        data: { status: 'Resolved', resolvedAt: new Date() }
      });
      broadcastToRoles(['maintenance', 'superadmin', 'deptadmin', 'coordinator'], 'alertStatusUpdated', updated);
      console.log(`[WS] Issue ${id} resolved`);
    } catch (err) {
      console.error('[WS] resolveIssue error:', err.message);
    }
  });

  // GPS location update from driver
  socket.on('driverLocationUpdate', (data) => {
    broadcastToRoles(['student', 'parent', 'hod', 'superadmin', 'deptadmin'], 'busLocationChanged', data);
  });

  // Emergency SOS from student
  socket.on('studentSOS', (data) => {
    console.log('[CRITICAL] SOS from student:', data.studentId);
    io.emit('emergencyAlert', data);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Send current active data to a newly connected client
async function sendInitialData(socket, role) {
  try {
    if (role === 'maintenance') {
      const alerts = await prisma.maintenanceAlert.findMany({
        where: { status: { not: 'Resolved' } },
        orderBy: { createdAt: 'desc' }
      });
      socket.emit('initialAlerts', alerts);
    }
    if (['student', 'parent', 'hod', 'coordinator'].includes(role)) {
      const shutdowns = await prisma.busShutdown.findMany({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' }
      });
      socket.emit('initialShutdowns', shutdowns);
    }
  } catch (err) {
    console.error('[WS] sendInitialData error:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REST: VEHICLES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ include: { driver: true } });
    res.json(vehicles);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vehicles', async (req, res) => {
  const { number, type, model, capacity, route } = req.body;
  try {
    const vehicle = await prisma.vehicle.create({
      data: { number, type, model, capacity: parseInt(capacity), route, status: 'active' }
    });
    res.json(vehicle);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REST: USERS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  const { role } = req.query;
  try {
    const filter = role ? { role } : {};
    const users = await prisma.user.findMany({ where: filter, include: { assignedVehicle: true } });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role, phone, license, department, year, paymentStatus, parentId } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email, password, role, phone, license, department, year, paymentStatus, parentId, status: 'active' }
    });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REST: ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/attendance', async (req, res) => {
  const { userId, vehicleId, type, latitude, longitude } = req.body;
  try {
    const record = await prisma.attendance.create({
      data: { userId, vehicleId, type, latitude, longitude }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'student' && user?.parentId) {
      broadcastToRoles(['parent'], 'childBoarded', { student: user, vehicleId, type, timestamp: new Date() });
    }
    res.json(record);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REST: MAINTENANCE ALERTS  ← NEW
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/maintenance-alerts', async (req, res) => {
  try {
    const alerts = await prisma.maintenanceAlert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/maintenance-alerts', async (req, res) => {
  const { vehicle, issueType, description, priority, raisedBy } = req.body;
  try {
    const alert = await prisma.maintenanceAlert.create({
      data: { vehicle, issueType, description, priority: priority || 'Medium', raisedBy: raisedBy || 'Admin' }
    });

    // ── PUSH to maintenance team immediately ──
    broadcastToRoles(['maintenance'], 'newMaintenanceAlert', alert);
    console.log(`[WS] Maintenance alert broadcasted for ${vehicle}`);

    // ── If Critical/High, also check if bus needs shutdown ──
    if (priority === 'Critical' || priority === 'High') {
      broadcastToRoles(['superadmin', 'deptadmin', 'coordinator'], 'criticalAlertRaised', alert);
    }

    res.json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/maintenance-alerts/:id/status', async (req, res) => {
  const { status, acknowledgedBy } = req.body;
  try {
    const data = { status };
    if (status === 'Acknowledged') data.acknowledgedBy = acknowledgedBy || 'Maintenance Staff';
    if (status === 'Resolved') data.resolvedAt = new Date();
    const updated = await prisma.maintenanceAlert.update({ where: { id: req.params.id }, data });
    broadcastToRoles(['maintenance', 'superadmin', 'deptadmin'], 'alertStatusUpdated', updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REST: BUS SHUTDOWN EVENTS  ← NEW
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/bus-shutdowns', async (req, res) => {
  try {
    const shutdowns = await prisma.busShutdown.findMany({
      where: { status: 'Active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(shutdowns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bus-shutdowns', async (req, res) => {
  const { vehicle, reason, replacementBus, affectedRoute, priority } = req.body;
  try {
    const shutdown = await prisma.busShutdown.create({
      data: { vehicle, reason, replacementBus, affectedRoute, priority: priority || 'High' }
    });

    const payload = {
      ...shutdown,
      message: `⚠️ ${vehicle} is offline due to maintenance${replacementBus ? `. Replacement: ${replacementBus}` : '.'}`,
      affectedRoute
    };

    // ── Push to ALL affected roles instantly ──
    broadcastToRoles(['student', 'parent', 'hod', 'coordinator'], 'busShutdown', payload);
    console.log(`[WS] Bus shutdown event broadcasted for ${vehicle}`);

    res.json(shutdown);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bus-shutdowns/:id/resolve', async (req, res) => {
  try {
    const resolved = await prisma.busShutdown.update({
      where: { id: req.params.id },
      data: { status: 'Resolved', resolvedAt: new Date() }
    });
    broadcastToRoles(['student', 'parent', 'hod', 'coordinator'], 'busRestored', resolved);
    res.json(resolved);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REST: LEGACY ISSUES + SERVICE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany();
    res.json(issues);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/issues', async (req, res) => {
  const { type, description, vehicleId, reportedBy } = req.body;
  try {
    const issue = await prisma.issue.create({
      data: { type, description, vehicleId, reportedBy, status: 'open' }
    });
    io.emit('newIssueAlert', issue);
    res.json(issue);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/service-requests', async (req, res) => {
  try {
    const requests = await prisma.serviceRequest.findMany({ orderBy: { submittedAt: 'desc' } });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/service-requests', async (req, res) => {
  const { requestType, description, vehicleId, driverName, driverId, priority } = req.body;
  try {
    const request = await prisma.serviceRequest.create({
      data: { requestType, description, vehicleId, driverName, driverId, priority: priority || 'medium', status: 'pending' }
    });
    io.emit('newServiceRequest', request);
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/service-requests/:id/approve', async (req, res) => {
  const { approvedBy, notes } = req.body;
  try {
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'approved', approvedBy: approvedBy || 'Admin', approvedAt: new Date(), notes }
    });
    io.emit('serviceRequestApproved', updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/service-requests/:id/reject', async (req, res) => {
  const { notes } = req.body;
  try {
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected', notes }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/service-requests/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const data = { status };
    if (status === 'completed') data.completedAt = new Date();
    const updated = await prisma.serviceRequest.update({ where: { id: req.params.id }, data });
    io.emit('serviceRequestStatusChanged', updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✅ CTMS Backend running on http://localhost:${PORT}`);
  console.log(`✅ Socket.IO ready — rooms: maintenance | student | parent | hod | coordinator\n`);
});
