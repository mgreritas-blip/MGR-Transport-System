import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockData = [
  { 
    id: 'PAR-01', 
    name: 'Charles Cooper', 
    phone: '+1 111-111-1111', 
    student: 'Alice Cooper',
    details: {
      email: 'charles.coop@example.com',
      occupation: 'Software Engineer',
      homeAddress: '123 Tech Street, Downtown',
      loginId: 'par.charles',
      password: 'password123',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&h=250&fit=crop',
      studentData: {
        name: 'Alice Cooper',
        rollNo: 'CS2026-001',
        dept: 'Computer Science',
        bus: 'BUS-01',
        payment: 'Paid',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&h=250&fit=crop'
      }
    }
  },
  { 
    id: 'PAR-02', 
    name: 'David Marley', 
    phone: '+1 222-222-2222', 
    student: 'Bob Marley',
    details: {
      email: 'david.marley@example.com',
      occupation: 'Business Owner',
      homeAddress: '456 Engine Road, Uptown',
      loginId: 'par.david',
      password: 'password123',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&fit=crop',
      studentData: {
        name: 'Bob Marley',
        rollNo: 'ME2026-042',
        dept: 'Mechanical',
        bus: 'BUS-02',
        payment: 'Pending (Under Review)',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&h=250&fit=crop'
      }
    }
  },
];

