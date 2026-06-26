import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

import { fetchUsers, createUser } from '../api';

const getPaymentStyles = (status) => {
  if (status === 'Paid') return { bg: '#D1FAE5', text: '#065F46' };
  if (status === 'Pending') return { bg: '#FEF3C7', text: '#D97706' };
  if (status === 'Issue') return { bg: '#FEE2E2', text: '#DC2626' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const Students = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const students = await fetchUsers('student');
      const mapped = students.map(s => ({
        id: s.id,
        name: s.name,
        dept: s.department || 'N/A',
        bus: s.assignedVehicle?.number || 'Not Assigned',
        payment: s.paymentStatus || 'Paid',
        details: {
          studentInfo: {
            rollNumber: s.id.substring(0, 8).toUpperCase(),
            studentPhone: s.phone || 'N/A',
            parentPhone: 'N/A',
            currentYear: s.year || 'N/A',
            residentialAddress: 'N/A'
          },
          paymentInfo: { lastPaymentDate: 'N/A', totalAmountPaid: 'N/A', amountPending: 'N/A', nextTermDue: 'N/A' },
          loginId: s.email,
          password: s.password,
          image: `https://i.pravatar.cc/150?u=${s.id}`
        }
      }));
      setData(mapped);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (editStudent) {
      setData(prev => prev.map(s => s.id === editStudent.id ? {
        ...s,
        name: formData.get('name'),
        dept: formData.get('dept'),
        bus: formData.get('bus'),
        payment: formData.get('payment'),
        details: {
          ...s.details,
          studentInfo: {
            ...s.details.studentInfo,
            rollNumber: formData.get('rollNumber'),
            studentPhone: formData.get('phone'),
            currentYear: formData.get('year'),
            residentialAddress: formData.get('address')
          },
          loginId: formData.get('loginId'),
          password: formData.get('password')
        }
      } : s));
      setSelectedStudent(prev => prev?.id === editStudent.id ? {
        ...prev, name: formData.get('name'), dept: formData.get('dept'), bus: formData.get('bus'), payment: formData.get('payment'),
        details: { ...prev.details, studentInfo: { ...prev.details.studentInfo, rollNumber: formData.get('rollNumber'), studentPhone: formData.get('phone'), currentYear: formData.get('year'), residentialAddress: formData.get('address') }, loginId: formData.get('loginId'), password: formData.get('password') }
      } : prev);
    } else {
      const newStudent = {
        id: `STU-00${data.length + 1}`,
        name: formData.get('name'),
        dept: formData.get('dept'),
        bus: formData.get('bus'),
        payment: formData.get('payment'),
        details: {
          studentInfo: {
            rollNumber: formData.get('rollNumber'),
            studentPhone: formData.get('phone'),
            parentPhone: '+91 9999999999',
            currentYear: formData.get('year'),
            residentialAddress: formData.get('address')
          },
          paymentInfo: { lastPaymentDate: 'N/A', totalAmountPaid: '₹0', amountPending: 'N/A', nextTermDue: 'N/A' },
          loginId: formData.get('loginId'),
          password: formData.get('password'),
          image: 'https://i.pravatar.cc/150?u=' + formData.get('name').replace(/\s/g, '')
        }
      };
      setData([...data, newStudent]);
    }
    setShowAddModal(false);
    setEditStudent(null);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Student Management</h1>
            <button className="btn btn-primary" onClick={() => { setEditStudent(null); setShowAddModal(true); }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Student
            </button>
          </div>

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editStudent ? <Edit size={24} color="#9333EA" /> : <Plus size={24} color="#9333EA" />}
                  {editStudent ? 'Edit Student' : 'Add New Student'}
                </h2>
                <form onSubmit={handleSave}>
                  {/* Designation Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Designation</h3>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assigned Designation</label>
                      <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#F3F4F6', color: '#374151', fontWeight: 600 }} value="Student" disabled />
                    </div>
                  </div>

                  {/* Personal Information Section */}
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Student Name</label>
                      <input name="name" type="text" defaultValue={editStudent?.name || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>University Registration ID</label>
                        <input name="rollNumber" type="text" defaultValue={editStudent?.details?.studentInfo?.rollNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Department</label>
                        <input name="dept" type="text" defaultValue={editStudent?.dept || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assigned Bus</label>
                        <input name="bus" type="text" defaultValue={editStudent?.bus || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Year</label>
                        <input name="year" type="text" defaultValue={editStudent?.details?.studentInfo?.currentYear || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Address</label>
                      <input name="address" type="text" defaultValue={editStudent?.details?.studentInfo?.residentialAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                    </div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone</label>
                        <input name="phone" type="text" defaultValue={editStudent?.details?.studentInfo?.studentPhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Payment Status</label>
                        <select name="payment" defaultValue={editStudent?.payment || 'Paid'} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Issue">Issue</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Profile Image (JPG)</label>
                      <input name="imageFile" type="file" accept="image/jpeg" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border)', background: '#F9FAFB', cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Login Credentials Section */}
                  <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>App Login Credentials</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>App Login ID</label>
                        <input name="loginId" type="text" defaultValue={editStudent?.details?.loginId || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
                        <input name="password" type="text" defaultValue={editStudent?.details?.password || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => { setShowAddModal(false); setEditStudent(null); }} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save Student</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Student Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Department</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Assigned Bus</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Payment</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => {
                  const pStyles = getPaymentStyles(user.payment);
                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        backgroundColor: selectedStudent?.id === user.id ? '#FAF5FF' : 'transparent'
                      }}
                      onClick={() => setSelectedStudent(user)}
                      onMouseEnter={(e) => {
                        if (selectedStudent?.id !== user.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (selectedStudent?.id !== user.id) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                        <GraduationCap size={18} color="#9333EA" /> {user.name}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.dept}</td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-main)' }}>{user.bus}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: pStyles.bg, color: pStyles.text }}>
                          {user.payment}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); setEditStudent(user); setShowAddModal(true); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                          <Edit size={16} /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setData(prev => prev.filter(s => s.id !== user.id)); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selectedStudent && (
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #E9D5FF', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              borderTop: '4px solid #9333EA',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="#9333EA" /> Student Complete Record: {selectedStudent.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedStudent.details.image && (
                  <img 
                    src={selectedStudent.details.image} 
                    alt="Professional Avatar" 
                    style={{ width: '160px', height: '160px', borderRadius: '12px', objectFit: 'cover', border: `3px solid #9333EA`, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, auto) 1fr', gap: '10px', fontSize: '1rem', flex: 1, alignItems: 'center' }}>
                  
                  {/* Student Information Section */}
                  <div style={{ gridColumn: '1 / -1', background: '#F3E8FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#6B21A8', marginBottom: '6px' }}>
                    Student Information
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Assigned Dept:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStudent.dept}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Bus Route / Van:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStudent.bus}</span>
                  {Object.entries(selectedStudent.details.studentInfo).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <strong style={{ color: 'var(--text-muted)' }}>{formatKey(key)}:</strong> 
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{value}</span>
                    </React.Fragment>
                  ))}
                  
                  {/* Payment Details Section */}
                  <div style={{ gridColumn: '1 / -1', background: '#E0E7FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#3730A3', marginBottom: '6px', marginTop: '12px' }}>
                    Payment & Fee Details
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Overall Status:</strong> 
                  <span style={{ fontWeight: 700, color: getPaymentStyles(selectedStudent.payment).text }}>
                    {selectedStudent.payment}
                  </span>
                  {Object.entries(selectedStudent.details.paymentInfo).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <strong style={{ color: 'var(--text-muted)' }}>{formatKey(key)}:</strong> 
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{value}</span>
                    </React.Fragment>
                  ))}

                  {/* App Login Setup */}
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px', marginTop: '12px' }}>
                    App Login Credentials
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStudent.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStudent.details.password ? '••••••••' : 'Not Assigned'}</span>

                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Students;
