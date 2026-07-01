# Route Management, Vehicle Assignment & Notification Module

## What Already Exists (Preserved)
- **Routes.jsx**: Zone tabs, route table with Location/Zone, Route Name, Vehicle No, Circle No, Live Notifications, Alerts count badge, RAISE button, route detail panel (map + info), Add Route modal, Add Zone modal, View Alerts modal, Raise Notification modal (basic 4-type selector)
- **Topbar.jsx**: Bell icon (static), profile dropdown
- **server.js**: Full vehicle/member APIs, WebSocket rooms, BusAssignment, BusChangeAuditLog models

---

## What Will Be Added (Enhancements Only)

### A — Schema: 2 New Models

#### [MODIFY] schema.prisma
- **`RouteVehicleAssignment`** — links a Vehicle to a Route (vehicleId, routeId, routeName, vehicleNumber, isActive, assignedAt, assignedBy)
- **`RouteNotification`** — stores all dispatched notifications (routeId, routeName, vehicleIds JSON, notificationType, effectiveDate, effectiveTime, duration, message, stakeholdersJson, status, auditJson, createdAt)

No existing models are changed.

---

### B — Backend: New API Routes (server.js)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/routes` | Return all routes with their assigned vehicles & member counts |
| POST | `/api/routes` | Create route |
| GET | `/api/routes/:id/vehicles` | Get vehicles assigned to a route |
| POST | `/api/routes/:id/assign-vehicle` | Assign vehicle to route (duplicate check) |
| DELETE | `/api/routes/:id/vehicles/:vehicleId` | Remove vehicle from route |
| GET | `/api/routes/:id/stakeholders` | Auto-retrieve all members from all assigned vehicles |
| POST | `/api/routes/notifications` | Dispatch notification + store audit |
| GET | `/api/routes/notifications` | List recent notifications |

WebSocket event: `routeNotificationSent` broadcast to all roles on dispatch.

---

### C — Frontend Changes

#### [MODIFY] Topbar.jsx
- Replace static Bell icon with an interactive **"🔔 Create Notification"** button
- Opens a global **Quick Notification modal** (select route → select type → confirm) using the same API
- Show unread notification badge count (from RouteNotification store)

#### [MODIFY] Routes.jsx (EXTEND ONLY — no redesign)
Add to each route row's detail panel a new **"Assigned Vehicles"** section:

1. **Assigned Vehicles section** in the route detail panel (right side):
   - List of vehicles assigned to that route (Vehicle No, Circle No, Type, Driver name, Student count, Coordinator count)
   - **Assign Vehicle** button → searchable dropdown of all DB vehicles (excluding already-assigned ones)
   - **Remove** / **Activate/Deactivate** per vehicle
   - Each vehicle card shows auto-retrieved stakeholder summary

2. **Enhanced RAISE notification modal** (replaces existing basic 4-type modal):
   - **Step 1 — Select Vehicles**: Checkboxes for all vehicles on this route (pre-loads from assigned vehicles)
   - **Step 2 — Notification Type**: 8 types (Route Change, Temporary Diversion, Early Arrival, Delayed Departure, Route Closure, Emergency Update, Pickup Point Change, Drop Point Change)
   - **Step 3 — Details**: Effective date/time, duration (if temp), updated route info, message
   - **Step 4 — Confirmation Screen**: Shows total stakeholders (students, parents, drivers, coordinators, HODs) auto-retrieved from selected vehicles; admin must confirm
   - On confirm: POST to `/api/routes/notifications`, WebSocket broadcast, audit log

3. **Notification History** tab within the route detail panel showing past dispatched notifications for that route.

---

## Open Questions

> [!NOTE]
> The existing Routes.jsx uses **mock data** (hardcoded `mockData` array). The new vehicle assignment will use **real DB data** from the `/api/routes` and `/api/vehicles` endpoints. The existing mock routes will be bootstrapped as seed data on first load.

> [!IMPORTANT]
> **Driver assignment note (GPS)**: The system already stores `driverId` on Vehicle. When a vehicle is assigned to a route, the driver's GPS is automatically considered the route GPS — no additional GPS mapping needed.

> [!NOTE]
> **Notification delivery channels** (SMS, WhatsApp, Email, Push) — these are logged in the `RouteNotification.auditJson` and displayed as "Notification Dispatched" in the UI. Actual integration with SMS/WhatsApp/email providers is out of scope for this sprint (backend stubs will mark them as "queued").

---

## Proposed Changes

### Database Layer
#### [MODIFY] system-backend/prisma/schema.prisma
Add `RouteVehicleAssignment` and `RouteNotification` models.

---

### Backend Layer
#### [MODIFY] system-backend/server.js
Add 8 new route/notification API endpoints and `routeNotificationSent` WebSocket event.

---

### Frontend Layer
#### [MODIFY] web-admin/src/components/Topbar.jsx
Add Create Notification button with badge count and quick-notification modal.

#### [MODIFY] web-admin/src/pages/Routes.jsx
- Connect to real `/api/routes` + `/api/vehicles` APIs (keep mock as fallback)
- Add "Assigned Vehicles" section to route detail panel
- Add Assign/Remove/Replace vehicle buttons
- Enhance RAISE notification modal to 4-step wizard
- Add notification history in detail panel

#### [MODIFY] web-admin/src/api.js
Add helper functions for new route management endpoints.

---

## Verification Plan
### Automated
- `npx prisma db push` — schema migration
- Server restart — new endpoints active
### Manual
1. Navigate to Routes → click a route → verify "Assigned Vehicles" section appears
2. Assign a vehicle → verify it appears in the section with driver/student/coordinator counts
3. Click RAISE → verify 4-step wizard with auto-populated stakeholders
4. Confirm notification → verify RouteNotification record created + WebSocket fires
5. Click Bell in Topbar → verify Quick Notification modal opens
