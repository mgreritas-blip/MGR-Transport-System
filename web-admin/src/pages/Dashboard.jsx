import React, { useState, useEffect } from 'react';
import { BusFront, UserCog, GraduationCap, AlertTriangle, X, Info, LayoutDashboard, Bell, Calendar, Map as MapIcon, Car } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet marker icons not resolving properly in some React setups:
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockDetails = {
  vehicles: [
    { id: 'TN-45-AT-0012', col2: 'Downtown A', col3: 'Active', col4: 'View Specs', details: { image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=250&h=250&fit=crop', make: 'Tata Motors', capacity: '60 Seats', lastService: 'Oct 2025', nextService: 'Dec 2026' } },
    { id: 'TN-45-AT-1123', col2: 'Uptown B', col3: 'Maintenance', col4: 'View Specs', details: { image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f78?w=250&h=250&fit=crop', make: 'Ashok Leyland', capacity: '50 Seats', lastService: 'Jan 2026', nextService: 'Pending' } },
    { id: 'TN-45-AT-6654', col2: 'East Campus', col3: 'Active', col4: 'View Specs', details: { image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=250&h=250&fit=crop', make: 'Volvo', capacity: '45 Seats', lastService: 'Mar 2026', nextService: 'Jan 2027' } },
  ],
  drivers: [
    { id: 'Michael Johnson', col2: '+123456789', col3: 'BUS-01', col4: 'View Profile', details: { image: 'https://i.pravatar.cc/150?u=michael', name: 'Michael Johnson', license: 'TN-DL-123456', experience: '10 Years', status: 'On Duty' } },
    { id: 'Rob Vance', col2: '+987654321', col3: 'CAR-01', col4: 'View Profile', details: { image: 'https://i.pravatar.cc/150?u=rob', name: 'Rob Vance', license: 'TN-DL-654321', experience: '5 Years', status: 'Off Duty' } },
    { id: 'James Smith', col2: '+192837465', col3: 'BUS-02', col4: 'View Profile', details: { image: 'https://i.pravatar.cc/150?u=james', name: 'James Smith', license: 'TN-DL-987123', experience: '12 Years', status: 'On Leave' } },
  ],
  issues: [
    { id: 'Vehicle Breakdown', col2: 'BUS-02', col3: '10:45 AM', col4: 'Frank Lee', details: { image: 'https://i.pravatar.cc/150?u=frank', name: 'Frank Lee', role: 'Security Coordinator', phone: '+91 9876541230', empId: 'CRD-001' } },
    { id: 'Driver Absent', col2: 'BUS-05', col3: '09:00 AM', col4: 'Susan May', details: { image: 'https://i.pravatar.cc/150?u=susan', name: 'Susan May', role: 'Student Coordinator', phone: '+91 1230984567', empId: 'CRD-002' } },
  ],
  students: [
    { id: 'Alice Cooper', col2: 'Computer Science', col3: 'BUS-01', col4: 'View Info', details: { image: 'https://i.pravatar.cc/150?u=alice', name: 'Alice Cooper', rollNo: 'CS2026-001', studentContact: '+91 9000011111', year: '3rd Year', parentContact: '+91 9876543210' } },
    { id: 'Bob Marley', col2: 'Mechanical', col3: 'BUS-02', col4: 'View Info', details: { image: 'https://i.pravatar.cc/150?u=bob', name: 'Bob Marley', rollNo: 'ME2026-042', studentContact: '+91 9000022222', year: '2nd Year', parentContact: '+91 8765432109' } },
    { id: 'Charlie Brown', col2: 'Electrical', col3: 'BUS-03', col4: 'View Info', details: { image: 'https://i.pravatar.cc/150?u=charlie', name: 'Charlie Brown', rollNo: 'EE2026-105', studentContact: '+91 9000033333', year: '4th Year', parentContact: '+91 7654321098' } },
    { id: 'Diana Prince', col2: 'Civil', col3: 'BUS-01', col4: 'View Info', details: { image: 'https://i.pravatar.cc/150?u=diana', name: 'Diana Prince', rollNo: 'CV2026-088', studentContact: '+91 9000044444', year: '1st Year', parentContact: '+91 6543210987' } },
  ]
};

const formatKey = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

import { fetchVehicles, fetchUsers, fetchIssues } from '../api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    vehicles: 0,
    drivers: 0,
    issues: 0,
    students: 430 // Still mock for now
  });
  const [showNotiModal, setShowNotiModal] = useState(false);
  const [alertTab, setAlertTab] = useState('All');
  
  const [gpsData, setGpsData] = useState([
    { id: '124A', lat: 13.0827, lng: 80.2707, type: 'bus', lastMove: Date.now() },
    { id: '125B', lat: 13.0600, lng: 80.2500, type: 'bus', lastMove: Date.now() - 6000 },
    { id: '126C', lat: 13.0500, lng: 80.2800, type: 'car', lastMove: Date.now() },
  ]);

  const [ticker, setTicker] = useState(0);

  const loadStats = async () => {
    try {
      const vehicles = await fetchVehicles();
      const drivers = await fetchUsers('driver');
      const issues = await fetchIssues();
      setStats({
        vehicles: vehicles.length,
        drivers: drivers.length,
        issues: issues.length,
        students: 430
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Listen for real-time location updates
    import('../api').then(({ socket }) => {
      socket.on('busLocationChanged', (data) => {
        setGpsData(prev => {
          const index = prev.findIndex(v => v.id === data.vehicleId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], lat: data.lat, lng: data.lng, lastMove: Date.now() };
            return updated;
          }
          return [...prev, { id: data.vehicleId, lat: data.lat, lng: data.lng, type: 'bus', lastMove: Date.now() }];
        });
      });
    });

    const interval = setInterval(() => {
       setTicker(prev => prev + 1);
       // Mock movement for demo if no real data
       setGpsData(prev => prev.map(v => {
          if (v.id === '124A' || v.id === '126C') {
             return { ...v, lng: v.lng + 0.0001, lat: v.lat + 0.00005, lastMove: Date.now() }; 
          }
          return v; 
       }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Terminal monitoring & emergency fleet control</p>
            </div>
            <button 
              onClick={() => setShowNotiModal(true)}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
            >
              <Bell size={20} /> RAISE NOTIFICATION
            </button>
          </div>

          {/* NOTIFICATION MODAL */}
          {showNotiModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', width: '550px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                <button onClick={() => setShowNotiModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#B91C1C' }}>
                  <AlertTriangle size={28} /> Issue Formal Route Notification
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>SELECT TARGET ROUTE / ZONE</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
                        <option>All Zones (Tamil Nadu)</option>
                        <option>Chennai - Route 1</option>
                        <option>Chennai - Route 6 (TAMBARAM)</option>
                        <option>Arani - Route 1</option>
                        <option>Bangalore - Route 1</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>REASON / ALERT TYPE</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F9FAFB' }}>
                        <option>Bus Cancellation</option>
                        <option>Delay (Road/Tech)</option>
                        <option>Vehicle Change (Maintenance)</option>
                        <option>Driver Reassignment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} /> VALIDITY / DURATION (SPECIFIC DAYS)
                    </label>
                    <div style={{ display: 'flex', gap: '15px' }}>
                       <input type="date" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} defaultValue="2026-04-11" />
                       <span style={{ display: 'flex', alignItems: 'center' }}>to</span>
                       <input type="date" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} defaultValue="2026-04-11" />
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>This alert will disappear automatically after the specified period.</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>NOTIFICATION MESSAGE</label>
                    <textarea 
                      placeholder="Enter the official message for students and parents..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '100px', resize: 'none' }}
                    ></textarea>
                  </div>

                  <button 
                    onClick={() => { alert('Emergency Broadcast Sent!'); setShowNotiModal(false); }}
                    style={{ padding: '16px', background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}
                  >
                    SEND NOTIFICATION TO ALL MEMBERS
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="widgets-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div 
              className={`widget-card glass-panel`} 
              onClick={() => window.location.href = '/vehicles'} 
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="widget-icon" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                <BusFront />
              </div>
              <div className="widget-info">
                <h3>Active Vehicles</h3>
                <p>{stats.vehicles} / {stats.vehicles + 3}</p>
              </div>
            </div>
            
            <div 
              className={`widget-card glass-panel`} 
              onClick={() => window.location.href = '/drivers'} 
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="widget-icon" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
                <UserCog />
              </div>
              <div className="widget-info">
                <h3>Active Drivers</h3>
                <p>{stats.drivers}</p>
              </div>
            </div>
            
            <div 
              className={`widget-card glass-panel`} 
              onClick={() => window.location.href = '/issues'} 
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="widget-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <AlertTriangle />
              </div>
              <div className="widget-info">
                <h3>System Issues</h3>
                <p>{stats.issues}</p>
              </div>
            </div>

            <div 
              className="widget-card glass-panel"
              onClick={() => window.location.href = '/routes'}
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="widget-icon" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                <Bell />
              </div>
              <div className="widget-info">
                <h3>Active Alerts</h3>
                <p style={{ color: '#B91C1C' }}>Route Updates</p>
              </div>
            </div>
            
            <div 
              className={`widget-card glass-panel`} 
              onClick={() => window.location.href = '/students'} 
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="widget-icon" style={{ backgroundColor: '#F3E8FF', color: '#7E22CE' }}>
                <GraduationCap />
              </div>
              <div className="widget-info">
                <h3>Students Boarded</h3>
                <p>{stats.students}</p>
              </div>
            </div>
          </div>

          {/* ATTENDANCE INSIGHTS / REPORTING SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(254,226,226,0.3))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Bell size={20} /> Overall Route Alerts
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     {['All', 'Cancelled', 'Delayed', 'Route Blockage'].map(tab => (
                        <button 
                           key={tab} 
                           onClick={() => setAlertTab(tab)}
                           style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: alertTab === tab ? '#B91C1C' : '#fff', color: alertTab === tab ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {[
                  { type: 'Cancelled', label: '🔴 CHENNAI ROUTE 6', message: 'Bus cancelled for today due to technical issue.', time: 'Valid: Apr 11, 2026 only', color: '#EF4444' },
                  { type: 'Delayed', label: '🟡 ARANI ZONE (GLOBAL)', message: 'All routes delayed by 30 mins due to weather.', time: 'From: Apr 11 → Apr 12', color: '#F59E0B' },
                  { type: 'Route Blockage', label: '🔵 BANGALORE ROUTE 1', message: 'Traffic diversion due to road maintenance block.', time: 'Expected Delay: +45 mins', color: '#3B82F6' },
                  { type: 'Cancelled', label: '🔴 ARANI ROUTE 2', message: 'Trip temporarily suspended due to driver absence.', time: 'Valid: Morning Trip', color: '#EF4444' },
                  { type: 'Delayed', label: '🟡 CHENNAI ROUTE 1', message: 'Minor delay due to high traffic volume downtown.', time: 'Expected Delay: +15 mins', color: '#F59E0B' }
                ].filter(a => alertTab === 'All' || a.type === alertTab).map((alert, i) => (
                  <div key={i} style={{ padding: '16px', background: '#fff', borderRadius: '12px', borderLeft: `6px solid ${alert.color}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <div style={{ fontSize: '0.8rem', fontWeight: 800, color: alert.color }}>{alert.label}</div>
                       <div style={{ fontSize: '0.7rem', color: '#fff', background: alert.color, padding: '4px 10px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>{alert.type}</div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{alert.message}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                       <Calendar size={14} /> {alert.time}
                    </div>
                  </div>
                ))}
                
                {/* Empty State Fallback */}
                {[].filter(a => alertTab === 'All' || a.type === alertTab).length === 0 && (
                   <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.5)', borderRadius: '10px' }}>
                      <p style={{ fontWeight: 600 }}>No current alerts for {alertTab}.</p>
                   </div>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BusFront size={18} /> Zone-based Attendance Monitor
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 {[
                   { zone: 'Chennai (9 Routes)', rate: '94%', color: '#3B82F6', bar: '94%' },
                   { zone: 'Arani (5 Routes)', rate: '88%', color: '#10B981', bar: '88%' },
                   { zone: 'Bangalore (5 Routes)', rate: '91%', color: '#7C3AED', bar: '91%' }
                 ].map(z => (
                   <div key={z.zone}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 600 }}>
                       <span>{z.zone}</span>
                       <span style={{ color: z.color }}>{z.rate}</span>
                     </div>
                     <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: z.bar, height: '100%', background: z.color }}></div>
                     </div>
                   </div>
                 ))}
               </div>
               <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                 Aggregated attendance status for <strong>State-wide</strong> fleet operations.
               </p>
            </div>
          </div>





          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapIcon size={24} color="var(--primary)" /> Global Fleet Tracking
              </h2>
              <span style={{ color: 'var(--success)', background: '#dcfce7', padding: '6px 12px', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulse 2s infinite' }}></span>
                Live Updates Active
              </span>
            </div>
            
            <div className="map-container" style={{ flex: 1, borderRadius: '8px', background: '#e5e7eb', position: 'relative', overflow: 'hidden' }}>
              <style>{`
                .leaflet-container { width: 100%; height: 100%; z-index: 1; }
                .custom-vehicle-marker { background: transparent; border: none; }
                @keyframes mapPing {
                  0% { box-shadow: 0 0 0 0 rgba(var(--ping-color), 0.7); }
                  70% { box-shadow: 0 0 0 10px rgba(var(--ping-color), 0); }
                  100% { box-shadow: 0 0 0 0 rgba(var(--ping-color), 0); }
                }
              `}</style>
              
              <MapContainer center={[13.0600, 80.2600]} zoom={12} scrollWheelZoom={true}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                
                {gpsData.map(v => {
                  const timeIdle = Date.now() - v.lastMove;
                  const isIdle = timeIdle > 5000;
                  const pinColor = isIdle ? '#EF4444' : '#10B981'; // Red if idle > 5s, else Green
                  
                  // Simple SVG raw strings to embed correctly inside leaflet divIcon
                  const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
                  const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6 2 7"/><path d="M10 6h4"/><path d="M22 7l-2-1"/><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 19v2"/></svg>`;

                  const htmlIcon = `
                    <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-10px);">
                      <div style="background: #1F2937; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; margin-bottom: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 6px; white-space: nowrap; font-family: sans-serif;">
                        ${v.type === 'car' ? carSvg : busSvg} 
                        ${v.id}
                      </div>
                      <div style="width: 20px; height: 20px; background: ${pinColor}; border-radius: 50%; border: 3px solid #fff; --ping-color: ${isIdle ? '239, 68, 68' : '16, 185, 129'}; animation: ${isIdle ? 'none' : 'mapPing 1.5s infinite'}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
                    </div>
                  `;

                  const customIcon = L.divIcon({
                    className: 'custom-vehicle-marker',
                    html: htmlIcon,
                    iconSize: [60, 60],
                    iconAnchor: [30, 30] // Centers the absolute positioned element
                  });

                  return (
                    <Marker key={v.id} position={[v.lat, v.lng]} icon={customIcon}>
                      <Popup>
                        <strong>Vehicle: {v.id}</strong><br/>
                        Type: {v.type.toUpperCase()}<br/>
                        Status: <strong style={{ color: pinColor }}>{isIdle ? 'IDLE' : 'MOVING'}</strong>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Dynamic Left Control Panel Overlay */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.95)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', width: '280px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', zIndex: 1000 }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>Live Fleet Filter</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Zone Selection</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', background: '#F9FAFB', fontWeight: 500 }}>
                    <option>All Zones</option>
                    <option>Chennai Zone</option>
                    <option>Arani Zone</option>
                    <option>Bangalore Zone</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Route Selection</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', background: '#F9FAFB', fontWeight: 500 }}>
                    <option>All Routes</option>
                    <option>Route 1 (Main)</option>
                    <option>Route 6 (Tambaram)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Vehicle Selection</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', background: '#F9FAFB', fontWeight: 500 }}>
                     <option>All Active Vehicles</option>
                     <option>TN 01- C05578 (124A)</option>
                     <option>TN 01- C05579 (125B)</option>
                  </select>
                </div>
                
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default Dashboard;
