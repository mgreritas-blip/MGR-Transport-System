import React, { useState } from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';

const Topbar = () => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="topbar glass-panel" style={{ position: 'relative', border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 0 }}>
      {/* Absolutely Centered Logo */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', height: '100%', display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="Dr MGR University Logo" style={{ height: '70px', maxHeight: '100%', objectFit: 'contain' }} />
      </div>

      {/* Right-aligned Profile Info */}
      <div style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
        <Bell size={24} />
      </div>
      
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowProfile(!showProfile)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            SA
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>Super Admin</span>
        </button>

        {showProfile && (
          <div className="glass-panel" style={{ 
            position: 'absolute', 
            top: '120%', 
            right: '0', 
            width: '280px', 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(20px)',
            borderRadius: '16px', 
            boxShadow: 'var(--shadow-lg)', 
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(226, 232, 240, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <img src="https://i.pravatar.cc/150?u=johndoe" alt="Super Admin" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #3B82F6', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1E293B' }}>John Doe</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748B' }}>john@ctms.edu</p>
              <span style={{ fontSize: '0.7rem', background: '#DBEAFE', color: '#1D4ED8', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>MASTER ACCESS</span>
            </div>
            
            <div style={{ padding: '12px' }}>
              <button style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <User size={18} /> View Full Profile
              </button>
              <button style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#475569', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Settings size={18} /> System Settings
              </button>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid rgba(226, 232, 240, 0.5)' }} />
              <button style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <LogOut size={18} /> Secure Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
