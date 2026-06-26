# 🚌 College Transport Monitoring System — Tech Stack

> **Project:** CTMS Full-Stack Monorepo
> **Last Updated:** May 15, 2026

---

## 📁 Project Structure

```
College Transport Monitoring System/
├── system-backend/          → Node.js REST + WebSocket API
├── web-admin/               → React Web Admin Portal
├── mobile-officer/          → React Native App (Officer/Driver)
└── mobile-student-parent/   → React Native App (Student & Parent)
```

---

## 🖥️ Backend — `system-backend`

| Category         | Technology                  | Version     |
|------------------|-----------------------------|-------------|
| Runtime          | Node.js                     | LTS         |
| Framework        | Express                     | ^4.18.2     |
| Real-time        | Socket.IO                   | ^4.7.4      |
| ORM              | Prisma (Prisma Client JS)   | ^5.10.0     |
| Database         | SQLite (dev) / PostgreSQL (prod) | —      |
| Authentication   | JSON Web Token (jsonwebtoken) | ^9.0.2   |
| Environment      | dotenv                      | ^16.4.5     |
| CORS             | cors                        | ^2.8.5      |
| Dev Server       | nodemon                     | ^3.1.0      |

**Entry Point:** `server.js`
**Start Command:** `npm run dev` → runs `nodemon server.js` on `localhost:3000`

### Database Models (Prisma Schema)
- `User` — Superadmin, DeptAdmin, Driver, Coordinator, Student, Parent
- `Vehicle` — Bus / Car fleet with driver assignment
- `Attendance` — Driver/Student scan logs with GPS coordinates
- `Issue` — Vehicle/route issue reports
- `ServiceRequest` — Maintenance & service approval workflow

---

## 🌐 Web Admin Portal — `web-admin`

| Category         | Technology              | Version     |
|------------------|-------------------------|-------------|
| Framework        | React                   | ^18.2.0     |
| Build Tool       | Vite                    | ^5.1.4      |
| Routing          | React Router DOM        | ^6.22.3     |
| Mapping          | Leaflet + React-Leaflet | ^1.9.4 / ^4.2.1 |
| Icons            | Lucide React            | ^0.344.0    |
| Real-time        | Socket.IO Client        | ^4.7.4      |
| Styling          | Vanilla CSS (Glassmorphism + CSS Custom Properties) | — |

**Start Command:** `npm run dev` → Vite dev server on `localhost:5173`

> **Design Note:** Strictly avoids TailwindCSS. Uses modern Glassmorphism, CSS Custom Variables, Blue Primary / Success Green / Danger Red palette.

---

## 📱 Officer Mobile App — `mobile-officer`

| Category         | Technology              | Version     |
|------------------|-------------------------|-------------|
| Framework        | React Native            | 0.73.6      |
| Platform         | Expo                    | ~50.0.14    |
| Status Bar       | expo-status-bar         | ~1.11.1     |
| GPS / Location   | expo-location           | ~16.5.5     |
| Camera / QR      | expo-camera             | ~14.1.1     |
| Real-time        | Socket.IO Client        | ^4.7.4      |
| Language         | JavaScript (Babel)      | —           |

**Target Platform:** Android (via Expo Go)
**Start Command:** `npx expo start`

---

## 📱 Student & Parent Mobile App — `mobile-student-parent`

| Category         | Technology              | Version     |
|------------------|-------------------------|-------------|
| Framework        | React Native            | 0.73.6      |
| Platform         | Expo                    | ~50.0.14    |
| Status Bar       | expo-status-bar         | ~1.11.1     |
| GPS / Location   | expo-location           | ~16.5.5     |
| Camera / QR      | expo-camera             | ~14.1.1     |
| Real-time        | Socket.IO Client        | ^4.7.4      |
| Language         | JavaScript (Babel)      | —           |

**Target Platform:** Android (via Expo Go)
**Start Command:** `npx expo start`

---

## 🔗 Cross-Cutting Concerns

| Concern           | Solution                                      |
|-------------------|-----------------------------------------------|
| Real-time Comms   | Socket.IO (backend server ↔ all clients)      |
| Authentication    | JWT (JSON Web Tokens) via backend API         |
| GPS Tracking      | `expo-location` on mobile, Leaflet on web     |
| QR Code Scanning  | `expo-camera` (driver/student attendance)     |
| API Style         | RESTful HTTP + WebSocket events               |

---

## 🛠️ Developer Prerequisites

- **Node.js** — LTS (https://nodejs.org/)
- **npm / npx** — bundled with Node.js
- **Expo CLI** — `npm install -g expo-cli`
- **Expo Go** — Android app for mobile preview
- **SQLite** (dev) or **PostgreSQL** (production)

---

## 🚀 Quick Start

```bash
# 1. Start Backend
cd system-backend && npm install && npm run dev

# 2. Start Web Admin
cd web-admin && npm install && npm run dev

# 3. Start Officer App
cd mobile-officer && npm install && npx expo start

# 4. Start Student/Parent App
cd mobile-student-parent && npm install && npx expo start
```
