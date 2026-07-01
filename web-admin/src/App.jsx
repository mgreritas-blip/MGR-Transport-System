import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Students from './pages/Students';
import Parents from './pages/Parents';
import Admins from './pages/Admins';
import Coordinators from './pages/Coordinators';
import HoDs from './pages/HoDs';
import RoutesPage from './pages/Routes';
import Issues from './pages/Issues';
import Settings from './pages/Settings';
import BusChange from './pages/BusChange';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/students" element={<Students />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/coordinators" element={<Coordinators />} />
          <Route path="/hods" element={<HoDs />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/bus-change" element={<BusChange />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
