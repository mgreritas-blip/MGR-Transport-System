# CTMS Project - Antigravity Agent Guidelines & Context

## Welcome
This file (`.agents/AGENTS.md`) is automatically loaded by Antigravity whenever it is launched within this repository. It provides the AI with the necessary project context, architectural guidelines, and current state to seamlessly resume work, even on a new machine.

## Project Overview
**College Transport Monitoring System (CTMS)**
A comprehensive Full Stack Monorepo for managing college transport.
- **Backend**: Node.js, Express, Socket.IO, Prisma, PostgreSQL (currently using SQLite for dev).
- **Web Admin Portal**: React (Vite), React Router, Socket.IO client, vanilla modern CSS (glassmorphism, CSS variables). **NO TailwindCSS allowed.**
- **Mobile Apps**: React Native (Expo) for both `mobile-officer` and `mobile-student-parent`.

## Important Architectural Rules
1. **Styling**: Always use Vanilla CSS. Maintain the modern glassmorphism aesthetic. Use CSS variables from `index.css`.
2. **Real-time Sync**: The system relies heavily on Socket.IO for real-time updates (e.g., maintenance alerts, route notifications). The backend emits to specific rooms (`superadmin`, `student`, `parent`, `hod`, `coordinator`, `maintenance`).
3. **Database**: Prisma ORM is used. Always ensure `schema.prisma` is synced and run `npx prisma db push` (or migrate) after changes.
4. **Agent Workflow**: All agent artifacts and plans should be saved or referenced here in the `.agents` folder to persist across environments.

## Recent Milestones
- **Route Management & Alert Module**: Added `RouteVehicleAssignment` and `RouteNotification` models. Refactored the Routes page to include an Alert wizard and Assigned Vehicles panel.
- **Bus/Vehicle Change Module**: Implemented real-time dashboard layout for managing vehicle changes.
- **WebSocket Integration**: Fully operational real-time sync between backend and clients.

## How to Resume Work
- If starting fresh, run `npm install` in `system-backend`, `web-admin`, and the mobile app directories.
- Start the backend: `cd system-backend && npm run dev`
- Start the admin portal: `cd web-admin && npm run dev`
- Start the mobile preview (if needed): `cd mobile-officer && npx expo start`

*Note to AI Agent: Always read this file before modifying core architecture.*
