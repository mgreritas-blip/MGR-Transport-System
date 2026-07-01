# Route Management & Notification Module

The new module has been fully implemented, expanding the existing routes infrastructure with production-ready vehicle assignment and advanced notification capabilities.

## 1. Route Dashboard & Vehicle Assignment

The core Routes dashboard has been enhanced without disrupting the existing workflow.

![Main Routes Table](/absolute/path/to/C:/Users/Alienware/.gemini/antigravity/brain/86b9602f-f8a8-414b-8046-fee9b39b9fb9/routes_v2_main.png)

When selecting a route, you now have access to a dedicated **Assigned Vehicles** panel. 

- You can assign any number of active vehicles to a single route.
- A vehicle cannot be double-assigned to the same route.
- Each vehicle displays a real-time count of its **auto-retrieved stakeholders** (Students, Coordinators, Drivers).
- You can activate, deactivate, or permanently remove vehicles from a route without affecting the underlying vehicle data.

## 2. Global "Alert" Integration (Topbar)

The static bell icon has been replaced with a globally accessible **🔔 Alert** button in the top navigation bar.

- Shows a live badge count of recent notifications sent system-wide.
- Provides a quick dropdown to view recent notification history.
- Clicking the button opens the new **4-Step Notification Wizard**.

## 3. The 4-Step Notification Wizard (RAISE)

Replacing the old single-step modal, the new Notification Wizard guides the administrator through a robust, error-free broadcast process:

1. **Vehicles**: Select which assigned vehicles (and therefore which stakeholders) are affected.
2. **Type**: Choose from 8 standardized alert types (Route Change, Temporary Diversion, Early Arrival, Delayed Departure, Route Closure, Emergency Update, Pickup Point Change, Drop Point Change).
3. **Details**: Specify effective dates, times, duration, and input structured updates (e.g., new pickup points or custom messages).
4. **Confirm**: The system automatically pulls down the total count of affected Students, Parents, Drivers, Coordinators, and HODs from the selected vehicles, presenting a final audit screen before dispatch.

## 4. Backend Infrastructure

The module is powered by 2 new schema models and 9 new API endpoints:
- `RouteVehicleAssignment`: Tracks active/inactive assignments and history.
- `RouteNotification`: Logs all dispatched notifications, preserving a snapshot of stakeholder counts and message details for the audit trail.
- All notifications are instantly broadcasted across the ecosystem via WebSockets (`routeNotificationSent`).

**The implementation is live and ready for testing on `http://localhost:5174/routes`.**