const Parents = () => {
  const [data, setData] = useState(mockData);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editParent, setEditParent] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editParent) {
      setData(prev => prev.map(p => p.id === editParent.id ? {
        ...p,
        name: formData.get('name'),
        phone: formData.get('phone'),
        student: formData.get('student'),
        details: {
          ...p.details,
          email: formData.get('email'),
          occupation: formData.get('occupation') + (formData.get('workId') ? ` (ID: ${formData.get('workId')})` : ''),
          homeAddress: formData.get('address'),
          loginId: formData.get('loginId'),
          password: formData.get('password'),
          studentData: {
            ...p.details.studentData,
            name: formData.get('student'),
            rollNo: formData.get('studentRollNo')
          }
        }
      } : p));
      setSelectedParent(prev => prev?.id === editParent.id ? {
        ...prev, name: formData.get('name'), phone: formData.get('phone'), student: formData.get('student'),
        details: { ...prev.details, email: formData.get('email'), occupation: formData.get('occupation') + (formData.get('workId') ? ` (ID: ${formData.get('workId')})` : ''), homeAddress: formData.get('address'), loginId: formData.get('loginId'), password: formData.get('password'), studentData: { ...prev.details.studentData, name: formData.get('student'), rollNo: formData.get('studentRollNo') } }
      } : prev);
    } else {
      const newParent = {
        id: `PAR-0${data.length + 1}`,
        name: formData.get('name'),
        phone: formData.get('phone'),
        student: formData.get('student'),
        details: {
          email: formData.get('email'),
          occupation: formData.get('occupation') + (formData.get('workId') ? ` (ID: ${formData.get('workId')})` : ''),
          homeAddress: formData.get('address'),
          loginId: formData.get('loginId'),
          password: formData.get('password'),
          image: 'https://i.pravatar.cc/150?u=' + formData.get('name').replace(/\s/g, ''),
          studentData: {
            name: formData.get('student'),
            rollNo: formData.get('studentRollNo'),
            dept: 'To Be Assigned',
            bus: 'To Be Assigned',
            payment: 'Pending',
            image: 'https://i.pravatar.cc/150?u=' + formData.get('student').replace(/\s/g, '')
          }
        }
      };
      setData([...data, newParent]);
    }
    setShowAddModal(false);
    setEditParent(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Parent / Guardian Management</h1>
            <button className="btn btn-primary" onClick={() => { setEditParent(null); setShowAddModal(true); }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Parent
            </button>
          </div>

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editParent ? <Edit size={24} color="#D97706" /> : <Plus size={24} color="#D97706" />}
                  {editParent ? 'Edit Parent' : 'Add New Parent'}
                </h2>
                <form onSubmit={handleSave}>
                  {/* Designation Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Designation</h3>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assigned Designation</label>
                      <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#F3F4F6', color: '#374151', fontWeight: 600 }} value="Parent / Guardian" disabled />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Parent Name</label>
                      <input name="name" type="text" defaultValue={editParent?.name || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone</label>
                        <input name="phone" type="text" defaultValue={editParent?.phone || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                        <input name="email" type="email" defaultValue={editParent?.details?.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Occupation</label>
                        <input name="occupation" type="text" defaultValue={editParent?.details?.occupation?.split(' (ID:')[0] || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Work ID Number</label>
                        <input name="workId" type="text" defaultValue={editParent?.details?.occupation?.includes('(ID:') ? editParent.details.occupation.split('(ID: ')[1].replace(')', '') : ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Address</label>
                      <input name="address" type="text" defaultValue={editParent?.details?.homeAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Profile Image (JPG)</label>
                      <input name="imageFile" type="file" accept="image/jpeg" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border)', background: '#F9FAFB', cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Student Information Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Student Connection</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Student Name</label>
                        <input name="student" type="text" defaultValue={editParent?.student || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Student Roll No.</label>
                        <input name="studentRollNo" type="text" defaultValue={editParent?.details?.studentData?.rollNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>App Login Credentials</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Login ID</label>
                        <input name="loginId" type="text" defaultValue={editParent?.details?.loginId || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Password</label>
                        <input name="password" type="text" defaultValue={editParent?.details?.password || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => { setShowAddModal(false); setEditParent(null); }} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save Parent</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Parent Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Phone Number</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Associated Student</th>
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
                      backgroundColor: selectedParent?.id === user.id ? '#FFFBEB' : 'transparent'
                    }}
                    onClick={() => setSelectedParent(user)}
                    onMouseEnter={(e) => {
                      if (selectedParent?.id !== user.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedParent?.id !== user.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <Users size={18} color="#D97706" /> {user.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontWeight: 500 }}>{user.phone}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.student}</td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setEditParent(user); setShowAddModal(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setData(prev => prev.filter(p => p.id !== user.id)); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedParent && (
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #FDE68A', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              borderTop: '4px solid #D97706',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <button 
                onClick={() => setSelectedParent(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="#D97706" /> Guardian Profile: {selectedParent.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedParent.details.image && (
                  <img 
                    src={selectedParent.details.image} 
                    alt="Parent Avatar" 
                    style={{ width: '130px', height: '130px', borderRadius: '12px', objectFit: 'cover', border: `3px solid #D97706`, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '10px', fontSize: '1rem', flex: 1, alignItems: 'center' }}>
                  
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px' }}>
                    Parent Information
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Email Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.email}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Primary Contact:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.phone}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Occupation:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.occupation}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Home Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.homeAddress}</span>

                  {/* App Login Setup */}
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px', marginTop: '12px' }}>
                    App Login Credentials
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.password ? '••••••••' : 'Not Assigned'}</span>

                </div>
              </div>

              {/* Sub-Card for Associated Student Details */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start', padding: '15px 20px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                 <img src={selectedParent.details.studentData.image} alt="Student" style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #94A3B8' }} />
                 <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, auto) 1fr', gap: '8px', fontSize: '0.95rem', flex: 1 }}>
                    <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                      Associated Student File
                    </div>
                    <strong style={{ color: 'var(--text-muted)' }}>Student Name:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.studentData.name}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Roll Number:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.studentData.rollNo}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Department:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedParent.details.studentData.dept}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Current Status:</strong> <span style={{ fontWeight: 600, color: selectedParent.details.studentData.payment === 'Paid' ? '#059669' : '#D97706' }}>{selectedParent.details.studentData.payment}</span>
                 </div>
              </div>

            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Parents;
