import React, { useState } from 'react';
import { UserCog, Plus, Edit, Trash2, Info, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockData = [
  { 
    id: 'ADM-01', 
    name: 'John Doe', 
    email: 'john@ctms.edu', 
    role: 'Super Admin', 
    status: 'Active',
    details: { employeeId: 'E-1001', phone: '+1-555-0100', department: 'Central Administration', joinedDate: 'Jan 2020', image: 'https://i.pravatar.cc/150?u=johndoe', loginId: 'admin.john', password: 'password123', adminType: 'Super Admin', powers: ['all'] }
  },
  { 
    id: 'ADM-02', 
    name: 'Sarah Smith', 
    email: 'sarah@ctms.edu', 
    role: 'Dept Admin', 
    status: 'Active',
    details: { employeeId: 'E-1025', phone: '+1-555-0125', department: 'Mechanical Transport', joinedDate: 'Mar 2022', image: 'https://i.pravatar.cc/150?u=sarahsmith', loginId: 'admin.sarah', password: 'password123', adminType: 'Admin Section: Student & Parent', powers: ['view_students', 'edit_students'] }
  },
];

const AdminForm = ({ admin, sections, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    admin || { name: '', employeeId: '', phone: '', email: '', role: '', department: '', loginId: '', password: '', status: 'Active', adminType: 'Admin Section: Student & Parent', powers: [] }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const newPowers = checked 
        ? [...(formData.powers || []), value]
        : (formData.powers || []).filter(p => p !== value);
      setFormData(prev => ({ ...prev, powers: newPowers }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>System Role & Sector Designation</h3>
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <label style={labelStyle}>Assign to Sector / Access Level</label>
          <select 
            name="adminType" 
            value={formData.adminType || (formData.details?.adminType || (sections?.[0] ? `Admin Section: ${sections[0].name}` : ''))} 
            onChange={handleChange} 
            style={{...inputStyle, background: '#F0F9FF', border: '1px solid #7DD3FC', fontWeight: 600, color: '#0369A1'}}
          >
            {sections && sections.map(s => (
              <option key={s.id} value={`Admin Section: ${s.name}`}>{s.name} Sector</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, marginBottom: '4px' }}>Administrative Powers</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '8px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="manage_users" checked={formData.powers?.includes('manage_users')} onChange={handleChange} /> Manage Users</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="view_tracking" checked={formData.powers?.includes('view_tracking')} onChange={handleChange} /> View Live Tracking</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="assign_routes" checked={formData.powers?.includes('assign_routes')} onChange={handleChange} /> Assign Routes</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="resolve_issues" checked={formData.powers?.includes('resolve_issues')} onChange={handleChange} /> Resolve Issues</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="financial_reports" checked={formData.powers?.includes('financial_reports')} onChange={handleChange} /> Financial Reports</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="broadcast_emergency" checked={formData.powers?.includes('broadcast_emergency')} onChange={handleChange} /> Broadcast Emergency</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="provide_tasks" checked={formData.powers?.includes('provide_tasks')} onChange={handleChange} /> Provide Tasks to Staff</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="edit_tasks" checked={formData.powers?.includes('edit_tasks')} onChange={handleChange} /> Edit Staff Tasks</label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" name="powers" value="receive_reports" checked={formData.powers?.includes('receive_reports')} onChange={handleChange} /> Receive Staff Reports</label>
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Personal Information</h3>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input name="name" type="text" style={inputStyle} value={formData.name || ''} onChange={handleChange} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Employee ID</label>
            <input name="employeeId" type="text" style={inputStyle} value={formData.employeeId || (formData.details?.employeeId || '')} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input name="phone" type="text" style={inputStyle} value={formData.phone || (formData.details?.phone || '')} onChange={handleChange} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" style={inputStyle} value={formData.email || ''} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Role Header (e.g. Master)</label>
            <input name="role" type="text" placeholder="e.g. Dept Admin" style={inputStyle} value={formData.role || ''} onChange={handleChange} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Department</label>
            <input name="department" type="text" style={inputStyle} value={formData.department || (formData.details?.department || '')} onChange={handleChange} required />
          </div>
        </div>
      </div>

      {/* Login Credentials Section */}
      <div style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#0F172A' }}>Web Login Credentials</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Web Login ID</label>
            <input name="loginId" type="text" style={inputStyle} value={formData.loginId || (formData.details?.loginId || '')} onChange={handleChange} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Password</label>
            <input name="password" type="text" style={inputStyle} value={formData.password || (formData.details?.password || '')} onChange={handleChange} required />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', borderRadius: '6px' }}>Save Profile Details</button>
      </div>
    </form>
  );
};

const Admins = () => {
  const [data, setData] = useState(mockData);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const handleSave = (formData) => {
    if (editAdmin) {
      setData(prev => prev.map(a => a.id === editAdmin.id ? { 
        ...a, 
        name: formData.name, 
        email: formData.email, 
        role: formData.role, 
        details: { 
          ...a.details, 
          employeeId: formData.employeeId || formData.details?.employeeId, 
          phone: formData.phone || formData.details?.phone, 
          department: formData.department || formData.details?.department, 
          loginId: formData.loginId || formData.details?.loginId, 
          password: formData.password || formData.details?.password,
          adminType: formData.adminType || formData.details?.adminType,
          powers: formData.powers
        } 
      } : a));
      setSelectedAdmin(null);
    } else {
      const newAdmin = {
        id: `ADM-00${data.length + 1}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: 'Active',
        details: {
          employeeId: formData.employeeId,
          phone: formData.phone,
          department: formData.department,
          adminType: formData.adminType,
          powers: formData.powers,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          loginId: formData.loginId,
          password: formData.password,
          image: 'https://i.pravatar.cc/150?u=' + formData.name.replace(/\s/g, '')
        }
      };
      setData([...data, newAdmin]);
    }
    setShowAddModal(false);
    setEditAdmin(null);
  };

  const openEdit = (admin) => {
    setEditAdmin(admin);
    setShowAddModal(true);
  };

  const [sections, setSections] = useState([
    { id: 1, name: 'Driver Section', totalAdmins: 2, color: '#EF4444' },
    { id: 2, name: 'Coordinator Section', totalAdmins: 2, color: '#F59E0B' },
    { id: 3, name: 'Maintenance Section', totalAdmins: 1, color: '#8B5CF6' }
  ]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editSection, setEditSection] = useState(null);

  const handleSaveSection = (e) => {
    e.preventDefault();
    const name = e.target.sectionName.value;
    const incharges = Array.from(new FormData(e.target).getAll('sectionIncharge'));
    
    if (editSection) {
      setSections(prev => prev.map(s => s.id === editSection.id ? { ...s, name, leadAdmins: incharges } : s));
    } else {
      setSections([...sections, { id: Date.now(), name, leadAdmins: incharges, totalAdmins: 0, color: '#3B82F6' }]);
    }
    setShowSectionModal(false);
    setEditSection(null);
  };

  const handleDeleteSection = (id) => {
    if(window.confirm('Are you sure you want to delete this specific section?')){
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        
        <section className="page-content">
          {/* Admin Section Management Area */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Admin Sections</h2>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => { setEditSection(null); setShowSectionModal(true); }}
              >
                <Plus size={18} /> Add Section
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {sections.map(section => (
                <div key={section.id} style={{ 
                  background: '#fff', 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
                  borderTop: `4px solid ${section.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Card Header: Title + Edit/Delete */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{section.name}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        title="Edit Section"
                        onClick={(e) => { e.stopPropagation(); setEditSection(section); setShowSectionModal(true); }}
                        style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#C2410C', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button 
                        title="Delete Section"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{section.leadAdmins?.length || 0} Incharge(s) assigned</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <UserCog size={14} style={{ marginTop: '2px' }}/> 
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       {section.leadAdmins?.length > 0 
                         ? section.leadAdmins.map(la => <span key={la}>{la}</span>) 
                         : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Incharge Not Assigned</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                    <button 
                      onClick={() => { setEditSection(section); setShowSectionModal(true); }}
                      style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      <Plus size={14} style={{verticalAlign: 'middle'}}/> Add Incharge
                    </button>
                    <button 
                      onClick={() => setSections(prev => prev.map(s => s.id === section.id ? {...s, leadAdmins: []} : s))}
                      style={{ color: '#F59E0B', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={14} style={{verticalAlign: 'middle'}}/> Remove All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed #E2E8F0', margin: '2rem 0' }} />

          {/* Admin Profiles Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>List of Admins</h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage assigned regional and sectoral system admins</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditAdmin(null); setShowAddModal(true); }}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Admin
            </button>
          </div>

          {showSectionModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>{editSection ? 'Edit Admin Section' : 'Add New Admin Section'}</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.sectionName.value;
                  const incharges = Array.from(new FormData(e.target).getAll('sectionIncharge'));
                  if (editSection) {
                    setSections(prev => prev.map(s => s.id === editSection.id ? { ...s, name, leadAdmins: incharges } : s));
                  } else {
                    setSections([...sections, { id: Date.now(), name, leadAdmins: incharges, totalAdmins: 0, color: '#3B82F6' }]);
                  }
                  setShowSectionModal(false);
                  setEditSection(null);
                }}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Section Name</label>
                    <input name="sectionName" type="text" defaultValue={editSection?.name || ''} placeholder="e.g. Finance Section" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required />
                  </div>
                  {editSection && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Assign Section In-charge</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                        {data.filter(u => u.details?.adminType !== 'Super Admin').map(admin => (
                          <label key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              name="sectionIncharge" 
                              value={admin.name} 
                              defaultChecked={editSection?.leadAdmins?.includes(admin.name)}
                            /> {admin.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => { setShowSectionModal(false); setEditSection(null); }} className="btn" style={{ background: '#F3F4F6', color: 'var(--text-main)' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{editSection ? 'Update Section' : 'Create Section'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editAdmin ? <Edit size={24} color="var(--primary)" /> : <Plus size={24} color="var(--primary)" />}
                  {editAdmin ? 'Edit Admin' : 'Add New Admin'}
                </h2>
                <AdminForm 
                  admin={editAdmin} 
                  sections={sections}
                  onSave={handleSave} 
                  onCancel={() => { setShowAddModal(false); setEditAdmin(null); }} 
                />
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Admin Name</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Admin Section / Incharge</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.filter(u => u.details?.adminType !== 'Super Admin').map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: selectedAdmin?.id === user.id ? '#EFF6FF' : 'transparent'
                    }}
                    onClick={() => setSelectedAdmin(user)}
                    onMouseEnter={(e) => {
                      if (selectedAdmin?.id !== user.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAdmin?.id !== user.id) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <UserCog size={18} color="var(--primary)" /> {user.name}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.email}</td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-main)' }}>{user.role}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        backgroundColor: '#F0F9FF', 
                        border: '1px solid #7DD3FC', 
                        color: '#0369A1',
                        display: 'inline-block'
                      }}>
                        {user.details?.adminType || 'Super Admin (All)'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: user.status ? '#D1FAE5' : 'transparent', color: user.status ? '#065F46' : 'inherit' }}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '15px' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(user); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setData(prev => prev.filter(a => a.id !== user.id)); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedAdmin && (
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
                onClick={() => setSelectedAdmin(null)} 
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="var(--primary)" /> Profile Details: {selectedAdmin.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start', marginTop: '10px' }}>
                {selectedAdmin.details.image && (
                  <img 
                    src={selectedAdmin.details.image} 
                    alt="Avatar" 
                    style={{ width: '140px', height: '140px', borderRadius: '12px', objectFit: 'cover', border: `3px solid var(--primary)`, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                  />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '12px', fontSize: '1rem', flex: 1 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Email Address:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.email}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>System Role:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.role}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Access Level:</strong> <span style={{ fontWeight: 700, color: '#0369A1', background: '#F0F9FF', padding: '2px 8px', borderRadius: '4px' }}>{selectedAdmin.details.adminType || 'Super Admin'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Employee ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.employeeId}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Contact Phone:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.phone}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Department:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.department}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Joined Date:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.joinedDate}</span>

                  <strong style={{ color: 'var(--text-muted)' }}>Authorised Powers:</strong>
                  <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedAdmin.details.powers?.length 
                      ? selectedAdmin.details.powers.map(p => (
                        <span key={p} style={{ background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                           {p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      )) 
                      : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No specific powers assigned</span>
                    }
                  </span>

                  {/* Web Login Setup */}
                  <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#92400E', marginBottom: '6px', marginTop: '12px' }}>
                    Web Login Credentials & Access
                  </div>
                  <strong style={{ color: 'var(--text-muted)' }}>Login ID:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.loginId || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Password:</strong> <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedAdmin.details.password ? '••••••••' : 'Not Assigned'}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admins;
