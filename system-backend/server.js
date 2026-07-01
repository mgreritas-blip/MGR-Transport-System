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

// GET all vehicles (include driver + assignment counts)
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: true,
        assignedStudents: true,
        assignedCoordinators: true,
      }
    });
    res.json(vehicles);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create vehicle — extended with all persistent fields
app.post('/api/vehicles', async (req, res) => {
  const {
    number, type, model, capacity, route, status,
    vehicleTypeId, circleNumber, rcDetails, chassisNumber,
    purchaseDate, maintenanceDueDate, kmRun, image,
    // member assignments passed at creation time
    studentIds, coordinatorIds, driverId,
    adminName
  } = req.body;
  try {
    const vehicle = await prisma.$transaction(async (tx) => {
      // 1. Create vehicle
      const v = await tx.vehicle.create({
        data: {
          number, type, model,
          capacity: capacity ? parseInt(capacity) : null,
          route,
          status: status || 'active',
          vehicleTypeId: vehicleTypeId || null,
          circleNumber: circleNumber || null,
          rcDetails: rcDetails || null,
          chassisNumber: chassisNumber || null,
          purchaseDate: purchaseDate || null,
          maintenanceDueDate: maintenanceDueDate || null,
          kmRun: kmRun ? parseInt(kmRun) : 0,
          image: image || null,
          driverId: driverId || null,
        }
      });

      // 2. Assign students if provided
      if (studentIds && studentIds.length > 0) {
        for (const sid of studentIds) {
          const student = await tx.user.findUnique({ where: { id: sid } });
          if (!student) continue;
          await tx.vehicleStudentAssignment.create({
            data: {
              vehicleId: v.id,
              studentId: sid,
              studentName: student.name,
              class: student.department ? `${student.department} - ${student.year || ''}`.trim() : null,
              assignedBy: adminName || 'admin'
            }
          });
          // Update StudentVehicleMapping
          await tx.studentVehicleMapping.upsert({
            where: { studentId: sid },
            update: { originalVehicleId: v.id, activeVehicleId: v.id, updatedAt: new Date() },
            create: {
              studentId: sid,
              studentName: student.name,
              originalVehicleId: v.id,
              activeVehicleId: v.id,
            }
          });
        }
      }

      // 3. Assign coordinators if provided
      if (coordinatorIds && coordinatorIds.length > 0) {
        for (const cid of coordinatorIds) {
          const coord = await tx.user.findUnique({ where: { id: cid } });
          if (!coord) continue;
          await tx.vehicleCoordinatorAssignment.create({
            data: {
              vehicleId: v.id,
              coordinatorId: cid,
              coordinatorName: coord.name,
              assignedBy: adminName || 'admin'
            }
          });
        }
      }

      // 4. Write audit log
      await tx.vehicleAssignmentAuditLog.create({
        data: {
          vehicleId: v.id,
          action: 'vehicle_created',
          details: JSON.stringify({
            number, type, driverId: driverId || null,
            studentCount: studentIds?.length || 0,
            coordinatorCount: coordinatorIds?.length || 0
          }),
          adminName: adminName || 'Super Admin'
        }
      });

      return v;
    });

    // 5. Broadcast to all roles
    broadcastToRoles(
      ['student', 'parent', 'hod', 'coordinator', 'driver'],
      'vehicleCreated',
      { vehicleId: vehicle.id, number: vehicle.number, route: vehicle.route }
    );

    res.json(vehicle);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update vehicle core fields
app.patch('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const {
    number, type, model, capacity, route, status,
    vehicleTypeId, circleNumber, rcDetails, chassisNumber,
    purchaseDate, maintenanceDueDate, kmRun, driverId
  } = req.body;
  try {
    const data = {};
    if (number !== undefined) data.number = number;
    if (type !== undefined) data.type = type;
    if (model !== undefined) data.model = model;
    if (capacity !== undefined) data.capacity = parseInt(capacity);
    if (route !== undefined) data.route = route;
    if (status !== undefined) data.status = status;
    if (vehicleTypeId !== undefined) data.vehicleTypeId = vehicleTypeId;
    if (circleNumber !== undefined) data.circleNumber = circleNumber;
    if (rcDetails !== undefined) data.rcDetails = rcDetails;
    if (chassisNumber !== undefined) data.chassisNumber = chassisNumber;
    if (purchaseDate !== undefined) data.purchaseDate = purchaseDate;
    if (maintenanceDueDate !== undefined) data.maintenanceDueDate = maintenanceDueDate;
    if (kmRun !== undefined) data.kmRun = parseInt(kmRun);
    if (driverId !== undefined) data.driverId = driverId || null;
    const updated = await prisma.vehicle.update({ where: { id }, data });
    io.emit('vehicleUpdated', updated);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET vehicle members (driver + students + coordinators) ─────────────────────
app.get('/api/vehicles/:id/members', async (req, res) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        assignedStudents: true,
        assignedCoordinators: true,
      }
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Enrich students with full user data
    const studentDetails = await Promise.all(
      vehicle.assignedStudents.map(async (s) => {
        const user = await prisma.user.findUnique({ where: { id: s.studentId } });
        return {
          assignmentId: s.id,
          studentId: s.studentId,
          name: user?.name || s.studentName,
          phone: user?.phone || null,
          class: s.class || (user ? `${user.department || ''} ${user.year || ''}`.trim() : null),
          pickupPoint: s.pickupPoint || null,
          assignedAt: s.assignedAt,
        };
      })
    );

    // Enrich coordinators with full user data
    const coordinatorDetails = await Promise.all(
      vehicle.assignedCoordinators.map(async (c) => {
        const user = await prisma.user.findUnique({ where: { id: c.coordinatorId } });
        return {
          assignmentId: c.id,
          coordinatorId: c.coordinatorId,
          name: user?.name || c.coordinatorName,
          phone: user?.phone || null,
          assignedAt: c.assignedAt,
        };
      })
    );

    res.json({
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.number,
      driver: vehicle.driver ? {
        driverId: vehicle.driver.id,
        name: vehicle.driver.name,
        phone: vehicle.driver.phone,
        license: vehicle.driver.license,
      } : null,
      students: studentDetails,
      coordinators: coordinatorDetails,
      studentCount: studentDetails.length,
      coordinatorCount: coordinatorDetails.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST assign members to vehicle (atomic) ───────────────────────────────────
app.post('/api/vehicles/:id/assign-members', async (req, res) => {
  const { id } = req.params;
  const { studentIds, coordinatorIds, driverId, adminId, adminName } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id } });
      if (!vehicle) throw new Error('Vehicle not found');

      // Update driver (GPS: driver GPS = vehicle GPS)
      if (driverId !== undefined) {
        await tx.vehicle.update({ where: { id }, data: { driverId: driverId || null } });
      }

      // Upsert student assignments
      if (studentIds && studentIds.length > 0) {
        for (const sid of studentIds) {
          const student = await tx.user.findUnique({ where: { id: sid } });
          if (!student) continue;
          await tx.vehicleStudentAssignment.upsert({
            where: { vehicleId_studentId: { vehicleId: id, studentId: sid } },
            update: { studentName: student.name, assignedBy: adminName || 'admin' },
            create: {
              vehicleId: id,
              studentId: sid,
              studentName: student.name,
              class: student.department ? `${student.department} ${student.year || ''}`.trim() : null,
              assignedBy: adminName || 'admin'
            }
          });
          // Sync StudentVehicleMapping (GPS + attendance reference)
          await tx.studentVehicleMapping.upsert({
            where: { studentId: sid },
            update: { originalVehicleId: id, activeVehicleId: id, updatedAt: new Date() },
            create: {
              studentId: sid,
              studentName: student.name,
              originalVehicleId: id,
              activeVehicleId: id,
            }
          });
        }
      }

      // Upsert coordinator assignments
      if (coordinatorIds && coordinatorIds.length > 0) {
        for (const cid of coordinatorIds) {
          const coord = await tx.user.findUnique({ where: { id: cid } });
          if (!coord) continue;
          await tx.vehicleCoordinatorAssignment.upsert({
            where: { vehicleId_coordinatorId: { vehicleId: id, coordinatorId: cid } },
            update: { coordinatorName: coord.name, assignedBy: adminName || 'admin' },
            create: {
              vehicleId: id,
              coordinatorId: cid,
              coordinatorName: coord.name,
              assignedBy: adminName || 'admin'
            }
          });
        }
      }

      // Write audit log
      await tx.vehicleAssignmentAuditLog.create({
        data: {
          vehicleId: id,
          action: 'assigned_members',
          details: JSON.stringify({
            driverId, studentIds, coordinatorIds,
            vehicleNumber: vehicle.number
          }),
          adminId: adminId || 'admin',
          adminName: adminName || 'Super Admin'
        }
      });
    });

    // Broadcast to all role rooms (GPS sync = driver assignment already done above)
    const payload = { vehicleId: id, updatedAt: new Date().toISOString() };
    broadcastToRoles(
      ['student', 'parent', 'hod', 'coordinator', 'driver'],
      'vehicleMembersUpdated',
      payload
    );
    io.emit('vehicleMembersUpdated', payload); // also to admin

    res.json({ success: true, vehicleId: id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE remove a student from vehicle ──────────────────────────────────────
app.delete('/api/vehicles/:id/members/student/:sid', async (req, res) => {
  const { id, sid } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicleStudentAssignment.deleteMany({
        where: { vehicleId: id, studentId: sid }
      });
      await tx.vehicleAssignmentAuditLog.create({
        data: {
          vehicleId: id,
          action: 'removed_student',
          details: JSON.stringify({ studentId: sid }),
        }
      });
    });
    broadcastToRoles(['student', 'parent', 'hod', 'coordinator'], 'vehicleMembersUpdated', { vehicleId: id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE remove a coordinator from vehicle ──────────────────────────────────
app.delete('/api/vehicles/:id/members/coordinator/:cid', async (req, res) => {
  const { id, cid } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicleCoordinatorAssignment.deleteMany({
        where: { vehicleId: id, coordinatorId: cid }
      });
      await tx.vehicleAssignmentAuditLog.create({
        data: {
          vehicleId: id,
          action: 'removed_coordinator',
          details: JSON.stringify({ coordinatorId: cid }),
        }
      });
    });
    broadcastToRoles(['coordinator', 'hod'], 'vehicleMembersUpdated', { vehicleId: id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET vehicle assignment audit log ──────────────────────────────────────────
app.get('/api/vehicles/:id/audit', async (req, res) => {
  const { id } = req.params;
  try {
    const logs = await prisma.vehicleAssignmentAuditLog.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
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
// REST: BUS / VEHICLE CHANGE MODULE
// ─────────────────────────────────────────────────────────────────────────────

// 1. GET all vehicles (for dropdowns in BusChange wizard)
app.get('/api/bus-change/vehicles', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { driver: true },
      orderBy: { number: 'asc' }
    });
    res.json(vehicles);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. GET all stakeholders for a vehicle (auto-fetch for wizard Step 1)
app.get('/api/bus-change/vehicle-info/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { driver: true }
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Students mapped to this vehicle
    const mappings = await prisma.studentVehicleMapping.findMany({
      where: { activeVehicleId: req.params.id }
    });

    // If no mappings yet, fetch students whose route matches vehicle route (fallback)
    let students = [];
    if (mappings.length > 0) {
      students = await prisma.user.findMany({
        where: { id: { in: mappings.map(m => m.studentId) }, role: 'student' }
      });
    } else {
      students = await prisma.user.findMany({ where: { role: 'student' } });
    }

    // Parents of those students
    const parentIds = students.map(s => s.parentId).filter(Boolean);
    const parents = parentIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: parentIds }, role: 'parent' } })
      : [];

    // Coordinator (first coordinator in DB as demo)
    const coordinators = await prisma.user.findMany({ where: { role: 'coordinator' } });

    // HoD
    const hods = await prisma.user.findMany({ where: { role: 'hod' } });

    res.json({
      vehicle,
      driver: vehicle.driver || null,
      students,
      parents,
      coordinators,
      hods,
      mappings,
      studentCount: students.length,
      parentCount: parents.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. POST validate replacement bus
app.post('/api/bus-change/validate', async (req, res) => {
  const { fromVehicleId, toVehicleId, assignmentType, startDate, endDate } = req.body;
  try {
    const toVehicle = await prisma.vehicle.findUnique({
      where: { id: toVehicleId },
      include: { driver: true }
    });
    if (!toVehicle) return res.status(404).json({ error: 'Replacement vehicle not found' });

    const fromVehicle = await prisma.vehicle.findUnique({ where: { id: fromVehicleId } });

    // Count students currently on the fromVehicle
    const fromMappings = await prisma.studentVehicleMapping.findMany({
      where: { activeVehicleId: fromVehicleId }
    });
    const studentsToMove = fromMappings.length || 0;

    // Check active assignments on replacement bus
    const conflictingAssignment = await prisma.busAssignment.findFirst({
      where: {
        toVehicleId,
        status: 'active',
        ...(assignmentType === 'temporary' && startDate && endDate ? {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(startDate) } }
          ]
        } : {})
      }
    });

    const checks = {
      vehicleAvailable: toVehicle.status === 'active',
      driverAssigned: !!toVehicle.driverId,
      routeCompatible: true, // Simplified — no hard-coded route conflict
      capacitySufficient: (toVehicle.capacity || 50) >= studentsToMove,
      seatAvailable: (toVehicle.capacity || 50) > 0,
      operationalStatus: toVehicle.status !== 'maintenance',
      gpsAvailable: true, // Simulated GPS check
      noScheduleConflict: !conflictingAssignment,
      noActiveTempAssignment: !conflictingAssignment
    };

    const allPassed = Object.values(checks).every(Boolean);

    res.json({
      valid: allPassed,
      checks,
      vehicle: toVehicle,
      studentsToMove,
      conflictingAssignment: conflictingAssignment || null
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. POST execute bus reassignment (full atomic transaction)
app.post('/api/bus-change/execute', async (req, res) => {
  const {
    fromVehicleId, toVehicleId,
    assignmentType, startDate, endDate,
    adminId, adminName, ipAddress
  } = req.body;

  try {
    const fromVehicle = await prisma.vehicle.findUnique({ where: { id: fromVehicleId }, include: { driver: true } });
    const toVehicle   = await prisma.vehicle.findUnique({ where: { id: toVehicleId },   include: { driver: true } });
    if (!fromVehicle || !toVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Fetch all stakeholders
    const mappings = await prisma.studentVehicleMapping.findMany({ where: { activeVehicleId: fromVehicleId } });
    let students = mappings.length > 0
      ? await prisma.user.findMany({ where: { id: { in: mappings.map(m => m.studentId) }, role: 'student' } })
      : await prisma.user.findMany({ where: { role: 'student' } });

    const parentIds = students.map(s => s.parentId).filter(Boolean);
    const parents = parentIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: parentIds }, role: 'parent' } })
      : [];

    const coordinators = await prisma.user.findMany({ where: { role: 'coordinator' } });
    const hods = await prisma.user.findMany({ where: { role: 'hod' } });

    // Build stakeholder JSON snapshots
    const studentsJson = JSON.stringify(students.map(s => ({ id: s.id, name: s.name, phone: s.phone })));
    const parentsJson  = JSON.stringify(parents.map(p => ({ id: p.id, name: p.name, phone: p.phone })));

    const autoRestoreAt = assignmentType === 'temporary' && endDate ? new Date(endDate) : null;

    // ── Execute in a transaction ──
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create BusAssignment record
      const assignment = await tx.busAssignment.create({
        data: {
          fromVehicleId,
          fromVehicleNumber: fromVehicle.number,
          toVehicleId,
          toVehicleNumber: toVehicle.number,
          assignmentType,
          status: 'active',
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          autoRestoreAt,
          studentsJson,
          parentsJson,
          studentCount: students.length,
          parentCount: parents.length,
          previousDriverId: fromVehicle.driverId,
          previousDriverName: fromVehicle.driver?.name || null,
          newDriverId: toVehicle.driverId,
          newDriverName: toVehicle.driver?.name || null,
          previousRoute: fromVehicle.route,
          newRoute: toVehicle.route,
          adminId: adminId || 'admin',
          adminName: adminName || 'Super Admin',
          ipAddress: ipAddress || 'localhost',
          notificationStatus: 'sent',
          notifiedCount: students.length + parents.length + coordinators.length + hods.length,
          gpsSyncStatus: 'synced',
          attendanceSyncStatus: 'synced',
          transactionStatus: 'success'
        }
      });

      // 2. Update StudentVehicleMapping — move students to new vehicle
      if (mappings.length > 0) {
        await tx.studentVehicleMapping.updateMany({
          where: { activeVehicleId: fromVehicleId },
          data: { activeVehicleId: toVehicleId, assignmentId: assignment.id }
        });
      } else {
        // Create mappings for all students (first-time setup)
        for (const s of students) {
          await tx.studentVehicleMapping.upsert({
            where: { studentId: s.id },
            create: {
              studentId: s.id,
              studentName: s.name,
              originalVehicleId: fromVehicleId,
              activeVehicleId: toVehicleId,
              assignmentId: assignment.id
            },
            update: {
              activeVehicleId: toVehicleId,
              assignmentId: assignment.id
            }
          });
        }
      }

      // 3. Create immutable audit log
      await tx.busChangeAuditLog.create({
        data: {
          assignmentId: assignment.id,
          adminId: adminId || 'admin',
          adminName: adminName || 'Super Admin',
          fromVehicle: fromVehicle.number,
          toVehicle: toVehicle.number,
          previousDriver: fromVehicle.driver?.name || null,
          newDriver: toVehicle.driver?.name || null,
          previousRoute: fromVehicle.route || null,
          newRoute: toVehicle.route || null,
          assignmentType,
          effectiveDate: new Date(startDate || new Date()),
          restorationDate: endDate ? new Date(endDate) : null,
          studentsAffected: students.length,
          parentsNotified: parents.length,
          notificationStatus: 'sent',
          gpsSyncStatus: 'synced',
          attendanceSyncStatus: 'synced',
          transactionStatus: 'success',
          ipAddress: ipAddress || 'localhost',
          deviceInfo: 'Web Admin Portal'
        }
      });

      return assignment;
    });

    // ── Socket.IO: broadcast to all affected roles ──
    const notificationPayload = {
      assignmentId: result.id,
      assignmentType,
      fromBus: fromVehicle.number,
      toBus: toVehicle.number,
      fromRoute: fromVehicle.route || 'N/A',
      toRoute: toVehicle.route || 'N/A',
      previousDriver: fromVehicle.driver?.name || 'N/A',
      newDriver: toVehicle.driver?.name || 'N/A',
      previousDriverPhone: fromVehicle.driver?.phone || 'N/A',
      newDriverPhone: toVehicle.driver?.phone || 'N/A',
      effectiveDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      studentsAffected: students.length,
      message: `🚌 Bus change: ${fromVehicle.number} → ${toVehicle.number} (${assignmentType})`
    };

    broadcastToRoles(
      ['student', 'parent', 'hod', 'coordinator', 'driver'],
      'busReassigned',
      notificationPayload
    );
    broadcastToRoles(['superadmin', 'deptadmin'], 'busChangeAuditUpdate', result);
    console.log(`[WS] busReassigned: ${fromVehicle.number} → ${toVehicle.number} (${assignmentType})`);

    res.json({ success: true, assignment: result, notificationPayload });
  } catch (err) {
    console.error('[BusChange] execute error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. GET active bus assignments
app.get('/api/bus-change/active', async (req, res) => {
  try {
    const assignments = await prisma.busAssignment.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. POST restore a temporary assignment early
app.post('/api/bus-change/restore/:id', async (req, res) => {
  try {
    const assignment = await prisma.busAssignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    await prisma.$transaction(async (tx) => {
      // Revert StudentVehicleMapping back to original
      await tx.studentVehicleMapping.updateMany({
        where: { assignmentId: req.params.id },
        data: { activeVehicleId: assignment.fromVehicleId, assignmentId: null }
      });
      await tx.busAssignment.update({
        where: { id: req.params.id },
        data: { status: 'cancelled', updatedAt: new Date() }
      });
    });

    broadcastToRoles(
      ['student', 'parent', 'hod', 'coordinator', 'driver'],
      'busRestored',
      {
        assignmentId: req.params.id,
        restoredBus: assignment.fromVehicleNumber,
        fromBus: assignment.toVehicleNumber,
        message: `✅ Original bus ${assignment.fromVehicleNumber} has been restored`
      }
    );

    res.json({ success: true, message: 'Assignment restored' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. POST convert temporary → permanent
app.post('/api/bus-change/make-permanent/:id', async (req, res) => {
  try {
    const updated = await prisma.busAssignment.update({
      where: { id: req.params.id },
      data: { assignmentType: 'permanent', status: 'converted_to_permanent', endDate: null, autoRestoreAt: null }
    });
    // Update mappings to clear the assignmentId (now permanent)
    await prisma.studentVehicleMapping.updateMany({
      where: { assignmentId: req.params.id },
      data: { originalVehicleId: updated.toVehicleId, assignmentId: null }
    });

    broadcastToRoles(
      ['student', 'parent', 'hod', 'coordinator', 'driver'],
      'busChangeMadePermanent',
      {
        assignmentId: req.params.id,
        bus: updated.toVehicleNumber,
        message: `📌 Bus assignment made permanent: ${updated.toVehicleNumber}`
      }
    );

    res.json({ success: true, assignment: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. GET audit log
app.get('/api/bus-change/audit', async (req, res) => {
  try {
    const logs = await prisma.busChangeAuditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-RESTORE SCHEDULER — checks every 60 sec for expired temp assignments
// ─────────────────────────────────────────────────────────────────────────────
async function runAutoRestore() {
  try {
    const expired = await prisma.busAssignment.findMany({
      where: {
        status: 'active',
        assignmentType: 'temporary',
        autoRestoreAt: { lte: new Date() }
      }
    });

    for (const assignment of expired) {
      console.log(`[SCHEDULER] Auto-restoring assignment ${assignment.id}: ${assignment.toVehicleNumber} → ${assignment.fromVehicleNumber}`);
      await prisma.$transaction(async (tx) => {
        await tx.studentVehicleMapping.updateMany({
          where: { assignmentId: assignment.id },
          data: { activeVehicleId: assignment.fromVehicleId, assignmentId: null }
        });
        await tx.busAssignment.update({
          where: { id: assignment.id },
          data: { status: 'expired' }
        });
      });

      broadcastToRoles(
        ['student', 'parent', 'hod', 'coordinator', 'driver'],
        'busRestored',
        {
          assignmentId: assignment.id,
          restoredBus: assignment.fromVehicleNumber,
          fromBus: assignment.toVehicleNumber,
          message: `✅ Temporary assignment expired. Original bus ${assignment.fromVehicleNumber} has been restored automatically.`
        }
      );
    }
  } catch (err) {
    console.error('[SCHEDULER] Auto-restore error:', err.message);
  }
}

setInterval(runAutoRestore, 60 * 1000); // Run every 60 seconds

// Also send active assignments to new clients
async function sendInitialBusChangeData(socket, role) {
  try {
    if (['student', 'parent', 'hod', 'coordinator', 'driver'].includes(role)) {
      const active = await prisma.busAssignment.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' }
      });
      if (active.length > 0) {
        socket.emit('initialBusAssignments', active);
      }
    }
  } catch (err) {
    console.error('[WS] sendInitialBusChangeData error:', err.message);
  }
}

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
// ROUTE MANAGEMENT — Vehicle Assignment & Notification Module
// ─────────────────────────────────────────────────────────────────────────────

// GET all route-vehicle assignments (optionally filter by routeId)
app.get('/api/route-assignments', async (req, res) => {
  try {
    const { routeId } = req.query;
    const where = routeId ? { routeId, isActive: true } : { isActive: true };
    const assignments = await prisma.routeVehicleAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' }
    });
    // Enrich with vehicle details from Vehicle table
    const enriched = await Promise.all(assignments.map(async (a) => {
      try {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: a.vehicleId },
          include: { driver: true, assignedStudents: true, assignedCoordinators: true }
        });
        return { ...a, vehicle: vehicle || null };
      } catch { return { ...a, vehicle: null }; }
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST assign a vehicle to a route
app.post('/api/route-assignments', async (req, res) => {
  const { routeId, routeName, vehicleId, adminName } = req.body;
  if (!routeId || !vehicleId) return res.status(400).json({ error: 'routeId and vehicleId required' });
  try {
    // Check for duplicate active assignment
    const existing = await prisma.routeVehicleAssignment.findFirst({
      where: { routeId, vehicleId, isActive: true }
    });
    if (existing) return res.status(409).json({ error: 'Vehicle already assigned to this route' });

    // Get vehicle info
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Upsert (vehicle may have been previously removed)
    const assignment = await prisma.routeVehicleAssignment.upsert({
      where: { routeId_vehicleId: { routeId, vehicleId } },
      update: { isActive: true, removedAt: null, removedBy: null, routeName: routeName || routeId, assignedBy: adminName || 'admin', assignedAt: new Date() },
      create: { routeId, routeName: routeName || routeId, vehicleId, vehicleNumber: vehicle.number, assignedBy: adminName || 'admin' }
    });

    // Broadcast
    broadcastToRoles(['superadmin','deptadmin','coordinator','driver','student','parent','hod'], 'routeVehicleAssigned', { routeId, routeName, vehicleId, vehicleNumber: vehicle.number });

    res.json(assignment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE remove a vehicle from a route (soft-delete)
app.delete('/api/route-assignments/:routeId/:vehicleId', async (req, res) => {
  const { routeId, vehicleId } = req.params;
  const { adminName } = req.body;
  try {
    const updated = await prisma.routeVehicleAssignment.update({
      where: { routeId_vehicleId: { routeId, vehicleId } },
      data: { isActive: false, removedAt: new Date(), removedBy: adminName || 'admin' }
    });
    broadcastToRoles(['superadmin','deptadmin','coordinator','driver','student','parent','hod'], 'routeVehicleRemoved', { routeId, vehicleId });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH toggle activate/deactivate a vehicle on a route
app.patch('/api/route-assignments/:routeId/:vehicleId/toggle', async (req, res) => {
  const { routeId, vehicleId } = req.params;
  try {
    const current = await prisma.routeVehicleAssignment.findUnique({
      where: { routeId_vehicleId: { routeId, vehicleId } }
    });
    if (!current) return res.status(404).json({ error: 'Assignment not found' });
    const updated = await prisma.routeVehicleAssignment.update({
      where: { routeId_vehicleId: { routeId, vehicleId } },
      data: { isActive: !current.isActive }
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET auto-retrieve all stakeholders from all active vehicles on a route
app.get('/api/route-assignments/:routeId/stakeholders', async (req, res) => {
  const { routeId } = req.params;
  const { vehicleIds } = req.query; // optional CSV filter
  try {
    // Find active vehicle assignments for this route
    const where = { routeId, isActive: true };
    if (vehicleIds) {
      const ids = vehicleIds.split(',').filter(Boolean);
      where.vehicleId = { in: ids };
    }
    const assignments = await prisma.routeVehicleAssignment.findMany({ where });
    if (!assignments.length) return res.json({ students: [], parents: [], drivers: [], coordinators: [], hods: [], total: 0 });

    const vids = assignments.map(a => a.vehicleId);

    // Fetch all vehicles with full relations
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vids } },
      include: { driver: true, assignedStudents: true, assignedCoordinators: true }
    });

    // Collect student IDs
    const allStudentIds = [];
    for (const v of vehicles) {
      for (const sa of v.assignedStudents) allStudentIds.push(sa.studentId);
    }
    const uniqueStudentIds = [...new Set(allStudentIds)];

    // Fetch students + parents
    const students = await prisma.user.findMany({
      where: { id: { in: uniqueStudentIds }, role: 'student' }
    });
    const parents = await prisma.user.findMany({
      where: {
        role: 'parent',
        parentId: { in: uniqueStudentIds }
      }
    });
    const hods = await prisma.user.findMany({ where: { role: 'hod' } });

    // Collect coordinator IDs
    const allCoordIds = [];
    for (const v of vehicles) {
      for (const ca of v.assignedCoordinators) allCoordIds.push(ca.coordinatorId);
    }
    const coordinators = await prisma.user.findMany({
      where: { id: { in: [...new Set(allCoordIds)] } }
    });

    // Drivers
    const drivers = vehicles.filter(v => v.driver).map(v => v.driver);

    res.json({
      students: students.map(s => ({ id: s.id, name: s.name, phone: s.phone, department: s.department, year: s.year })),
      parents: parents.map(p => ({ id: p.id, name: p.name, phone: p.phone })),
      drivers: drivers.map(d => ({ id: d.id, name: d.name, phone: d.phone, license: d.license })),
      coordinators: coordinators.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
      hods: hods.map(h => ({ id: h.id, name: h.name, phone: h.phone, department: h.department })),
      total: students.length + parents.length + drivers.length + coordinators.length + hods.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST dispatch a route notification
app.post('/api/route-notifications', async (req, res) => {
  const {
    routeId, routeName, vehicleIds, vehicleNumbers,
    notificationType, effectiveDate, effectiveTime, duration,
    updatedRoute, pickupChange, dropChange, customMessage,
    stakeholders, adminName, ipAddress
  } = req.body;
  try {
    const s = stakeholders || {};
    const notif = await prisma.routeNotification.create({
      data: {
        routeId, routeName,
        vehicleIdsJson: JSON.stringify(vehicleIds || []),
        vehicleNumbersJson: JSON.stringify(vehicleNumbers || []),
        notificationType,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        effectiveTime: effectiveTime || '00:00',
        duration: duration || null,
        updatedRoute: updatedRoute || null,
        pickupChange: pickupChange || null,
        dropChange: dropChange || null,
        customMessage: customMessage || null,
        totalStudents: s.students?.length || 0,
        totalParents: s.parents?.length || 0,
        totalDrivers: s.drivers?.length || 0,
        totalCoordinators: s.coordinators?.length || 0,
        totalHods: s.hods?.length || 0,
        stakeholdersJson: JSON.stringify(s),
        notifiedCount: (s.students?.length || 0) + (s.parents?.length || 0) + (s.drivers?.length || 0) + (s.coordinators?.length || 0) + (s.hods?.length || 0),
        adminName: adminName || 'Super Admin',
        ipAddress: ipAddress || null,
        status: 'sent'
      }
    });

    // Build the notification payload
    const payload = {
      id: notif.id,
      routeId, routeName,
      vehicleNumbers: vehicleNumbers || [],
      notificationType,
      effectiveDate, effectiveTime, duration,
      updatedRoute, pickupChange, dropChange,
      customMessage,
      totalAffected: notif.notifiedCount,
      timestamp: notif.createdAt
    };

    // Broadcast to all roles
    io.emit('routeNotificationSent', payload);

    res.json({ success: true, notification: notif, payload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET recent route notifications (optionally filter by routeId)
app.get('/api/route-notifications', async (req, res) => {
  try {
    const { routeId, limit } = req.query;
    const where = routeId ? { routeId } : {};
    const notifications = await prisma.routeNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 50
    });
    res.json(notifications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET vehicles available for route assignment (not yet on this route)
app.get('/api/route-assignments/:routeId/available-vehicles', async (req, res) => {
  const { routeId } = req.params;
  try {
    // IDs already assigned
    const assigned = await prisma.routeVehicleAssignment.findMany({
      where: { routeId, isActive: true },
      select: { vehicleId: true }
    });
    const assignedIds = assigned.map(a => a.vehicleId);
    // Return all vehicles except already assigned ones
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { notIn: assignedIds }, status: { not: 'inactive' } },
      include: { driver: true, assignedStudents: true, assignedCoordinators: true }
    });
    res.json(vehicles);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✅ CTMS Backend running on http://localhost:${PORT}`);
  console.log(`✅ Socket.IO ready — rooms: maintenance | student | parent | hod | coordinator | driver`);
  console.log(`✅ Bus Change Module active — 8 endpoints registered`);
  console.log(`✅ Route Management Module active — 7 endpoints registered`);
  console.log(`✅ Auto-restore scheduler running (60s interval)\n`);
  runAutoRestore(); // Run once immediately on start
});





