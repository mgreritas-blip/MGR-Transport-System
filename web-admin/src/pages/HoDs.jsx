import React, { useState } from 'react';
import { Crown, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockData = [
  { 
    id: 'HOD-001', 
    name: 'Dr. Ramesh Kumar', 
    phone: '9876509876', 
    department: 'Computer Science & Engineering', 
    status: 'Active',
    details: { email: 'ramesh.k@drmgr.edu', location: 'CS Block, Room 201', shift: 'Full-Day', joinedDate: 'Jun 2019', image: 'https://i.pravatar.cc/150?u=rameshkumar', loginId: 'hod.ramesh', password: 'password123' }
  },
  { 
    id: 'HOD-002', 
    name: 'Dr. Priya Natarajan', 
    phone: '9012345678', 
    department: 'Mechanical Engineering', 
    status: 'Active',
    details: { email: 'priya.n@drmgr.edu', location: 'Mech Block, Room 105', shift: 'Full-Day', joinedDate: 'Jan 2020', image: 'https://i.pravatar.cc/150?u=priyanat', loginId: 'hod.priya', password: 'password123' }
  },
  { 
    id: 'HOD-003', 
    name: 'Dr. Santhosh Iyer', 
    phone: '8765432190', 
    department: 'Electrical Engineering', 
    status: 'Inactive',
    details: { email: 'santhosh.i@drmgr.edu', location: 'EE Block, Room 301', shift: 'Full-Day', joinedDate: 'Mar 2021', image: 'https://i.pravatar.cc/150?u=santhoshiyer', loginId: 'hod.santhosh', password: 'password123' }
  },
];

const HoDs = () => {
  const [data, setData] = useState(mockData);
  const [selectedHoD, setSelectedHoD] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editHoD, setEditHoD] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editHoD) {
      setData(prev => prev.map(c => c.id === editHoD.id ? {
        ...c,
        name: formData.get('name'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        details: {
          ...c.details,
          email: formData.get('email'),
          location: formData.get('location'),
          shift: formData.get('shift'),
          loginId: formData.get('loginId'),
          password: formData.get('password')
        }
      } : c));
      setSelectedHoD(prev => prev?.id === editHoD.id ? {
        ...prev,
        name: formData.get('name'), phone: formData.get('phone'), department: formData.get('department'),
        details: { ...prev.details, email: formData.get('email'), location: formData.get('location'), shift: formData.get('shift'), loginId: formData.get('loginId'), password: formData.get('password') }
      } : prev);
    } else {
      const newHoD = {
        id: `HOD-00${data.length + 1}`,
        name: formData.get('name'),
        phone: formData.get('phone'),
        department: formData.get('department'),
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
      setData([...data, newHoD]);
    }
    setShowAddModal(false);
    setEditHoD(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={28} color="#7C3AED" /> HoD Management
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Manage Head of Department accounts, login credentials, and department assignments</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditHoD(null); setShowAddModal(true); }} style={{ background: '#7C3AED', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add HoD
            </button>
          </div>

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editHoD ? <Edit size={24} color="#7C3AED" /> : <Plus size={24} color="#7C3AED" />}
                  {editHoD ? 'Edit HoD' : 'Add New HoD'}
                </h2>
                <form onSubmit={handleSave}>
                  {/* Designation Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Designation</h3>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assigned Designation</label>
                      <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#F3F4F6', color: '#374151', fontWeight: 600 }} value="Head of Department (HoD)" disabled />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name</label>
                        <input name="name" type="text" defaultValue={editHoD?.name || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Work ID Number</label>
                        <input name="workId" type="text" defaultValue={editHoD?.id || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone</label>
                        <input name="phone" type="text" defaultValue={editHoD?.phone || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" defaultValue={editHoD?.details?.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Department</label>
                      <input name="department" type="text" placeholder="e.g. Computer Science & Engineering" defaultValue={editHoD?.department || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location / Office</label>
                        <input name="location" type="text" defaultValue={editHoD?.details?.location || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Shift</label>
                        <input name="shift" type="text" defaultValue={editHoD?.details?.shift || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>App Login Credentials</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Login ID</label>
                        <input name="loginId" type="text" defaultValue={editHoD?.details?.loginId || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Password</label>
                        <input name="password" type="text" defaultValue={editHoD?.details?.password || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => { setShowAddModal(false); setEditHoD(null); }} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px', background: '#7C3AED' }}>Save HoD</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>HoD Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Phone</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Department</th>
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
                      backgroundColor: selectedHoD?.id === user.id ? '#F5F3FF' : 'transparent'
                    }}
                    onClick={() => setSelectedHoD(user)}
                    onMouseEnter={(e) => {
                      if (selectedHoD?.id !== user.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedHoD?.id !== user.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crown size={18} color="#7C3AED" /> {user.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>{user.phone}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{user.department}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: user.status === 'Active' ? '#D1FAE5' : '#FEE2E2', color: user.status === 'Active' ? '#065F46' : '#991B1B' }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setEditHoD(user); setShowAddModal(true); }} style={{ background: 'none', border: 'none', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
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

          {selectedHoD && (
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #DDD6FE', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              borderTop: '4px solid #7C3AED',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <button 
                onClick={() => setSelectedHoD(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="#7C3AED" /> Profile Details: {selectedHoD.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedHoD.details.image && (
                  <img 
                    src={selectedHoD.details.image} 
                    alt="Avatar" 
                    style={{ width: '140px', height: '140px', borderRadius: '12px', objectFit: 'cover', border: `3px solid #7C3AED`, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '12px', fontSize: '1rem', flex: 1 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Email Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.email}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Contact Phone:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.phone}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Department:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.department}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Office Location:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.location}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Shift:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.shift}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Joined Date:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.joinedDate}</span>
                  
                  {/* App Login Setup */}
                  <div style={{ gridColumn: '1 / -1', background: '#F5F3FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#5B21B6', marginBottom: '6px', marginTop: '12px' }}>
                    App Login Credentials
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedHoD.details.password ? '••••••••' : 'Not Assigned'}</span>

                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HoDs;
