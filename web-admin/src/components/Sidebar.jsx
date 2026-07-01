import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BusFront, Users, UserCog, GraduationCap, Map,
  Wrench, Settings, LayoutDashboard, Component, Crown, ArrowLeftRight
} from 'lucide-react';

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-header" style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '12px' }}>
      <BusFront size={24} color="var(--primary)" />
      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>CTMS Admin</span>
    </div>
    <nav className="nav-menu">
      {[
        { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admins', name: 'Admins', icon: <UserCog size={20} /> },
        { path: '/vehicles', name: 'Vehicles', icon: <BusFront size={20} /> },
        { path: '/drivers', name: 'Drivers', icon: <UserCog size={20} /> },
        { path: '/students', name: 'Students', icon: <GraduationCap size={20} /> },
        { path: '/parents', name: 'Parents', icon: <Users size={20} /> },
        { path: '/coordinators', name: 'Coordinators', icon: <Component size={20} /> },
        { path: '/hods', name: 'HoDs', icon: <Crown size={20} /> },
        { path: '/routes', name: 'Routes', icon: <Map size={20} /> },
        { path: '/issues', name: 'Log Maintenance', icon: <Wrench size={20} /> },
        { path: '/bus-change', name: 'Bus/Vehicle Change', icon: <ArrowLeftRight size={20} /> },
        { path: '/settings', name: 'Settings', icon: <Settings size={20} /> },
      ].map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon} {item.name}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
