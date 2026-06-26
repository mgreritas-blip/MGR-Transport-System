import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';

import { fetchUsers, createUser } from '../api';

const getStatusStyles = (status) => {
  if (status === 'active') return { bg: '#D1FAE5', text: '#065F46' };
  if (status === 'inactive') return { bg: '#E5E7EB', text: '#4B5563' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const Drivers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const drivers = await fetchUsers('driver');
      // Map backend structure to UI structure
      const mapped = drivers.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        vehicle: d.assignedVehicle?.number || 'Not Assigned',
        status: d.status,
        details: {
          employeeId: d.id.substring(0, 8).toUpperCase(),
          licenseNumber: d.license || 'N/A',
          licenseExpiry: 'N/A',
          experience: 'N/A',
          address: 'N/A',
          image: `https://i.pravatar.cc/150?u=${d.id}`,
          staffType: 'Driver',
          loginId: d.email,
          password: d.password,
          shiftData: {}
        }
      }));
      setData(mapped);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (driverData) => {
    try {
      if (editDriver) {
        // Update logic (not in backend yet)
        setData(prev => prev.map(d => d.id === driverData.id ? { ...d, ...driverData } : d));
      } else {
        const newUser = await createUser({
          ...driverData,
          role: 'driver',
          email: driverData.loginId + '@ctms.edu', // Mock email for login
          password: driverData.password,
          license: driverData.licenseNumber || 'TBD'
        });
        setData(prev => [...prev, newUser]);
      }
      setIsModalOpen(false);
      setEditDriver(null);
    } catch (error) {
      console.error('Error saving driver:', error);
    }
  };

  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Driver & Staff Management</h1>
            <button className="btn btn-primary" onClick={() => { setEditDriver(null); setIsModalOpen(true); }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Staff / Driver
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Staff Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Phone</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Assigned Vehicle</th>
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
                      backgroundColor: selectedStaff?.id === user.id ? '#F0FDF4' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setSelectedStaff(user)}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCog size={18} color="var(--primary)" /> {user.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.phone}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-main)' }}>{user.vehicle}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: user.status === 'Active' ? '#D1FAE5' : '#E5E7EB', color: user.status === 'Active' ? '#065F46' : '#374151' }}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                        onClick={() => { setEditDriver(user); setIsModalOpen(true); }}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                        onClick={() => setData(prev => prev.filter(item => item.id !== user.id))}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedStaff && (
            <div style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid #A7F3D0', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              borderTop: '4px solid #059669',
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
              <button 
                onClick={() => setSelectedStaff(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="#059669" /> Staff Master Records: {selectedStaff.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedStaff.details.image && (
                  <img 
                    src={selectedStaff.details.image} 
                    alt="Staff Avatar" 
                    style={{ width: '150px', height: '150px', borderRadius: '12px', objectFit: 'cover', border: `3px solid #059669`, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, auto) 1fr', gap: '10px', fontSize: '1rem', flex: 1, alignItems: 'center' }}>
                  
                  {/* General Profile Section */}
                  <div style={{ gridColumn: '1 / -1', background: '#D1FAE5', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#065F46', marginBottom: '6px' }}>
                    Employment Profile
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Registered Phone:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.phone}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Employee ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.employeeId}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>License Number:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.licenseNumber}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>License Expiry:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.licenseExpiry}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Work Experience:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.experience}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Residential Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.address}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Staff Type:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.staffType || 'Driver'}</span>

                  {/* Login Credentials Section */}
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px', marginTop: '12px' }}>
                    App Login Credentials
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.details.password ? '••••••••' : 'Not Assigned'}</span>

                  {/* Operational Section */}
                  <div style={{ gridColumn: '1 / -1', background: '#E0E7FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#3730A3', marginBottom: '6px', marginTop: '12px' }}>
                    Operational Duty Details
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Current Status:</strong> 
                  <span style={{ fontWeight: 700, color: getStatusStyles(selectedStaff.status).text }}>
                    {selectedStaff.status}
                  </span>
                  <strong style={{ color: 'var(--text-muted)' }}>Assigned Vehicle:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedStaff.vehicle}</span>
                  
                  {Object.entries(selectedStaff.details.shiftData).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <strong style={{ color: 'var(--text-muted)' }}>{formatKey(key)}:</strong> 
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{value}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
          </section>

          {/* Add / Edit Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditDriver(null); }}
            title={editDriver ? 'Edit Staff / Driver' : 'Add Staff / Driver'}
          >
            <DriverForm
              driver={editDriver}
              onSave={handleSave}
              onCancel={() => { setIsModalOpen(false); setEditDriver(null); }}
            />
          </Modal>

        </main>
      </div>
    );
};

export default Drivers;

// DriverForm component (inline)
const DriverForm = ({ driver, onSave, onCancel }) => {
  const initialData = driver ? {
    id: driver.id,
    name: driver.name || '',
    phone: driver.phone || '',
    vehicle: driver.vehicle || '',
    status: driver.status || 'Active',
    workId: driver.details?.employeeId || '',
    staffType: driver.details?.staffType || '',
    loginId: driver.details?.loginId || '',
    password: driver.details?.password || ''
  } : { name: '', phone: '', vehicle: '', status: 'Active', workId: '', staffType: '', loginId: '', password: '' };

  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 500 };

  return (
    <form onSubmit={handleSubmit}>
      {/* Designation Section */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Designation</h3>
        <div style={{ width: '100%' }}>
          <label style={labelStyle}>Staff Designation</label>
          <select name="staffType" value={formData.staffType || ''} onChange={handleChange} required style={inputStyle}>
            <option value="">Select Designation</option>
            <option value="Driver">Bus Driver</option>
            <option value="Maintenance Team">Maintenance Team</option>
            <option value="Helper">Staff Helper</option>
            <option value="Mechanic">Mechanic</option>
          </select>
        </div>
      </div>

      {/* Personal Information Section */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Staff Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Work ID Number</label>
            <input name="workId" value={formData.workId || ''} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Phone</label>
          <input name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Profile Image (JPG)</label>
          <input name="imageFile" type="file" accept="image/jpeg" style={{ ...inputStyle, border: '1px dashed var(--border)', background: '#F9FAFB' }} />
        </div>
      </div>

      {/* Operational Section */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Operational Status</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Assigned Vehicle</label>
            <input name="vehicle" value={formData.vehicle} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Current Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="Active">Active</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Login Credentials Section */}
      <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>App Login Credentials</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>App Login ID</label>
            <input name="loginId" value={formData.loginId || ''} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>App Password</label>
            <input name="password" type="text" value={formData.password || ''} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save Staff</button>
      </div>
    </form>
  );
};
