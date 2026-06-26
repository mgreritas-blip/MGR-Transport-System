# College Transport Monitoring System (CTMS)

Welcome to the CTMS project repository! This represents a comprehensive Full Stack Monorepo setup according to your functional specifications.

## Technology Stack Chosen
- **Backend (`system-backend`)**: Node.js, Express, Socket.IO, Prisma ORM, PostgreSQL.
- **Web Admin Portal (`web-admin`)**: React (Vite), Vanilla Modern CSS, React Router, Socket.IO Client.
- **Officer Mobile App (`mobile-officer`)**: React Native (Expo), Expo Location, UI built for Android.
- **Student & Parent App (`mobile-student-parent`)**: React Native (Expo) built for Android.

## Setup Instructions
*(Note: You will need to install Node.js from https://nodejs.org/ if you haven't already. `NPM` and `NPX` are required to run these commands.)*

### 1. Backend Setup
1. Open terminal and navigate to: `cd system-backend`
2. Install dependencies: `npm install`
3. Configure your PostgreSQL Database URL in a `.env` file (e.g. `DATABASE_URL="postgresql://user:pass@localhost:5432/ctms"`).
4. Run Prisma database push: `npx prisma db push`
5. Start server: `npm run dev` (Runs on `localhost:3000`)

### 2. Web Admin Portal Setup
1. Open terminal and navigate to: `cd web-admin`
2. Install dependencies: `npm install`
3. Start Vite dev server: `npm run dev` (Runs on `localhost:5173`)

### 3. Mobile Apps Setup
1. Open terminal and navigate to either `cd mobile-officer` OR `cd mobile-student-parent`
2. Install dependencies: `npm install`
3. Start the Expo server: `npx expo start`
4. Use the **Expo Go** app on your Android device to scan the QR code and view the mobile application live!

## Design Details
- Web portal strictly avoids TailwindCSS per requirements. It uses highly modern Glassmorphism and CSS Custom Variables for its styling (`index.css`).
- App design implements the requested Blue Primary color, Success Green, Danger Red, and Light Gray backgrounds. 

## Next Steps
- Integrate Postgres connection by deploying your DB.
- Map and connect the Socket.IO endpoints to your Expo app's Location updates.
