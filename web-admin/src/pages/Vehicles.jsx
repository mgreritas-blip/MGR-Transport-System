import React, { useState, useEffect, useRef } from 'react';
import {
  BusFront, Plus, Edit, Trash2, Info, X, Users, UserCheck,
  Search, CheckSquare, Square, ChevronDown, ChevronUp,
  RefreshCw, UserCog, Phone, Hash, CheckCircle, Car
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import { socket } from '../api';
import {
  fetchVehicles, createVehicle, fetchUsers,
  fetchVehicleMembers, assignVehicleMembers, removeVehicleMember,
  updateVehicle
} from '../api';

// ─── Multi-select with search ────────────────────────────────────────────────
const MultiSelect = ({ label, icon, items, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    (i.id && i.id.toLowerCase().includes(query.toLowerCase()))
  );
  const allSelected = filtered.length > 0 && filtered.every(i => selected.includes(i.id));

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  const toggleAll = () => {
    const ids = filtered.map(i => i.id);
    if (allSelected) onChange(selected.filter(id => !ids.includes(id)));
    else onChange([...new Set([...selected, ...ids])]);
  };

  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label} {items.length > 0 && <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>({items.length} available)</span>}
      </label>
      <div onClick={() => setOpen(o => !o)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', userSelect: 'none' }}>
        <span style={{ color: selected.length ? '#1e293b' : '#9ca3af', fontSize: 13 }}>
          {selected.length ? `${selected.length} of ${items.length} selected` : placeholder}
        </span>
        {open ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid #D1D5DB', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: 300, display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or ID..."
              style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
            {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0 }}>×</button>}
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={toggleAll}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {allSelected ? <CheckSquare size={15} color="var(--primary)" /> : <Square size={15} color="#9ca3af" />}
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Select All ({filtered.length})</span>
            </div>
            {selected.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onChange([]); }}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '20px 12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No {label.toLowerCase()} in database</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No results for "{query}"</div>
            ) : filtered.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: selected.includes(item.id) ? '#EFF6FF' : 'transparent', borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}>
                {selected.includes(item.id) ? <CheckSquare size={15} color="var(--primary)" /> : <Square size={15} color="#9ca3af" />}
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: selected.includes(item.id) ? 'var(--primary)' : '#e2e8f0', color: selected.includes(item.id) ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{item.id.slice(0, 12)}… {item.phone ? `| ${item.phone}` : ''} {item.department ? `| ${item.department}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ padding: '7px 12px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#1d4ed8', background: '#EFF6FF', fontWeight: 600 }}>
              {selected.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Single-select searchable (for driver) ────────────────────────────────────
const SingleSelect = ({ label, icon, items, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    (i.id && i.id.toLowerCase().includes(query.toLowerCase()))
  );
  const selectedItem = items.find(i => i.id === selected);

  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label} {items.length > 0 && <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>({items.length} drivers)</span>}
      </label>
      <div onClick={() => setOpen(o => !o)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', userSelect: 'none', border: selected ? '1px solid #3b82f6' : '1px solid #D1D5DB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedItem ? (
            <>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EA580C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>{selectedItem.name.charAt(0)}</div>
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{selectedItem.name}</span>
            </>
          ) : <span style={{ color: '#9ca3af', fontSize: 13 }}>{placeholder}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {selected && <button onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
          {open ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
        </div>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid #D1D5DB', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', maxHeight: 280, display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color="#6b7280" />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search driver by name or ID..."
              style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '20px 12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No drivers in database</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No results</div>
            ) : filtered.map(item => (
              <div key={item.id} onClick={() => { onChange(item.id); setOpen(false); }}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: selected === item.id ? '#FFF7ED' : 'transparent', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EA580C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{item.id.slice(0, 12)}… {item.phone ? `| ${item.phone}` : ''} {item.license ? `| Lic: ${item.license}` : ''}</div>
                </div>
                {selected === item.id && <CheckCircle size={14} color="#EA580C" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Assigned Members Section (in detail panel) ───────────────────────────────
const AssignedMembersSection = ({ vehicle, onViewAll, onRemoveMember }) => {
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [newStudentIds, setNewStudentIds] = useState([]);
  const [newCoordIds, setNewCoordIds] = useState([]);
  const [newDriverId, setNewDriverId] = useState('');
  const [students, setStudents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const data = await fetchVehicleMembers(vehicle.id); setMembers(data); }
    catch (_) { setMembers(null); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Load ALL users of each role for full selection list
    fetchUsers('student').then(setStudents).catch(() => {});
    fetchUsers('coordinator').then(setCoordinators).catch(() => {});
    fetchUsers('driver').then(setDrivers).catch(() => {});
  }, [vehicle.id]);

  useEffect(() => {
    const handler = (d) => { if (d.vehicleId === vehicle.id) load(); };
    socket.on('vehicleMembersUpdated', handler);
    return () => socket.off('vehicleMembersUpdated', handler);
  }, [vehicle.id]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await assignVehicleMembers(vehicle.id, {
        studentIds: newStudentIds,
        coordinatorIds: newCoordIds,
        driverId: newDriverId || undefined,
        adminName: 'Super Admin'
      });
      setNewStudentIds([]); setNewCoordIds([]); setNewDriverId('');
      setShowAssign(false);
      await load();
    } catch (_) {}
    setAssigning(false);
  };

  const secHead = (bg, color, icon, label) => (
    <div style={{ gridColumn: '1 / -1', background: bg, padding: '7px 12px', borderRadius: 8, fontWeight: 700, color, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
      {icon} {label}
    </div>
  );
  const chip = (label, sub, onDel) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#1d4ed8', marginRight: 8, marginBottom: 8 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      {sub && <span style={{ color: '#64748b' }}>{sub}</span>}
      {onDel && <button onClick={onDel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0, lineHeight: 1, marginLeft: 2, fontSize: 15 }}>×</button>}
    </div>
  );

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', padding: '8px 14px', borderRadius: 8, fontWeight: 700, color: '#166534', fontSize: 13, marginBottom: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={15} /> Assigned Members</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowAssign(s => !s)}
            style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Assign Members
          </button>
          <button onClick={load} style={{ background: 'none', border: '1px solid #86efac', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#166534' }}>
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Assign panel */}
      {showAssign && (
        <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 12 }}>
            <SingleSelect
              label="Assign Driver"
              icon={<UserCheck size={13} />}
              items={drivers}
              selected={newDriverId}
              onChange={setNewDriverId}
              placeholder="Search & select driver..."
            />
            <MultiSelect
              label="Add Students"
              icon={<Users size={13} />}
              items={students}
              selected={newStudentIds}
              onChange={setNewStudentIds}
              placeholder="Search students..."
            />
            <MultiSelect
              label="Add Coordinators"
              icon={<UserCog size={13} />}
              items={coordinators}
              selected={newCoordIds}
              onChange={setNewCoordIds}
              placeholder="Search coordinators..."
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAssign}
              disabled={assigning || (!newDriverId && newStudentIds.length === 0 && newCoordIds.length === 0)}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: assigning ? 0.6 : 1 }}>
              {assigning ? 'Saving…' : `Save (${(newDriverId ? 1 : 0) + newStudentIds.length + newCoordIds.length} changes)`}
            </button>
            <button onClick={() => setShowAssign(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>Loading members…</div>}

      {!loading && members && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr minmax(140px, auto) 1fr', gap: '10px 16px', fontSize: '0.9rem', alignItems: 'start' }}>

          {/* Driver */}
          {secHead('#FFF7ED', '#C2410C', <UserCheck size={13} />, 'Assigned Driver (GPS Source)')}
          {members.driver ? (
            <div style={{ gridColumn: '1 / -1', background: '#FFF7ED', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 20, alignItems: 'center', border: '1px solid #FED7AA' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EA580C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                {members.driver.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{members.driver.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', gap: 16 }}>
                  <span><Hash size={11} style={{ verticalAlign: 'middle' }} /> {members.driver.driverId.slice(0, 8)}…</span>
                  {members.driver.phone && <span><Phone size={11} style={{ verticalAlign: 'middle' }} /> {members.driver.phone}</span>}
                  {members.driver.license && <span>License: {members.driver.license}</span>}
                </div>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>GPS Active</span>
            </div>
          ) : (
            <div style={{ gridColumn: '1 / -1', color: '#94a3b8', fontSize: 13, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⚠ No Driver — GPS Inactive</span>
              <button onClick={() => setShowAssign(true)} style={{ background: 'none', border: '1px solid #EA580C', color: '#EA580C', borderRadius: 8, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Assign Driver</button>
            </div>
          )}

          {/* Coordinators */}
          {secHead('#F5F3FF', '#6D28D9', <UserCog size={13} />, `Assigned Coordinators (${members.coordinatorCount})`)}
          <div style={{ gridColumn: '1 / -1', paddingTop: 4 }}>
            {members.coordinators.length === 0
              ? <span style={{ color: '#94a3b8', fontSize: 13 }}>No coordinators assigned</span>
              : members.coordinators.map(c => chip(c.name, c.phone || c.coordinatorId.slice(0, 8), () => onRemoveMember(vehicle.id, 'coordinator', c.coordinatorId)))
            }
          </div>

          {/* Students */}
          {secHead('#EFF6FF', '#1D4ED8', <Users size={13} />, `Assigned Students (${members.studentCount})`)}
          <div style={{ gridColumn: '1 / -1' }}>
            {members.students.length === 0
              ? <span style={{ color: '#94a3b8', fontSize: 13 }}>No students assigned</span>
              : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Name', 'ID', 'Class/Section', 'Pickup Point', ''].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.students.slice(0, 5).map(s => (
                        <tr key={s.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                          <td style={{ padding: '7px 10px', color: '#64748b', fontSize: 11 }}>{s.studentId.slice(0, 8)}…</td>
                          <td style={{ padding: '7px 10px', color: '#374151' }}>{s.class || '—'}</td>
                          <td style={{ padding: '7px 10px', color: '#374151' }}>{s.pickupPoint || '—'}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <button onClick={() => onRemoveMember(vehicle.id, 'student', s.studentId)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {members.studentCount > 5 && (
                    <button onClick={() => onViewAll(members)} style={{ marginTop: 10, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={13} /> View All {members.studentCount} Members
                    </button>
                  )}
                </>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
};

// ─── View All Members Modal ───────────────────────────────────────────────────
const ViewAllModal = ({ members, onClose, onRemove }) => {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const allItems = [
    ...(members.driver ? [{ type: 'driver', id: members.driver.driverId, name: members.driver.name, sub: members.driver.phone }] : []),
    ...members.coordinators.map(c => ({ type: 'coordinator', id: c.coordinatorId, name: c.name, sub: c.phone })),
    ...members.students.map(s => ({ type: 'student', id: s.studentId, name: s.name, sub: s.class, extra: s.pickupPoint })),
  ];

  const shown = allItems.filter(i =>
    (tab === 'all' || i.type === tab) &&
    (i.name.toLowerCase().includes(query.toLowerCase()) || i.id.toLowerCase().includes(query.toLowerCase()))
  );
  const typeBadge = { driver: { bg: '#FFF7ED', color: '#C2410C' }, coordinator: { bg: '#F5F3FF', color: '#6D28D9' }, student: { bg: '#EFF6FF', color: '#1D4ED8' } };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: 720, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--primary)" />
            All Members — {members.vehicleNumber}
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>{allItems.length} total</span>
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or ID…"
              style={{ paddingLeft: 32, padding: '9px 9px 9px 32px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' }} />
          </div>
          {['all', 'driver', 'coordinator', 'student'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: tab === t ? 'var(--primary)' : '#f1f5f9', color: tab === t ? '#fff' : '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'all' ? `All (${allItems.length})` : t === 'driver' ? 'Driver' : t === 'coordinator' ? `Coordinators (${members.coordinatorCount})` : `Students (${members.studentCount})`}
            </button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 24px' }}>
          {shown.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>No results</div>
            : shown.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: typeBadge[item.type]?.bg || '#f1f5f9', color: typeBadge[item.type]?.color || '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{item.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{item.id.slice(0, 12)}… {item.sub ? `| ${item.sub}` : ''} {item.extra ? `| Pickup: ${item.extra}` : ''}</div>
                </div>
                <span style={{ background: typeBadge[item.type]?.bg, color: typeBadge[item.type]?.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{item.type}</span>
                {item.type !== 'driver' && (
                  <button onClick={() => onRemove(members.vehicleId, item.type, item.id)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Remove</button>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── VehicleForm ──────────────────────────────────────────────────────────────
const VehicleForm = ({ vehicle, onSave, onCancel }) => {
  const [formData, setFormData] = useState(vehicle || {
    number: '', circleNumber: '', type: '', vehicleTypeId: '', capacity: '', route: '', status: 'Active',
    chassisNumber: '', purchaseDate: '', maintenanceDueDate: '', rcDetails: '', kmRun: 0
  });
  const [students, setStudents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedCoordIds, setSelectedCoordIds] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    setLoadingUsers(true);
    Promise.all([
      fetchUsers('student').catch(() => []),
      fetchUsers('coordinator').catch(() => []),
      fetchUsers('driver').catch(() => []),
    ]).then(([s, c, d]) => {
      setStudents(s);
      setCoordinators(c);
      setDrivers(d);
      setLoadingUsers(false);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...formData, studentIds: selectedStudentIds, coordinatorIds: selectedCoordIds, driverId: selectedDriverId || undefined });
    } finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '7px', display: 'block' };
  const secHead = (bg, color, label) => (
    <div style={{ gridColumn: '1 / -1', background: bg, padding: '8px 14px', borderRadius: 6, fontWeight: 700, color, fontSize: 13, marginTop: 4 }}>{label}</div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {secHead('#EFF6FF', '#1D4ED8', 'Basic Information')}

        <div><label style={labelStyle}>Vehicle Number *</label>
          <input name="number" placeholder="TN-XX-XX-XXXX" value={formData.number} onChange={handleChange} required style={inputStyle} /></div>

        <div><label style={labelStyle}>Circle Number</label>
          <input name="circleNumber" placeholder="e.g. 124A" value={formData.circleNumber || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>Type (Bus/Car) *</label>
          <input name="type" placeholder="Bus" value={formData.type} onChange={handleChange} required style={inputStyle} /></div>

        <div><label style={labelStyle}>Vehicle Type ID</label>
          <input name="vehicleTypeId" placeholder="e.g. BUS-60, CAR-08" value={formData.vehicleTypeId || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>Capacity (Seats) *</label>
          <input name="capacity" type="number" value={formData.capacity} onChange={handleChange} required style={inputStyle} /></div>

        <div><label style={labelStyle}>Route *</label>
          <input name="route" placeholder="Assigned Route" value={formData.route} onChange={handleChange} required style={inputStyle} /></div>

        <div><label style={labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Off Duty">Off Duty</option>
          </select></div>

        {secHead('#FDF2F8', '#BE185D', 'Technical & Maintenance')}

        <div><label style={labelStyle}>Chassis Number</label>
          <input name="chassisNumber" placeholder="Chassis No." value={formData.chassisNumber || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>Purchase Date</label>
          <input name="purchaseDate" type="date" value={formData.purchaseDate || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>Maintenance Due Date</label>
          <input name="maintenanceDueDate" type="date" value={formData.maintenanceDueDate || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>RC Details</label>
          <input name="rcDetails" placeholder="RC Verification String" value={formData.rcDetails || ''} onChange={handleChange} style={inputStyle} /></div>

        <div><label style={labelStyle}>Kilometers Run</label>
          <input name="kmRun" type="number" value={formData.kmRun || 0} onChange={handleChange} style={inputStyle} /></div>

        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Vehicle Image</label>
          <input name="imageFile" type="file" accept="image/jpeg,image/png"
            style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '2px dashed #93C5FD', backgroundColor: '#EFF6FF', fontSize: '0.95rem', cursor: 'pointer', boxSizing: 'border-box' }} /></div>

        {secHead('#F0FDF4', '#166534', 'Member Assignment')}

        {loadingUsers ? (
          <div style={{ gridColumn: '1 / -1', color: '#94a3b8', fontSize: 13, padding: '8px 0', textAlign: 'center' }}>Loading members from database…</div>
        ) : (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <SingleSelect
                label="Assign Driver (GPS Source)"
                icon={<UserCheck size={14} />}
                items={drivers}
                selected={selectedDriverId}
                onChange={setSelectedDriverId}
                placeholder="Search & select a driver..."
              />
            </div>
            <MultiSelect
              label="Assign Students"
              icon={<Users size={14} />}
              items={students}
              selected={selectedStudentIds}
              onChange={setSelectedStudentIds}
              placeholder="Search & select students..."
            />
            <MultiSelect
              label="Assign Coordinators"
              icon={<UserCog size={14} />}
              items={coordinators}
              selected={selectedCoordIds}
              onChange={setSelectedCoordIds}
              placeholder="Search & select coordinators..."
            />
          </>
        )}

        {(selectedDriverId || selectedStudentIds.length > 0 || selectedCoordIds.length > 0) && (
          <div style={{ gridColumn: '1 / -1', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {selectedDriverId ? '1 driver' : 'No driver'} + {selectedStudentIds.length} student(s) + {selectedCoordIds.length} coordinator(s) will be assigned on save.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button type="button" onClick={onCancel} style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', padding: '11px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '11px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Vehicle'}
        </button>
      </div>
    </form>
  );
};

// ─── Main Vehicles Page ───────────────────────────────────────────────────────
const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [viewAllMembers, setViewAllMembers] = useState(null);

  useEffect(() => { loadVehicles(); }, []);

  useEffect(() => {
    const handler = () => loadVehicles();
    socket.on('vehicleMembersUpdated', handler);
    socket.on('vehicleCreated', handler);
    socket.on('vehicleUpdated', handler);
    return () => {
      socket.off('vehicleMembersUpdated', handler);
      socket.off('vehicleCreated', handler);
      socket.off('vehicleUpdated', handler);
    };
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (err) { console.error('Error loading vehicles:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async (vehicleData) => {
    try {
      if (editVehicle) {
        const updated = await updateVehicle(editVehicle.id, vehicleData);
        setVehicles(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
        if (vehicleData.studentIds?.length || vehicleData.coordinatorIds?.length || vehicleData.driverId) {
          await assignVehicleMembers(editVehicle.id, {
            studentIds: vehicleData.studentIds || [],
            coordinatorIds: vehicleData.coordinatorIds || [],
            driverId: vehicleData.driverId,
          });
        }
      } else {
        await createVehicle(vehicleData);
      }
      setIsModalOpen(false);
      setEditVehicle(null);
      loadVehicles();
    } catch (err) { console.error('Error saving vehicle:', err); }
  };

  const handleRemoveMember = async (vehicleId, type, memberId) => {
    if (!window.confirm(`Remove this ${type}?`)) return;
    try { await removeVehicleMember(vehicleId, type, memberId); }
    catch (e) { console.error(e); }
  };

  const thStyle = { padding: '1rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' };

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

          {/* Vehicles Table */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Vehicle No</th>
                  <th style={thStyle}>Circle No</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Route</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Halt Records</th>
                  <th style={thStyle}>Students Assigned</th>
                  <th style={thStyle}>Members</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading vehicles…</td></tr>
                  : vehicles.map((v) => (
                    <tr key={v.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: selectedVehicle?.id === v.id ? '#F0FDF4' : 'transparent', transition: 'background-color 0.15s' }}
                      onClick={() => setSelectedVehicle(v)}>
                      <td style={{ padding: '1rem 1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BusFront size={18} color="var(--primary)" /> {v.number}
                      </td>
                      <td style={{ padding: '1rem 1.2rem', fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>{v.circleNumber || '—'}</td>
                      <td style={{ padding: '1rem 1.2rem' }}>{v.type} ({v.capacity} seats)</td>
                      <td style={{ padding: '1rem 1.2rem' }}>{v.route}</td>
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: (v.status === 'Active' || v.status === 'active') ? '#D1FAE5' : '#FEF3C7', color: (v.status === 'Active' || v.status === 'active') ? '#065F46' : '#92400E' }}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>{v.haltedCount || 0} times</td>

                      {/* FIX 1: Students Assigned count column */}
                      <td style={{ padding: '1rem 1.2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                            <Users size={12} /> {v.assignedStudents?.length || 0} Students
                          </span>
                          <span style={{ background: '#F5F3FF', color: '#6D28D9', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                            <UserCog size={12} /> {v.assignedCoordinators?.length || 0} Coordinators
                          </span>
                        </div>
                      </td>

                      {/* Members (driver badge) */}
                      <td style={{ padding: '1rem 1.2rem' }}>
                        {v.driverId
                          ? <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <UserCheck size={12} /> Driver
                            </span>
                          : <span style={{ background: '#FEF2F2', color: '#991B1B', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>No Driver</span>
                        }
                      </td>

                      <td style={{ padding: '1rem 1.2rem', display: 'flex', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                        <button style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer' }}
                          onClick={() => { setEditVehicle(v); setIsModalOpen(true); }}>
                          <Edit size={18} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          onClick={() => setVehicles(prev => prev.filter(item => item.id !== v.id))}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Vehicle Detail Panel */}
          {selectedVehicle && (
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #BFDBFE', borderTop: '4px solid var(--primary)', marginTop: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', animation: 'fadeIn 0.3s ease-in-out' }}>
              <button onClick={() => setSelectedVehicle(null)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0, paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                <Info size={22} color="var(--primary)" /> Complete Vehicle Details: {selectedVehicle.number}
              </h3>
              <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '15px' }}>
                <img
                  src={selectedVehicle.image || `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&fit=crop`}
                  alt="Vehicle"
                  style={{ width: '250px', height: '200px', borderRadius: '12px', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr minmax(140px, auto) 1fr', gap: '15px', fontSize: '0.95rem', flex: 1, alignItems: 'center' }}>
                  <div style={{ gridColumn: '1 / -1', background: '#EFF6FF', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#1D4ED8', marginBottom: '4px' }}>Basic Information</div>
                  <strong style={{ color: 'var(--text-muted)' }}>Circle Number:</strong> <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{selectedVehicle.circleNumber || 'Not Assigned'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Type/Capacity:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.type} ({selectedVehicle.capacity} Seats)</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Assigned Route:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.route}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Current Status:</strong> <span style={{ fontWeight: 600, color: (selectedVehicle.status === 'Active' || selectedVehicle.status === 'active') ? '#059669' : '#D97706' }}>{selectedVehicle.status}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>RC Details:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.rcDetails || 'Not Available'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Vehicle Type ID:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.vehicleTypeId || 'Not Assigned'}</span>

                  <div style={{ gridColumn: '1 / -1', background: '#FDF2F8', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, color: '#BE185D', marginBottom: '4px', marginTop: '10px' }}>Technical &amp; Maintenance records</div>
                  <strong style={{ color: 'var(--text-muted)' }}>Chassis Number:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.chassisNumber || 'Not Available'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Purchase Date:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.purchaseDate || 'Not Available'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Maintenance Due:</strong> <span style={{ color: '#E11D48', fontWeight: 600 }}>{selectedVehicle.maintenanceDueDate || 'Not Available'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Kilometers Run:</strong> <span style={{ fontWeight: 500 }}>{Number(selectedVehicle.kmRun || 0).toLocaleString()} km</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Halted History:</strong> <span style={{ fontWeight: 500 }}>{selectedVehicle.haltedCount || '0'} times</span>
                </div>
              </div>

              <AssignedMembersSection
                vehicle={selectedVehicle}
                onViewAll={setViewAllMembers}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          )}

          {/* Add / Edit Modal */}
          <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditVehicle(null); }} title={editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
            <VehicleForm vehicle={editVehicle} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditVehicle(null); }} />
          </Modal>

          {/* View All Members Modal */}
          {viewAllMembers && (
            <ViewAllModal
              members={viewAllMembers}
              onClose={() => setViewAllMembers(null)}
              onRemove={async (vid, type, mid) => {
                if (!window.confirm(`Remove this ${type}?`)) return;
                await removeVehicleMember(vid, type, mid);
                setViewAllMembers(null);
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default Vehicles;
