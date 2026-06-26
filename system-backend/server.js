const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------
// SYSTEM API ENDPOINTS
// ----------------------------------------------------------------------

// 1. Vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { driver: true }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { number, type, model, capacity, route } = req.body;
  try {
    const vehicle = await prisma.vehicle.create({
      data: { number, type, model, capacity: parseInt(capacity), route, status: 'active' }
    });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Drivers / Users
app.get('/api/users', async (req, res) => {
  const { role } = req.query; // e.g., ?role=driver
  try {
    const filter = role ? { role } : {};
    const users = await prisma.user.findMany({
      where: filter,
      include: { assignedVehicle: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role, phone, license, department, year, paymentStatus, parentId } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        name, email, password, role, phone, license, department, year, paymentStatus, parentId, status: 'active'
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Attendance & Boarding (QR Scan)
app.post('/api/attendance', async (req, res) => {
  const { userId, vehicleId, type, latitude, longitude } = req.body;
  try {
    const record = await prisma.attendance.create({
      data: { userId, vehicleId, type, latitude, longitude }
    });
    
    // Notify parents if it's a student scan
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === 'student' && user.parentId) {
      // In a real system, send push notification to parentId here
      console.log(`[Notification] Auto-notifying parent of student ${user.name}`);
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Issues / Maintenance
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/issues', async (req, res) => {
  const { type, description, vehicleId, reportedBy } = req.body;
  try {
    const issue = await prisma.issue.create({
      data: { type, description, vehicleId, reportedBy, status: 'open' }
    });
    // Trigger real-time dashboard alert
    io.emit('newIssueAlert', issue);
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Service Requests (Driver → Admin → Maintenance Team)
app.get('/api/service-requests', async (req, res) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { submittedAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/service-requests', async (req, res) => {
  const { requestType, description, vehicleId, driverName, driverId, priority } = req.body;
  try {
    const request = await prisma.serviceRequest.create({
      data: { requestType, description, vehicleId, driverName, driverId, priority: priority || 'medium', status: 'pending' }
    });
    // Notify admin dashboard in real-time
    io.emit('newServiceRequest', request);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/service-requests/:id/approve', async (req, res) => {
  const { approvedBy, notes } = req.body;
  try {
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'approved', approvedBy: approvedBy || 'Admin', approvedAt: new Date(), notes }
    });
    // Notify maintenance team in real-time
    io.emit('serviceRequestApproved', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/service-requests/:id/reject', async (req, res) => {
  const { notes } = req.body;
  try {
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected', notes }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/service-requests/:id/status', async (req, res) => {
  const { status } = req.body; // in_progress, completed
  try {
    const data = { status };
    if (status === 'completed') data.completedAt = new Date();
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data
    });
    io.emit('serviceRequestStatusChanged', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------
// REAL-TIME GPS TRACKING / NOTIFICATIONS (SOCKET.IO)
// ----------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('User connected to live tracking socket:', socket.id);

  // When a mobile-officer app streams location data
  socket.on('driverLocationUpdate', (data) => {
    // data payload: { vehicleId, lat, lng, speed, timestamp }
    // Broadcast instantly to Web Admin & Parent's Maps tracking this vehicle
    io.emit('busLocationChanged', data);
  });

  // Emergency SOS trigger from Student App
  socket.on('studentSOS', (data) => {
    // data payload: { studentId, busId, location }
    console.log('CRITICAL: SOS Received from student', data.studentId);
    io.emit('emergencyAlert', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from tracking socket:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server & Websockets successfully running on port ${PORT}`);
});
