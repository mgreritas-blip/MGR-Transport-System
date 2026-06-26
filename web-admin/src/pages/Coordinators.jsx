import React, { useState } from 'react';
import { Component, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockData = [
  { 
    id: 'CRD-001', 
    name: 'Frank Lee', 
    phone: '9876541230', 
    role: 'Security Coordinator', 
    status: 'Active',
    details: { email: 'frank@ctms.edu', location: 'Gate 1', shift: 'Morning', joinedDate: 'Feb 2021', image: 'https://i.pravatar.cc/150?u=franklee', loginId: 'crd.frank', password: 'password123' }
  },
  { 
    id: 'CRD-002', 
    name: 'Susan May', 
    phone: '1230984567', 
    role: 'Student Coordinator', 
    status: 'Inactive',
    details: { email: 'susan@ctms.edu', location: 'Main Block', shift: 'Evening', joinedDate: 'Aug 2022', image: 'https://i.pravatar.cc/150?u=susanmay', loginId: 'crd.susan', password: 'password123' }
  },
];

const Coordinators = () => {
  const [data, setData] = useState(mockData);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCoordinator, setEditCoordinator] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editCoordinator) {
      setData(prev => prev.map(c => c.id === editCoordinator.id ? {
        ...c,
        name: formData.get('name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        details: {
          ...c.details,
          email: formData.get('email'),
          location: formData.get('location'),
          shift: formData.get('shift'),
          loginId: formData.get('loginId'),
          password: formData.get('password')
        }
      } : c));
      setSelectedCoordinator(prev => prev?.id === editCoordinator.id ? {
        ...prev,
        name: formData.get('name'), phone: formData.get('phone'), role: formData.get('role'),
        details: { ...prev.details, email: formData.get('email'), location: formData.get('location'), shift: formData.get('shift'), loginId: formData.get('loginId'), password: formData.get('password') }
      } : prev);
    } else {
      const newCoordinator = {
        id: `CRD-00${data.length + 1}`,
        name: formData.get('name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        status: 'Active',
        details: {
          email: formData.get('email'),
          location: formData.get('location'),
          shift: formData.get('shift'),
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          loginId: formData.get('loginId'),
          password: formData.get('password'),
          image: 'https://i.pravatar.cc/150?u=' + formData.get('name').replace(/\s/g, '')
        }
      };
      setData([...data, newCoordinator]);
    }
    setShowAddModal(false);
    setEditCoordinator(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Coordinator Management</h1>
            <button className="btn btn-primary" onClick={() => { setEditCoordinator(null); setShowAddModal(true); }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Coordinator
            </button>
          </div>

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editCoordinator ? <Edit size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
                  {editCoordinator ? 'Edit Coordinator' : 'Add New Coordinator'}
                </h2>
                <form onSubmit={handleSave}>
                  {/* Designation Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Designation</h3>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assigned Designation</label>
                      <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#F3F4F6', color: '#374151', fontWeight: 600 }} value="Coordinator" disabled />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name</label>
                        <input name="name" type="text" defaultValue={editCoordinator?.name || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Work ID Number</label>
                        <input name="workId" type="text" defaultValue={editCoordinator?.id || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone</label>
                        <input name="phone" type="text" defaultValue={editCoordinator?.phone || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" defaultValue={editCoordinator?.details?.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Profile Image (JPG)</label>
                      <input name="imageFile" type="file" accept="image/jpeg" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border)', background: '#F9FAFB', cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Operational Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Operational Details</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Role / Title</label>
                      <input name="role" type="text" placeholder="e.g. Area Coordinator" defaultValue={editCoordinator?.role || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location</label>
                        <input name="location" type="text" defaultValue={editCoordinator?.details?.location || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Shift</label>
                        <input name="shift" type="text" defaultValue={editCoordinator?.details?.shift || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>App Login Credentials</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Login ID</label>
                        <input name="loginId" type="text" defaultValue={editCoordinator?.details?.loginId || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Password</label>
                        <input name="password" type="text" defaultValue={editCoordinator?.details?.password || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => { setShowAddModal(false); setEditCoordinator(null); }} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save Coordinator</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Coordinator Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Phone</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: selectedCoordinator?.id === user.id ? '#EFF6FF' : 'transparent'
                    }}
                    onClick={() => setSelectedCoordinator(user)}
                    onMouseEnter={(e) => {
                      if (selectedCoordinator?.id !== user.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCoordinator?.id !== user.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Component size={18} color="var(--primary)" /> {user.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>{user.phone}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{user.role}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: user.status === 'Active' ? '#D1FAE5' : '#FEE2E2', color: user.status === 'Active' ? '#065F46' : '#991B1B' }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setEditCoordinator(user); setShowAddModal(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setData(prev => prev.filter(c => c.id !== user.id)); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedCoordinator && (
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #BFDBFE', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              borderTop: '4px solid var(--primary)',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <button 
                onClick={() => setSelectedCoordinator(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="var(--primary)" /> Profile Details: {selectedCoordinator.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedCoordinator.details.image && (
                  <img 
                    src={selectedCoordinator.details.image} 
                    alt="Avatar" 
                    style={{ width: '140px', height: '140px', borderRadius: '12px', objectFit: 'cover', border: `3px solid var(--primary)`, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '12px', fontSize: '1rem', flex: 1 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Email Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.email}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Contact Phone:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.phone}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>System Role:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.role}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Location:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.location}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Shift:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.shift}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Joined Date:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.joinedDate}</span>
                  
                  {/* App Login Setup */}
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px', marginTop: '12px' }}>
                    App Login Credentials
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedCoordinator.details.password ? '••••••••' : 'Not Assigned'}</span>

                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Coordinators;
