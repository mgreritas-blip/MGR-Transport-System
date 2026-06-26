import React from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const Settings = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
            <SettingsIcon size={28} color="var(--primary)" />
            <h1>System Settings</h1>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>General Configuration</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>GPS Mismatch Alert Radius (meters)</label>
              <input type="number" defaultValue={50} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Google Maps Development API Key</label>
              <input type="password" placeholder="AIzaSyA..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>System Email</label>
              <input type="email" defaultValue="admin@ctms.edu" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <button className="btn btn-primary">
              <Save size={18} style={{ marginRight: '8px' }} /> Save Changes
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
