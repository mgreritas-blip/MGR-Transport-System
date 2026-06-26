import React, { useState } from 'react';
import { Map as MapIcon, Plus, Edit, Trash2, X, Image as ImageIcon, AlertTriangle, Bell, Calendar } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockData = [
  { id: 'RT-01', route: 'Chennai Route 1', zone: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Anna Nagar', vehicleNumber: 'TN 01- C05578', circleNumber: '124A', activeBuses: 2, notifications: 'Normal Operation', alertsList: [{ id: 1, type: 'Maintenance Request', msg: 'AC cooling issue reported.', date: '2026-04-10' }, { id: 2, type: 'Traffic Warning', msg: 'Anna Nagar main road closed.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-06', route: 'Chennai Route 6', zone: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Tambaram', vehicleNumber: 'TN 01- C05579', circleNumber: '125B', activeBuses: 3, notifications: '⚠️ 2h Delay (Technical)', alertsList: [{ id: 3, type: '2h Delay (Technical)', msg: 'Engine alternator belt broke.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-10', route: 'Arani Route 1', zone: 'Arani', district: 'Tiruvannamalai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Arani Town', vehicleNumber: 'TN 01- B03322', circleNumber: '126C', activeBuses: 1, notifications: 'Normal Operation', alertsList: [], mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-11', route: 'Arani Route 2', zone: 'Arani', district: 'Tiruvannamalai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Arani West', vehicleNumber: 'TN 01- B03325', circleNumber: '127D', activeBuses: 1, notifications: '❌ Cancelled (Today)', alertsList: [{ id: 4, type: 'Cancelled (Today)', msg: 'Driver is on sick leave and no spare available.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-15', route: 'Bangalore Route 1', zone: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka', start: 'Main Campus', end: 'Majestic', vehicleNumber: 'KA 01- M01021', circleNumber: '128E', activeBuses: 1, notifications: 'Normal Operation', alertsList: [], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
];

const Routes = () => {
  const [data, setData] = React.useState(mockData);
  const [viewAlertsList, setViewAlertsList] = useState(null); // Which route's alerts we're viewing

  React.useEffect(() => { setData(mockData) }, []);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [alertRoute, setAlertRoute] = useState(null); // Active route selected for notification
  const [activeZoneTab, setActiveZoneTab] = useState('All');

  const zones = ['All', 'Chennai', 'Arani', 'Bangalore'];
  const filteredData = activeZoneTab === 'All' ? data : data.filter(r => r.zone === activeZoneTab);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1>Route Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Regional fleet monitoring and route-based notifications</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddZoneModal(true)} style={{ background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Plus size={18} style={{ marginRight: '8px' }} /> Add Zone
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ background: 'var(--primary)', padding: '10px 15px', borderRadius: '8px', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Plus size={18} style={{ marginRight: '8px' }} /> Add New Route
              </button>
            </div>
          </div>

          {/* ZONE TABS */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            {zones.map(z => (
              <button 
                key={z}
                onClick={() => setActiveZoneTab(z)}
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  background: activeZoneTab === z ? 'var(--primary)' : 'transparent',
                  color: activeZoneTab === z ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {z} Zone
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: selectedRoute ? '2' : '1', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', transition: 'flex 0.3s' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Location / Zone</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Route Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Vehicle No</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Circle No</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Live Notifications</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Alerts</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: selectedRoute?.id === item.id ? '#EFF6FF' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setSelectedRoute(item)}
                    onMouseEnter={(e) => {
                      if (selectedRoute?.id !== item.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRoute?.id !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2px' }}>{item.state}</div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.zone}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{item.route}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                       {item.vehicleNumber}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                       {item.circleNumber}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                       <span style={{ 
                         fontSize: '11px', 
                         fontWeight: 700, 
                         color: item.notifications.includes('Normal') ? 'var(--success)' : 'var(--danger)',
                         background: item.notifications.includes('Normal') ? '#dcfce7' : '#fee2e2',
                         padding: '4px 10px',
                         borderRadius: '20px'
                       }}>
                         {item.notifications}
                       </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                       <button 
                          onClick={() => setViewAlertsList(item)}
                          style={{
                             background: item.alertsList.length > 0 ? '#FEF2F2' : '#F3F4F6',
                             color: item.alertsList.length > 0 ? '#DC2626' : 'var(--text-muted)',
                             border: `2px solid ${item.alertsList.length > 0 ? '#FECACA' : '#E5E7EB'}`,
                             borderRadius: '8px', padding: '4px 12px', fontSize: '1rem', fontWeight: 800,
                             cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                       >
                         {item.alertsList.length}
                       </button>
                       <button 
                         onClick={() => setAlertRoute(item)}
                         style={{ background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800 }}
                       >
                          🔔 RAISE
                       </button>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }} onClick={(e) => e.stopPropagation()}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRoute && (
            <div style={{ flex: '1', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '1.5rem', border: '1px solid #BFDBFE', position: 'relative', borderTop: '4px solid var(--primary)' }}>
              <button 
                onClick={() => setSelectedRoute(null)} 
                style={{ position: 'absolute', top: '15px', right: '15px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <MapIcon size={22} color="var(--primary)" /> Route Info: {selectedRoute.route}
              </h3>
              <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: '15px' }}>
                <img src={selectedRoute.mapImage} alt={`Map`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>State:</strong> {selectedRoute.state}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>District:</strong> {selectedRoute.district}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>Zone:</strong> {selectedRoute.zone}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>Vehicle No:</strong> {selectedRoute.vehicleNumber}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>Circle No:</strong> {selectedRoute.circleNumber}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>From:</strong> {selectedRoute.start}</div>
                <div style={{ background: '#F8FAFC', padding: '8px', borderRadius: '6px' }}><strong>To:</strong> {selectedRoute.end}</div>
              </div>

              {selectedRoute.notifications && !selectedRoute.notifications.includes('Normal') && (
                <div style={{ marginTop: '1.5rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} /> Active Alerts Log for Vehicle {selectedRoute.circleNumber}
                  </h4>
                  <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #B91C1C', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#B91C1C' }}>{selectedRoute.notifications}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}><strong>Vehicle Number:</strong> {selectedRoute.vehicleNumber}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status broadcasted system-wide. Resolves when validity expires.</span>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {showAddZoneModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={24} color="var(--primary)" /> Add New Zone
                </h2>
                <form onSubmit={(e) => { e.preventDefault(); setShowAddZoneModal(false); }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Zone Name</label>
                    <input type="text" placeholder="e.g. Madurai Zone" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>District</label>
                    <input type="text" placeholder="e.g. Madurai" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>State</label>
                    <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required>
                      <option>Tamil Nadu</option>
                      <option>Karnataka</option>
                      <option>Andhra Pradesh</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowAddZoneModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px', fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none' }}>Save Zone</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={24} color="var(--primary)" /> Add New Route Location
                </h2>
                <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>State</label>
                      <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required>
                        <option>Tamil Nadu</option>
                        <option>Karnataka</option>
                        <option>Andhra Pradesh</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>District</label>
                      <input type="text" placeholder="e.g. Chennai" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Zone Name</label>
                    <input type="text" placeholder="e.g. Chennai Zone" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Route Name</label>
                    <input type="text" placeholder="e.g. Chennai Route 10" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Start Point</label>
                      <input type="text" placeholder="e.g. Main Campus" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Destination</label>
                      <input type="text" placeholder="e.g. Velachery" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Vehicle Number</label>
                      <input type="text" placeholder="e.g. TN-45-AT-1234" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Vehicle Circle Number</label>
                      <input type="text" placeholder="e.g. C-105" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Route Map Image (JPEG)</label>
                    <input type="file" accept="image/jpeg" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed var(--primary)', backgroundColor: '#F9FAFB' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px', fontWeight: 700 }}>Save Data</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* RAISE NOTIFICATION MODAL */}
          {alertRoute && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', width: '550px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                <button onClick={() => setAlertRoute(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                <h2 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#B91C1C', fontSize: '1.4rem' }}>
                  <AlertTriangle size={28} /> Target Notification: {alertRoute.route}
                </h2>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const alertType = e.target.elements.alertType.value;
                  const prefix = alertType.includes('Cancel') ? '❌' : '⚠️';
                  
                  const newAlert = { id: Date.now(), type: alertType, msg: e.target.elements.msg?.value || 'No message provided', date: new Date().toISOString().split('T')[0] };
                  
                  // Update data list notification message
                  setData(prev => prev.map(item => {
                    if (item.id === alertRoute.id) {
                       return { ...item, notifications: `${prefix} ${alertType}`, alertsList: [...item.alertsList, newAlert] };
                    }
                    return item;
                  }));
                  
                  alert('Notification successfully broadcasted to Route Members.');
                  setAlertRoute(null);
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>TARGET</label>
                        <input type="text" value={`${alertRoute.route} Students & Staff`} disabled style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#F9FAFB', fontWeight: 600, color: 'var(--text-main)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>REASON / ALERT TYPE</label>
                        <select name="alertType" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff' }}>
                          <option value="Cancelled (Today)">Bus Cancellation</option>
                          <option value="2h Delay (Road/Tech)">2h Delay (Road/Tech)</option>
                          <option value="Vehicle Change">Vehicle Change (Maintenance)</option>
                          <option value="Minor Delay (Traffic)">Minor Delay (Traffic)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> VALIDITY / DURATION (SPECIFIC DAYS)
                      </label>
                      <div style={{ display: 'flex', gap: '15px' }}>
                         <input type="date" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} defaultValue={new Date().toISOString().split('T')[0]} />
                         <span style={{ display: 'flex', alignItems: 'center' }}>to</span>
                         <input type="date" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }} defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>This status will automatically revert to Normal Operation after this period.</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>NOTIFICATION MESSAGE (Optional Customization)</label>
                      <textarea 
                        name="msg"
                        placeholder="Enter the official message for students and parents..."
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '80px', resize: 'none' }}
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      style={{ padding: '16px', background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      <Bell size={20} /> SEND NOTIFICATION
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW ALERTS LIST MODAL */}
          {viewAlertsList && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', width: '550px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }}>
                <button onClick={() => setViewAlertsList(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#B91C1C', fontSize: '1.4rem' }}>
                  <AlertTriangle size={28} /> Active Alerts: {viewAlertsList.route}
                </h2>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vehicle: {viewAlertsList.vehicleNumber} ({viewAlertsList.circleNumber})</p>

                {viewAlertsList.alertsList && viewAlertsList.alertsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {viewAlertsList.alertsList.map(alertObj => (
                      <div key={alertObj.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '15px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 800, color: '#B91C1C', fontSize: '0.9rem' }}>{alertObj.type}</span>
                          <span style={{ fontSize: '0.75rem', color: 'white', background: '#374151', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>{alertObj.date}</span>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>{alertObj.msg}</p>
                        <div style={{ display: 'flex', gap: '10px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                          <button 
                            onClick={() => {
                              const newMsg = prompt("Edit alert message:", alertObj.msg);
                              if (newMsg !== null && newMsg.trim() !== '') {
                                setData(prev => prev.map(item => {
                                  if (item.id === viewAlertsList.id) {
                                    const updatedAlerts = item.alertsList.map(a => a.id === alertObj.id ? { ...a, msg: newMsg } : a);
                                    const updatedItem = { ...item, alertsList: updatedAlerts };
                                    setViewAlertsList(updatedItem); // Hot update modal UI
                                    return updatedItem;
                                  }
                                  return item;
                                }));
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to permanently delete this alert?")) {
                                setData(prev => prev.map(item => {
                                  if (item.id === viewAlertsList.id) {
                                    const filteredAlerts = item.alertsList.filter(a => a.id !== alertObj.id);
                                    // Also clear Notifications if alerts are empty
                                    const newNotifications = filteredAlerts.length === 0 ? 'Normal Operation' : item.notifications;
                                    const updatedItem = { ...item, alertsList: filteredAlerts, notifications: newNotifications };
                                    setViewAlertsList(updatedItem); // Hot update modal UI
                                    return updatedItem;
                                  }
                                  return item;
                                }));
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                     <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>There are no active alerts running for this route.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default Routes;
