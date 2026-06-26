import React, { useState, useEffect } from 'react';
import { BusFront, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';

import { fetchVehicles, createVehicle } from '../api';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (vehicle) => {
    try {
      if (editVehicle) {
        // Update existing vehicle (not implemented in backend yet, but would go here)
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v));
      } else {
        const newVehicle = await createVehicle(vehicle);
        setVehicles(prev => [...prev, newVehicle]);
      }
      setIsModalOpen(false);
      setEditVehicle(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Vehicle Management</h1>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Vehicle
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Vehicle No</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Circle No</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Type</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Route</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Halt Records</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: selectedVehicle?.id === v.id ? '#F0FDF4' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BusFront size={18} color="var(--primary)" /> {v.number}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
                      {v.circleNumber}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>{v.type} ({v.capacity} seats)</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{v.route}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backgroundColor: v.status === 'Active' ? '#D1FAE5' : '#FEF3C7',
                        color: v.status === 'Active' ? '#065F46' : '#92400E'
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {v.haltedCount || 0} times
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer' }}
                        onClick={() => { setEditVehicle(v); setIsModalOpen(true); }}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        onClick={() => setVehicles(prev => prev.filter(item => item.id !== v.id))}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Vehicle Detail Panel */}
            {selectedVehicle && (
              <div style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #BFDBFE',
                borderTop: '4px solid var(--primary)',
                marginTop: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                position: 'relative',
                animation: 'fadeIn 0.3s ease-in-out'
              }}>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                  <Info size={22} color="var(--primary)" /> Complete Vehicle Details: {selectedVehicle.number}
                </h3>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '15px' }}>
                  <img
                    src={selectedVehicle.image || `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&fit=crop`}
                    alt="Vehicle"
                    style={{ width: '250px', height: '200px', borderRadius: '12px', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr minmax(140px, auto) 1fr', gap: '15px', fontSize: '0.95rem', flex: 1, alignItems: 'center' }}>
                    
                    <div style={{ gridColumn: '1 / -1', background: '#EFF6FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#1D4ED8', marginBottom: '4px' }}>
                      Basic Information
                    </div>
                    <strong style={{ color: 'var(--text-muted)' }}>Circle Number:</strong> <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{selectedVehicle.circleNumber || 'Not Assigned'}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Type/Capacity:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.type} ({selectedVehicle.capacity} Seats)</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Assigned Route:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.route}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Current Status:</strong> <span style={{ fontWeight: 600, color: selectedVehicle.status === 'Active' ? '#059669' : '#D97706' }}>{selectedVehicle.status}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>RC Details:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.rcDetails || 'Not Available'}</span>
                    
                    <div style={{ gridColumn: '1 / -1', background: '#FDF2F8', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#BE185D', marginBottom: '4px', marginTop: '10px' }}>
                      Technical & Maintenance records
                    </div>
                    <strong style={{ color: 'var(--text-muted)' }}>Chassis Number:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.chassisNumber || 'Not Available'}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Purchase Date:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.purchaseDate || 'Not Available'}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Maintenance Due:</strong> <span style={{ color: '#E11D48', fontWeight: 600 }}>{selectedVehicle.maintenanceDueDate || 'Not Available'}</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Kilometers Run:</strong> <span style={{ fontWeight: 500 }}>{Number(selectedVehicle.kmRun || 0).toLocaleString()} km</span>
                    <strong style={{ color: 'var(--text-muted)' }}>Halted History:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.haltedCount || '0'} times</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setEditVehicle(null); }}
              title={editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            >
              <VehicleForm
                vehicle={editVehicle}
                onSave={handleSave}
                onCancel={() => { setIsModalOpen(false); setEditVehicle(null); }}
              />
            </Modal>

          </section>
        </main>
      </div>
    );
};

export default Vehicles;

// VehicleForm component (inline for simplicity)
const VehicleForm = ({ vehicle, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    vehicle || { 
      number: '', circleNumber: '', type: '', capacity: '', route: '', status: 'Active',
      chassisNumber: '', purchaseDate: '', maintenanceDueDate: '', rcDetails: '', kmRun: 0
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem' };
  const labelStyle = { fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Vehicle Number</label>
          <input name="number" placeholder="TN-XX-XX-XXXX" value={formData.number} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Vehicle Circle Number</label>
          <input name="circleNumber" placeholder="e.g. 124A" value={formData.circleNumber} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type (Bus/Car)</label>
          <input name="type" placeholder="Bus" value={formData.type} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Capacity (Seats)</label>
          <input name="capacity" type="number" value={formData.capacity} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Route</label>
          <input name="route" placeholder="Assigned Route" value={formData.route} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Chassis Number</label>
          <input name="chassisNumber" placeholder="Chassis No." value={formData.chassisNumber} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Purchase Date</label>
          <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Maintenance Due Date</label>
          <input name="maintenanceDueDate" type="date" value={formData.maintenanceDueDate} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>RC Details</label>
          <input name="rcDetails" placeholder="RC Verification String" value={formData.rcDetails} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Kilometers Run</label>
          <input name="kmRun" type="number" value={formData.kmRun} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Vehicle Image (Upload Local Device)</label>
          <input name="imageFile" type="file" accept="image/jpeg, image/png" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px dashed #93C5FD', backgroundColor: '#EFF6FF', fontSize: '1rem', cursor: 'pointer' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>Save Details</button>
      </div>
    </form>
  );
};
