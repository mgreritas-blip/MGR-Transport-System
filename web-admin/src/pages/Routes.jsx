import React, { useState, useEffect, useCallback } from 'react';
import {
  Map as MapIcon, Plus, Edit, Trash2, X, AlertTriangle, Bell, Calendar,
  Bus, Users, UserCheck, ChevronRight, CheckCircle, RefreshCw, ToggleLeft,
  ToggleRight, AlertCircle, Clock, Navigation, Zap, Shield
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const API = 'http://localhost:3000';

const mockData = [
  { id: 'RT-01', route: 'Chennai Route 1', zone: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Anna Nagar', vehicleNumber: 'TN 01- C05578', circleNumber: '124A', activeBuses: 2, notifications: 'Normal Operation', alertsList: [{ id: 1, type: 'Maintenance Request', msg: 'AC cooling issue reported.', date: '2026-04-10' }, { id: 2, type: 'Traffic Warning', msg: 'Anna Nagar main road closed.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-06', route: 'Chennai Route 6', zone: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Tambaram', vehicleNumber: 'TN 01- C05579', circleNumber: '125B', activeBuses: 3, notifications: '\u26a0\ufe0f 2h Delay (Technical)', alertsList: [{ id: 3, type: '2h Delay (Technical)', msg: 'Engine alternator belt broke.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-10', route: 'Arani Route 1', zone: 'Arani', district: 'Tiruvannamalai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Arani Town', vehicleNumber: 'TN 01- B03322', circleNumber: '126C', activeBuses: 1, notifications: 'Normal Operation', alertsList: [], mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-11', route: 'Arani Route 2', zone: 'Arani', district: 'Tiruvannamalai', state: 'Tamil Nadu', start: 'Main Campus', end: 'Arani West', vehicleNumber: 'TN 01- B03325', circleNumber: '127D', activeBuses: 1, notifications: '\u274c Cancelled (Today)', alertsList: [{ id: 4, type: 'Cancelled (Today)', msg: 'Driver is on sick leave and no spare available.', date: '2026-04-11' }], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
  { id: 'RT-15', route: 'Bangalore Route 1', zone: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka', start: 'Main Campus', end: 'Majestic', vehicleNumber: 'KA 01- M01021', circleNumber: '128E', activeBuses: 1, notifications: 'Normal Operation', alertsList: [], mapImage: 'https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&q=80&w=800' },
];

const NOTIF_TYPES = [
  { value: 'RouteChange',       label: '\ud83d\udd04 Route Change',          color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'EarlyArrival',      label: '\u23f0 Early Arrival',           color: '#10B981', bg: '#F0FDF4' },
  { value: 'DelayedDeparture',  label: '\u23f3 Delayed Departure',       color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'Diversion',         label: '\u21aa\ufe0f Temporary Diversion',  color: '#8B5CF6', bg: '#F5F3FF' },
  { value: 'Closure',           label: '\ud83d\udeab Route Closure',         color: '#EF4444', bg: '#FEF2F2' },
  { value: 'Emergency',         label: '\ud83d\udea8 Emergency Update',      color: '#DC2626', bg: '#FFF1F2' },
  { value: 'PickupChange',      label: '\ud83d\udccd Pickup Point Change',   color: '#0EA5E9', bg: '#F0F9FF' },
  { value: 'DropChange',        label: '\ud83c\udfc1 Drop Point Change',     color: '#6366F1', bg: '#EEF2FF' },
];

// 3 focused alert types for the global Alert button
const ALERT_TYPES = [
  {
    value: 'RouteDelayed',
    label: 'Route Delayed',
    emoji: '\u23f0',
    color: '#D97706',
    border: '#FCD34D',
    bg: '#FFFBEB',
    desc: 'Bus is running behind schedule. Students, parents & drivers will be notified.',
  },
  {
    value: 'RouteCancelled',
    label: 'Route Cancelled',
    emoji: '\u274c',
    color: '#DC2626',
    border: '#FCA5A5',
    bg: '#FEF2F2',
    desc: 'Service is cancelled for today. All stakeholders will be alerted immediately.',
  },
  {
    value: 'NewPath',
    label: 'New Path / Diversion',
    emoji: '\ud83d\udd00',
    color: '#2563EB',
    border: '#93C5FD',
    bg: '#EFF6FF',
    desc: 'Route path has changed. Provide new path details so everyone is informed.',
  },
];

// ── Assigned Vehicles Panel ──────────────────────────────────────────────────
const AssignedVehiclesPanel = ({ route, onRaiseAlert }) => {
  const [assignments, setAssignments] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState(null);
  const [notifHistory, setNotifHistory] = useState([]);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/route-assignments?routeId=${route.id}`);
      if (res.ok) setAssignments(await res.json());
    } catch { /* offline */ }
    setLoading(false);
  }, [route.id]);

  const loadAvailable = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/route-assignments/${route.id}/available-vehicles`);
      if (res.ok) setAvailableVehicles(await res.json());
    } catch { /* offline */ }
  }, [route.id]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/route-notifications?routeId=${route.id}&limit=5`);
      if (res.ok) setNotifHistory(await res.json());
    } catch { /* offline */ }
  }, [route.id]);

  useEffect(() => {
    loadAssignments();
    loadAvailable();
    loadHistory();
  }, [loadAssignments, loadAvailable, loadHistory]);

  const assignVehicle = async (vehicleId) => {
    setAssigning(true);
    try {
      const res = await fetch(`${API}/api/route-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: route.id, routeName: route.route, vehicleId, adminName: 'Super Admin' }),
      });
      if (res.ok) { await loadAssignments(); await loadAvailable(); setShowAssignDropdown(false); }
      else {
        const err = await res.json();
        alert(err.error || 'Failed to assign vehicle');
      }
    } catch (e) { alert('Error: ' + e.message); }
    setAssigning(false);
  };

  const removeVehicle = async (vehicleId) => {
    if (!window.confirm('Remove this vehicle from the route?')) return;
    try {
      await fetch(`${API}/api/route-assignments/${route.id}/${vehicleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: 'Super Admin' }),
      });
      await loadAssignments();
      await loadAvailable();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const toggleVehicle = async (vehicleId) => {
    try {
      await fetch(`${API}/api/route-assignments/${route.id}/${vehicleId}/toggle`, { method: 'PATCH' });
      await loadAssignments();
    } catch (e) { alert('Error: ' + e.message); }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bus size={18} color="#7C3AED" />
          Assigned Vehicles
          <span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800 }}>
            {assignments.filter(a => a.isActive).length}
          </span>
        </h4>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowAssignDropdown(v => !v); loadAvailable(); }}
            style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Assign Vehicle
          </button>
          {showAssignDropdown && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, width: '340px', background: '#fff',
              borderRadius: '12px', boxShadow: '0 15px 40px rgba(0,0,0,0.18)', border: '1px solid var(--border)',
              zIndex: 200, maxHeight: '280px', overflowY: 'auto',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                SELECT VEHICLE TO ASSIGN
              </div>
              {availableVehicles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  All vehicles already assigned
                </div>
              ) : availableVehicles.map(v => (
                <button key={v.id} onClick={() => assignVehicle(v.id)} disabled={assigning}
                  style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '10px', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: '36px', height: '36px', background: '#EDE9FE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bus size={16} color="#7C3AED" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem' }}>{v.number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {v.type} &bull; {v.capacity} seats &bull; {v.assignedStudents?.length || 0} students
                      {v.driver ? ` · Driver: ${v.driver.name}` : ' · No driver'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned vehicles list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading…</div>
      ) : assignments.length === 0 ? (
        <div style={{ background: '#F9FAFB', border: '2px dashed #E5E7EB', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
          <Bus size={32} color="#D1D5DB" style={{ marginBottom: '10px' }} />
          <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>No vehicles assigned yet</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>Click "Assign Vehicle" to add buses to this route</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {assignments.map(a => (
            <div key={a.id} style={{
              border: `1.5px solid ${a.isActive ? '#C4B5FD' : '#E5E7EB'}`,
              borderRadius: '10px', overflow: 'hidden',
              background: a.isActive ? '#FDFCFF' : '#F9FAFB',
              transition: 'all 0.2s',
            }}>
              {/* Vehicle row */}
              <div style={{ padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '38px', height: '38px', background: a.isActive ? '#EDE9FE' : '#F3F4F6', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bus size={18} color={a.isActive ? '#7C3AED' : '#9CA3AF'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: a.isActive ? 'var(--text-main)' : '#9CA3AF' }}>
                    {a.vehicleNumber}
                    <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, background: a.isActive ? '#D1FAE5' : '#F3F4F6', color: a.isActive ? '#065F46' : '#9CA3AF' }}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {a.vehicle && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {a.vehicle.type} &bull; {a.vehicle.capacity} seats
                      {a.vehicle.driver ? ` · 🚗 ${a.vehicle.driver.name}` : ''}
                      &bull; 👥 {a.vehicle.assignedStudents?.length || 0} students
                      &bull; 👤 {a.vehicle.assignedCoordinators?.length || 0} coordinators
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setExpandedVehicle(expandedVehicle === a.vehicleId ? null : a.vehicleId)}
                    title="View members"
                    style={{ background: '#EDE9FE', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#7C3AED', fontSize: '0.72rem', fontWeight: 700 }}>
                    {expandedVehicle === a.vehicleId ? '\u25b2 Hide' : '\u25bc Members'}
                  </button>
                  <button onClick={() => toggleVehicle(a.vehicleId)}
                    title={a.isActive ? 'Deactivate' : 'Activate'}
                    style={{ background: a.isActive ? '#FEF3C7' : '#D1FAE5', border: 'none', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}>
                    {a.isActive ? <ToggleRight size={15} color="#92400E" /> : <ToggleLeft size={15} color="#065F46" />}
                  </button>
                  <button onClick={() => removeVehicle(a.vehicleId)}
                    title="Remove from route"
                    style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}>
                    <X size={13} color="#DC2626" />
                  </button>
                </div>
              </div>
              {/* Expanded members */}
              {expandedVehicle === a.vehicleId && a.vehicle && (
                <div style={{ borderTop: '1px solid #EDE9FE', background: '#F5F3FF', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  {a.vehicle.driver && (
                    <div style={{ background: '#fff', borderRadius: '7px', padding: '8px 10px', borderLeft: '3px solid #7C3AED' }}>
                      <div style={{ fontWeight: 700, color: '#7C3AED', marginBottom: '3px' }}>🚗 Driver</div>
                      <div>{a.vehicle.driver.name}</div>
                      {a.vehicle.driver.phone && <div style={{ color: 'var(--text-muted)' }}>{a.vehicle.driver.phone}</div>}
                    </div>
                  )}
                  <div style={{ background: '#fff', borderRadius: '7px', padding: '8px 10px', borderLeft: '3px solid #3B82F6' }}>
                    <div style={{ fontWeight: 700, color: '#3B82F6', marginBottom: '3px' }}>👥 Students</div>
                    <div>{a.vehicle.assignedStudents?.length || 0} assigned</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '7px', padding: '8px 10px', borderLeft: '3px solid #10B981' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '3px' }}>👤 Coordinators</div>
                    <div>{a.vehicle.assignedCoordinators?.length || 0} assigned</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '7px', padding: '8px 10px', borderLeft: '3px solid #F59E0B' }}>
                    <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '3px' }}>📡 GPS</div>
                    <div>{a.vehicle.driver ? `via ${a.vehicle.driver.name}` : 'No driver GPS'}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notification history for this route */}
      {notifHistory.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <h5 style={{ margin: '0 0 10px 0', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Recent Alerts for this Route
          </h5>
          {notifHistory.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: '28px', height: '28px', background: '#F5F3FF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={12} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{n.notificationType}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.effectiveDate} · {n.notifiedCount} stakeholders</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── 4-Step Notification Wizard ───────────────────────────────────────────────
const NotificationWizard = ({ route, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stakeholders, setStakeholders] = useState(null);
  const [stakeholdersLoading, setStakeholdersLoading] = useState(false);
  const [form, setForm] = useState({
    notificationType: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    effectiveTime: new Date().toTimeString().slice(0, 5),
    duration: '',
    updatedRoute: '',
    pickupChange: '',
    dropChange: '',
    customMessage: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await fetch(`${API}/api/route-assignments?routeId=${route.id}`);
        if (res.ok) {
          const data = await res.json();
          setAssignments(data.filter(a => a.isActive));
        }
      } catch {}
    };
    loadAssignments();
  }, [route.id]);

  const loadStakeholders = async (vIds) => {
    if (!vIds.length) { setStakeholders(null); return; }
    setStakeholdersLoading(true);
    try {
      const q = vIds.join(',');
      const res = await fetch(`${API}/api/route-assignments/${route.id}/stakeholders?vehicleIds=${q}`);
      if (res.ok) setStakeholders(await res.json());
    } catch {}
    setStakeholdersLoading(false);
  };

  const toggleVehicle = (vid) => {
    const next = selectedVehicleIds.includes(vid)
      ? selectedVehicleIds.filter(v => v !== vid)
      : [...selectedVehicleIds, vid];
    setSelectedVehicleIds(next);
    if (step >= 3) loadStakeholders(next);
  };

  const selectAll = () => {
    const all = assignments.map(a => a.vehicleId);
    setSelectedVehicleIds(all);
    if (step >= 3) loadStakeholders(all);
  };

  const handleNext = async () => {
    if (step === 2) await loadStakeholders(selectedVehicleIds);
    setStep(s => s + 1);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const selectedAssignments = assignments.filter(a => selectedVehicleIds.includes(a.vehicleId));
      const vehicleNumbers = selectedAssignments.map(a => a.vehicleNumber);
      const res = await fetch(`${API}/api/route-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: route.id,
          routeName: route.route,
          vehicleIds: selectedVehicleIds,
          vehicleNumbers,
          notificationType: form.notificationType,
          effectiveDate: form.effectiveDate,
          effectiveTime: form.effectiveTime,
          duration: form.duration || null,
          updatedRoute: form.updatedRoute || null,
          pickupChange: form.pickupChange || null,
          dropChange: form.dropChange || null,
          customMessage: form.customMessage,
          stakeholders: stakeholders || {},
          adminName: 'Super Admin',
        }),
      });
      if (res.ok) {
        setSent(true);
        onSuccess && onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send');
      }
    } catch (e) { alert('Error: ' + e.message); }
    setSending(false);
  };

  const selectedNotifType = NOTIF_TYPES.find(t => t.value === form.notificationType);
  const stepLabels = ['Vehicles', 'Type', 'Details', 'Confirm'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div style={{ background: '#fff', borderRadius: '20px', width: '640px', maxWidth: '96vw', boxShadow: '0 30px 70px rgba(0,0,0,0.28)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #B91C1C, #7C2D12)', padding: '18px 26px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Raise Alert: {route.route}
            </h2>
            <p style={{ margin: '3px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.77rem' }}>
              Vehicle: {route.vehicleNumber} &bull; Circle: {route.circleNumber}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={20} /></button>
        </div>

        {/* Steps */}
        <div style={{ padding: '14px 26px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, background: step > i + 1 ? '#10B981' : step === i + 1 ? '#B91C1C' : '#E5E7EB', color: step >= i + 1 ? '#fff' : '#9CA3AF' }}>
                  {step > i + 1 ? '\u2713' : i + 1}
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? '#B91C1C' : 'var(--text-muted)' }}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div style={{ flex: 1, height: '2px', background: step > i + 1 ? '#10B981' : '#FCA5A5', borderRadius: '2px' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px', overflowY: 'auto', flex: 1 }}>
          {!sent ? (
            <>
              {/* STEP 1: Vehicle Selection */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Select Vehicles to Notify</h3>
                    {assignments.length > 0 && (
                      <button onClick={selectAll} style={{ background: '#EDE9FE', color: '#7C3AED', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>
                        Select All ({assignments.length})
                      </button>
                    )}
                  </div>
                  {assignments.length === 0 ? (
                    <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                      <AlertCircle size={28} color="#92400E" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontWeight: 700, color: '#92400E' }}>No vehicles assigned to this route</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#78350F' }}>Assign vehicles first using the "Assign Vehicle" button.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {assignments.map(a => {
                        const selected = selectedVehicleIds.includes(a.vehicleId);
                        return (
                          <label key={a.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px',
                            border: `2px solid ${selected ? '#B91C1C' : 'var(--border)'}`,
                            borderRadius: '10px', cursor: 'pointer',
                            background: selected ? '#FEF2F2' : '#F9FAFB', transition: 'all 0.15s',
                          }}>
                            <input type="checkbox" checked={selected} onChange={() => toggleVehicle(a.vehicleId)} style={{ accentColor: '#B91C1C', width: '16px', height: '16px' }} />
                            <Bus size={18} color={selected ? '#B91C1C' : '#9CA3AF'} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{a.vehicleNumber}</div>
                              {a.vehicle && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {a.vehicle.type} &bull; {a.vehicle.assignedStudents?.length || 0} students
                                  {a.vehicle.driver ? ` &bull; Driver: ${a.vehicle.driver.name}` : ''}
                                </div>
                              )}
                            </div>
                            {selected && <CheckCircle size={16} color="#B91C1C" />}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Notification Type */}
              {step === 2 && (
                <div>
                  <h3 style={{ margin: '0 0 14px 0', fontWeight: 800, fontSize: '0.95rem' }}>Choose Alert Type</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {NOTIF_TYPES.map(t => (
                      <label key={t.value} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 14px',
                        border: `2px solid ${form.notificationType === t.value ? t.color : 'var(--border)'}`,
                        borderRadius: '10px', cursor: 'pointer',
                        background: form.notificationType === t.value ? t.bg : '#F9FAFB',
                      }}>
                        <input type="radio" name="notifType2" value={t.value}
                          checked={form.notificationType === t.value}
                          onChange={() => setForm(f => ({ ...f, notificationType: t.value }))}
                          style={{ accentColor: t.color }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: form.notificationType === t.value ? t.color : 'var(--text-main)' }}>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Alert Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EFFECTIVE DATE *</label>
                      <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EFFECTIVE TIME *</label>
                      <input type="time" value={form.effectiveTime} onChange={e => setForm(f => ({ ...f, effectiveTime: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DURATION (blank = permanent)</label>
                    <input type="text" placeholder="e.g. Today Only / 2 hours / 3 days" value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  {(form.notificationType === 'RouteChange' || form.notificationType === 'Diversion') && (
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>UPDATED ROUTE / DIVERSION</label>
                      <input type="text" placeholder="e.g. Via NH-48 due to road closure" value={form.updatedRoute}
                        onChange={e => setForm(f => ({ ...f, updatedRoute: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                  {form.notificationType === 'PickupChange' && (
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>NEW PICKUP POINT</label>
                      <input type="text" placeholder="e.g. Main Gate (was Side Gate)" value={form.pickupChange}
                        onChange={e => setForm(f => ({ ...f, pickupChange: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                  {form.notificationType === 'DropChange' && (
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>NEW DROP POINT</label>
                      <input type="text" placeholder="e.g. East Gate (was West Gate)" value={form.dropChange}
                        onChange={e => setForm(f => ({ ...f, dropChange: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CUSTOM MESSAGE (Optional)</label>
                    <textarea placeholder="Official message for students, parents, drivers, coordinators & HOD..." value={form.customMessage}
                      onChange={e => setForm(f => ({ ...f, customMessage: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '80px', resize: 'none' }} />
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmation Screen */}
              {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Confirm & Send Alert</h3>

                  {/* Route + vehicles summary */}
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#B91C1C', marginBottom: '10px', fontSize: '0.85rem' }}>\ud83d\udea6 Selected Route & Vehicles</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                      <div><strong>Route:</strong> {route.route}</div>
                      <div><strong>Vehicles:</strong> {selectedVehicleIds.length} selected</div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <strong>Vehicle Numbers:</strong> {assignments.filter(a => selectedVehicleIds.includes(a.vehicleId)).map(a => a.vehicleNumber).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Alert info */}
                  <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#0369A1', marginBottom: '10px', fontSize: '0.85rem' }}>\ud83d\udce2 Alert Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                      <div><strong>Type:</strong> <span style={{ color: selectedNotifType?.color, fontWeight: 700 }}>{selectedNotifType?.label}</span></div>
                      <div><strong>Date:</strong> {form.effectiveDate}</div>
                      <div><strong>Time:</strong> {form.effectiveTime}</div>
                      <div><strong>Duration:</strong> {form.duration || 'Permanent'}</div>
                      {form.updatedRoute && <div style={{ gridColumn: '1/-1' }}><strong>Route Update:</strong> {form.updatedRoute}</div>}
                      {form.pickupChange && <div style={{ gridColumn: '1/-1' }}><strong>New Pickup:</strong> {form.pickupChange}</div>}
                      {form.dropChange && <div style={{ gridColumn: '1/-1' }}><strong>New Drop:</strong> {form.dropChange}</div>}
                    </div>
                  </div>

                  {/* Auto-retrieved stakeholders */}
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: 800, color: '#166534', marginBottom: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> Auto-Retrieved Stakeholders
                    </div>
                    {stakeholdersLoading ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading stakeholders…</div>
                    ) : stakeholders ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px' }}>
                        {[
                          { label: 'Students', count: stakeholders.students?.length || 0, color: '#3B82F6' },
                          { label: 'Parents', count: stakeholders.parents?.length || 0, color: '#10B981' },
                          { label: 'Drivers', count: stakeholders.drivers?.length || 0, color: '#7C3AED' },
                          { label: 'Coords', count: stakeholders.coordinators?.length || 0, color: '#F59E0B' },
                          { label: 'HODs', count: stakeholders.hods?.length || 0, color: '#EF4444' },
                        ].map(s => (
                          <div key={s.label} style={{ background: '#fff', borderRadius: '8px', padding: '10px', textAlign: 'center', border: `2px solid ${s.color}30` }}>
                            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.count}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No vehicle data available — counts may be 0</div>
                    )}
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#166534', background: '#DCFCE7', borderRadius: '6px', padding: '6px 10px' }}>
                      \u2139\ufe0f Stakeholders are <strong>auto-retrieved</strong> from assigned vehicles. No manual selection required.
                    </div>
                  </div>

                  {/* Channels */}
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#1D4ED8' }}>
                    <strong>Channels:</strong> In-App &bull; Admin Dashboard &bull; Coordinator &bull; HOD &bull; Driver App &bull; Student App &bull; Parent App
                  </div>

                  <button onClick={handleSend} disabled={sending}
                    style={{ width: '100%', padding: '16px', background: sending ? '#9CA3AF' : 'linear-gradient(135deg,#B91C1C,#7C2D12)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <Bell size={20} /> {sending ? 'Sending…' : '\ud83d\udd14 SEND ALERT NOW'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '14px' }}>✅</div>
              <h3 style={{ fontWeight: 800, color: '#166534', marginBottom: '8px' }}>Alert Sent!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                <strong>{selectedNotifType?.label}</strong> dispatched to<br />
                all stakeholders of <strong>{route.route}</strong>.
              </p>
              <button onClick={onClose} style={{ padding: '12px 30px', background: '#B91C1C', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: '#F9FAFB', borderRadius: '0 0 20px 20px' }}>
            <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}>
              {step === 1 ? 'Cancel' : '\u2190 Back'}
            </button>
            {step < 4 && (
              <button onClick={handleNext}
                disabled={(step === 1 && selectedVehicleIds.length === 0) || (step === 2 && !form.notificationType)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 700,
                  background: ((step === 1 && selectedVehicleIds.length === 0) || (step === 2 && !form.notificationType)) ? '#E5E7EB' : '#B91C1C',
                  color: ((step === 1 && selectedVehicleIds.length === 0) || (step === 2 && !form.notificationType)) ? '#9CA3AF' : '#fff',
                  cursor: ((step === 1 && selectedVehicleIds.length === 0) || (step === 2 && !form.notificationType)) ? 'not-allowed' : 'pointer',
                }}
              >
                Next \u2192
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Routes Page ─────────────────────────────────────────────────────────
const Routes = () => {
  const [data, setData] = React.useState(mockData);
  const [viewAlertsList, setViewAlertsList] = useState(null);
  React.useEffect(() => { setData(mockData); }, []);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [alertRoute, setAlertRoute] = useState(null);
  const [activeZoneTab, setActiveZoneTab] = useState('All');

  // Alert Wizard State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertBadge, setAlertBadge] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [showNotifHistory, setShowNotifHistory] = useState(false);
  const [alertStep, setAlertStep] = useState(1);
  const [alertForm, setAlertForm] = useState({
    routeId: '', routeName: '',
    notificationType: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    effectiveTime: new Date().toTimeString().slice(0,5),
    duration: '', updatedRoute: '', newPathDetails: '', customMessage: '',
  });
  const [alertSending, setAlertSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  // Dynamic vehicle + stakeholder state for global alert
  const [alertVehicles, setAlertVehicles] = useState([]);
  const [alertVehiclesLoading, setAlertVehiclesLoading] = useState(false);
  const [alertStakeholders, setAlertStakeholders] = useState(null);
  const [alertStakeholdersLoading, setAlertStakeholdersLoading] = useState(false);

  useEffect(() => {
    fetchBadge();
    const iv = setInterval(fetchBadge, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchBadge = async () => {
    try {
      const res = await fetch(`${API}/api/route-notifications?limit=10`);
      if (res.ok) {
        const d = await res.json();
        setRecentNotifs(d);
        const twoH = new Date(Date.now() - 2 * 60 * 60 * 1000);
        setAlertBadge(d.filter(n => new Date(n.createdAt) > twoH).length);
      }
    } catch {}
  };

  // Auto-fetch all assigned vehicles + their members for the selected route
  const fetchAlertVehicles = async (routeId) => {
    setAlertVehiclesLoading(true);
    setAlertVehicles([]);
    setAlertStakeholders(null);
    try {
      const res = await fetch(`${API}/api/route-assignments?routeId=${routeId}`);
      if (res.ok) {
        const data = await res.json();
        const active = data.filter(a => a.isActive);
        setAlertVehicles(active);
        // Pre-fetch stakeholders so Step 4 is instant
        if (active.length > 0) {
          setAlertStakeholdersLoading(true);
          const vIds = active.map(a => a.vehicleId).join(',');
          const sRes = await fetch(`${API}/api/route-assignments/${routeId}/stakeholders?vehicleIds=${vIds}`);
          if (sRes.ok) setAlertStakeholders(await sRes.json());
          setAlertStakeholdersLoading(false);
        }
      }
    } catch {}
    setAlertVehiclesLoading(false);
  };

  const resetAlertModal = () => {
    setAlertStep(1);
    setAlertForm({
      routeId: '', routeName: '',
      notificationType: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      effectiveTime: new Date().toTimeString().slice(0,5),
      duration: '', updatedRoute: '', newPathDetails: '', customMessage: '',
    });
    setAlertSent(false);
    setAlertSending(false);
    setAlertVehicles([]);
    setAlertStakeholders(null);
  };

  const handleAlertSend = async () => {
    setAlertSending(true);
    try {
      // Dynamically use the fetched vehicle and stakeholder data
      const vehicleIds = alertVehicles.map(a => a.vehicleId);
      const vehicleNumbers = alertVehicles.map(a => a.vehicleNumber);
      const res = await fetch(`${API}/api/route-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: alertForm.routeId,
          routeName: alertForm.routeName,
          vehicleIds,
          vehicleNumbers,
          notificationType: alertForm.notificationType,
          effectiveDate: alertForm.effectiveDate,
          effectiveTime: alertForm.effectiveTime,
          duration: alertForm.duration || null,
          updatedRoute: alertForm.newPathDetails || null,
          customMessage: alertForm.customMessage,
          stakeholders: alertStakeholders || {},
          adminName: 'Super Admin',
        }),
      });
      if (res.ok) { setAlertSent(true); fetchBadge(); }
    } catch (err) { alert('Error: ' + err.message); }
    setAlertSending(false);
  };

  const selectedAlertNotifType = NOTIF_TYPES.find(t => t.value === alertForm.notificationType);

  const zones = ['All', 'Chennai', 'Arani', 'Bangalore'];
  const filteredData = activeZoneTab === 'All' ? data : data.filter(r => r.zone === activeZoneTab);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />

        <section className="page-content">
          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1>Route Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Regional fleet monitoring and route-based notifications</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Alert History button */}
              <button
                onClick={() => setShowNotifHistory(v => !v)}
                title="Recent Alerts"
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <Clock size={18} />
              </button>
              {/* Alert button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowAlertModal(true); resetAlertModal(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(124,58,237,0.4)' }}
                >
                  <Bell size={16} /> Alert
                </button>
                {alertBadge > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, border: '2px solid #fff' }}>
                    {alertBadge > 9 ? '9+' : alertBadge}
                  </span>
                )}
              </div>
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
              <button key={z} onClick={() => setActiveZoneTab(z)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: activeZoneTab === z ? 'var(--primary)' : 'transparent', color: activeZoneTab === z ? '#fff' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {z} Zone
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Route table */}
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
                    <tr key={item.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: selectedRoute?.id === item.id ? '#EFF6FF' : 'transparent', transition: 'background-color 0.2s' }}
                      onClick={() => setSelectedRoute(item)}
                      onMouseEnter={(e) => { if (selectedRoute?.id !== item.id) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                      onMouseLeave={(e) => { if (selectedRoute?.id !== item.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2px' }}>{item.state}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.zone}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{item.route}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.vehicleNumber}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{item.circleNumber}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: item.notifications.includes('Normal') ? 'var(--success)' : 'var(--danger)', background: item.notifications.includes('Normal') ? '#dcfce7' : '#fee2e2', padding: '4px 10px', borderRadius: '20px' }}>
                          {item.notifications}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setViewAlertsList(item)} style={{ background: item.alertsList.length > 0 ? '#FEF2F2' : '#F3F4F6', color: item.alertsList.length > 0 ? '#DC2626' : 'var(--text-muted)', border: `2px solid ${item.alertsList.length > 0 ? '#FECACA' : '#E5E7EB'}`, borderRadius: '8px', padding: '4px 12px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.alertsList.length}
                        </button>
                        <button onClick={() => setAlertRoute(item)} style={{ background: '#7C3AED', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800 }}>
                          \ud83d\udd14 RAISE
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

            {/* Route Detail Panel */}
            {selectedRoute && (
              <div style={{ flex: '1', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '1.5rem', border: '1px solid #BFDBFE', position: 'relative', borderTop: '4px solid var(--primary)', maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={() => setSelectedRoute(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#F3F4F6', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
                <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <MapIcon size={22} color="var(--primary)" /> Route Info: {selectedRoute.route}
                </h3>
                <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: '15px' }}>
                  <img src={selectedRoute.mapImage} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <AlertTriangle size={18} /> Active Alerts Log
                    </h4>
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #B91C1C' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#B91C1C' }}>{selectedRoute.notifications}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px' }}><strong>Vehicle:</strong> {selectedRoute.vehicleNumber}</div>
                    </div>
                  </div>
                )}

                {/* ── ASSIGNED VEHICLES SECTION ── */}
                <div style={{ marginTop: '20px', borderTop: '2px solid #EDE9FE', paddingTop: '20px' }}>
                  <AssignedVehiclesPanel route={selectedRoute} onRaiseAlert={(v) => setAlertRoute(selectedRoute)} />
                </div>

                {/* Quick Raise Alert button */}
                <button
                  onClick={() => setAlertRoute(selectedRoute)}
                  style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'linear-gradient(135deg,#B91C1C,#7C2D12)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Bell size={18} /> \ud83d\udd14 Raise Alert for {selectedRoute.route}
                </button>
              </div>
            )}
          </div>

          {/* ── Modals ── */}

          {/* Add Zone Modal */}
          {showAddZoneModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={24} color="var(--primary)" /> Add New Zone</h2>
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
                      <option>Tamil Nadu</option><option>Karnataka</option><option>Andhra Pradesh</option>
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

          {/* Add Route Modal */}
          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={24} color="var(--primary)" /> Add New Route Location</h2>
                <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>State</label>
                      <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} required>
                        <option>Tamil Nadu</option><option>Karnataka</option><option>Andhra Pradesh</option>
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Circle Number</label>
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

          {/* View Alerts List Modal */}
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
                          <button onClick={() => {
                            const newMsg = prompt('Edit alert message:', alertObj.msg);
                            if (newMsg !== null && newMsg.trim() !== '') {
                              setData(prev => prev.map(item => {
                                if (item.id === viewAlertsList.id) {
                                  const updatedAlerts = item.alertsList.map(a => a.id === alertObj.id ? { ...a, msg: newMsg } : a);
                                  const updatedItem = { ...item, alertsList: updatedAlerts };
                                  setViewAlertsList(updatedItem);
                                  return updatedItem;
                                }
                                return item;
                              }));
                            }
                          }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => {
                            if (window.confirm('Delete this alert?')) {
                              setData(prev => prev.map(item => {
                                if (item.id === viewAlertsList.id) {
                                  const filteredAlerts = item.alertsList.filter(a => a.id !== alertObj.id);
                                  const newNotifications = filteredAlerts.length === 0 ? 'Normal Operation' : item.notifications;
                                  const updatedItem = { ...item, alertsList: filteredAlerts, notifications: newNotifications };
                                  setViewAlertsList(updatedItem);
                                  return updatedItem;
                                }
                                return item;
                              }));
                            }
                          }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>No active alerts for this route.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4-Step Notification Wizard */}
          {alertRoute && (
            <NotificationWizard
              route={alertRoute}
              onClose={() => setAlertRoute(null)}
              onSuccess={() => {
                // Update notification status in table
                setData(prev => prev.map(item => {
                  if (item.id === alertRoute.id) {
                    const newAlert = { id: Date.now(), type: 'Alert Sent', msg: 'Route alert dispatched to stakeholders.', date: new Date().toISOString().split('T')[0] };
                    return { ...item, notifications: '\u26a0\ufe0f Alert Sent', alertsList: [...item.alertsList, newAlert] };
                  }
                  return item;
                }));
                setAlertRoute(null);
              }}
            />
          )}

          {/* Notification History Dropdown */}
          {showNotifHistory && (
        <div style={{
          position: 'fixed', top: '150px', right: '40px', width: '380px', maxHeight: '420px', overflowY: 'auto',
          background: '#fff', borderRadius: '14px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)', zIndex: 1200,
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="var(--primary)" /> Recent Route Alerts
            </h4>
            <button onClick={() => setShowNotifHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>
          {recentNotifs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet</div>
          ) : recentNotifs.map(n => (
            <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={15} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>{n.notificationType} — {n.routeName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(n.createdAt).toLocaleDateString()} at {n.effectiveTime} · {n.notifiedCount} notified</div>
                {n.customMessage && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>"{n.customMessage.slice(0,60)}{n.customMessage.length > 60 ? '…' : ''}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── GLOBAL ALERT MODAL ── */}
      {showAlertModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', width: '560px', maxWidth: '95vw',
            boxShadow: '0 30px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={22} color="#fff" />
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>Create Route Alert</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>Broadcast to all route stakeholders instantly</p>
                </div>
              </div>
              <button onClick={() => { setShowAlertModal(false); resetAlertModal(); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            {/* Step indicator */}
            <div style={{ padding: '16px 28px', background: '#F8FAFC', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['Route', 'Type', 'Details', 'Send'].map((label, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800,
                      background: alertStep > i + 1 ? '#10B981' : alertStep === i + 1 ? '#7C3AED' : '#E5E7EB',
                      color: alertStep >= i + 1 ? '#fff' : 'var(--text-muted)',
                    }}>{alertStep > i + 1 ? '✓' : i + 1}</div>
                    <span style={{ fontSize: '0.78rem', fontWeight: alertStep === i + 1 ? 700 : 500, color: alertStep === i + 1 ? '#7C3AED' : 'var(--text-muted)' }}>{label}</span>
                  </div>
                  {i < 3 && <div style={{ flex: 1, height: '2px', background: alertStep > i + 1 ? '#10B981' : '#E5E7EB', borderRadius: '2px' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {!alertSent ? (
                <>
                  {/* STEP 1: Route Selection */}
                  {alertStep === 1 && (
                    <div>
                      <h3 style={{ margin: '0 0 16px 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapIcon size={18} color="#7C3AED" /> Select Route
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.map(r => (
                          <label key={r.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                            border: `2px solid ${alertForm.routeId === r.id ? '#7C3AED' : 'var(--border)'}`,
                            background: alertForm.routeId === r.id ? '#F5F3FF' : '#F9FAFB',
                            transition: 'all 0.15s',
                          }}>
                            <input type="radio" name="quickRoute" value={r.id}
                              checked={alertForm.routeId === r.id}
                              onChange={() => {
                                setAlertForm(f => ({ ...f, routeId: r.id, routeName: r.route }));
                                fetchAlertVehicles(r.id);
                              }}
                              style={{ accentColor: '#7C3AED', width: '16px', height: '16px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{r.route}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {r.zone} · Vehicle: {r.vehicleNumber} · Circle: {r.circleNumber}
                              </div>
                            </div>
                            {alertForm.routeId === r.id && <CheckCircle size={16} color="#7C3AED" />}
                          </label>
                        ))}
                      </div>
                      {/* Dynamic vehicle + member preview after route selected */}
                      {alertForm.routeId && (
                        <div style={{ marginTop: '16px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#7C3AED', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bus size={14} /> Route Members (Auto-Fetched)
                          </div>
                          {alertVehiclesLoading ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <RefreshCw size={14} /> Loading vehicles and members…
                            </div>
                          ) : alertVehicles.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#92400E', background: '#FEF9C3', borderRadius: '6px', padding: '8px 12px' }}>
                              ⚠️ No active vehicles assigned to this route yet.
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                {alertVehicles.map(v => (
                                  <span key={v.id} style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    🚌 {v.vehicleNumber}
                                  </span>
                                ))}
                              </div>
                              {alertStakeholders && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px', marginTop: '8px' }}>
                                  {[
                                    { label: 'Students', count: alertStakeholders.students?.length || 0, color: '#3B82F6' },
                                    { label: 'Parents',  count: alertStakeholders.parents?.length || 0,  color: '#10B981' },
                                    { label: 'Drivers',  count: alertStakeholders.drivers?.length || 0,  color: '#7C3AED' },
                                    { label: 'Coords',   count: alertStakeholders.coordinators?.length || 0, color: '#F59E0B' },
                                    { label: 'HODs',     count: alertStakeholders.hods?.length || 0,     color: '#EF4444' },
                                  ].map(s => (
                                    <div key={s.label} style={{ background: '#fff', borderRadius: '6px', padding: '6px', textAlign: 'center', border: `1.5px solid ${s.color}30` }}>
                                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.count}</div>
                                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 2: Alert Type — 3 focused cards */}
                  {alertStep === 2 && (
                    <div>
                      <h3 style={{ margin: '0 0 6px 0', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color="#7C3AED" /> Choose Alert Type
                      </h3>
                      <p style={{ margin: '0 0 18px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Select the type of alert to dispatch to all members of <strong>{alertForm.routeName}</strong>.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {ALERT_TYPES.map(t => {
                          const selected = alertForm.notificationType === t.value;
                          return (
                            <label key={t.value} style={{
                              display: 'flex', alignItems: 'center', gap: '16px',
                              padding: '18px 20px', borderRadius: '14px', cursor: 'pointer',
                              border: `2px solid ${selected ? t.border : '#E5E7EB'}`,
                              background: selected ? t.bg : '#F9FAFB',
                              boxShadow: selected ? `0 4px 16px ${t.color}20` : 'none',
                              transition: 'all 0.18s',
                            }}>
                              <input type="radio" name="alertTypeFocused" value={t.value}
                                checked={selected}
                                onChange={() => setAlertForm(f => ({ ...f, notificationType: t.value }))}
                                style={{ display: 'none' }}
                              />
                              <div style={{
                                width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                                background: selected ? t.color : '#E5E7EB',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.6rem', transition: 'all 0.18s',
                              }}>
                                {t.emoji}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: selected ? t.color : 'var(--text-main)', marginBottom: '4px' }}>
                                  {t.label}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
                              </div>
                              {selected && (
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <CheckCircle size={14} color="#fff" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Details */}
                  {alertStep === 3 && (() => {
                    const selectedType = ALERT_TYPES.find(t => t.value === alertForm.notificationType);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: selectedType?.bg || '#F9FAFB', borderRadius: '10px', border: `1px solid ${selectedType?.border || '#E5E7EB'}` }}>
                          <span style={{ fontSize: '1.5rem' }}>{selectedType?.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: selectedType?.color }}>{selectedType?.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>for {alertForm.routeName}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EFFECTIVE DATE</label>
                            <input type="date" value={alertForm.effectiveDate}
                              onChange={e => setAlertForm(f => ({ ...f, effectiveDate: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EFFECTIVE TIME</label>
                            <input type="time" value={alertForm.effectiveTime}
                              onChange={e => setAlertForm(f => ({ ...f, effectiveTime: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DURATION (leave blank for today only)</label>
                          <input type="text" placeholder="e.g. 2 hours / Today Only / Until further notice"
                            value={alertForm.duration}
                            onChange={e => setAlertForm(f => ({ ...f, duration: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                        </div>
                        {/* NewPath conditional field */}
                        {alertForm.notificationType === 'NewPath' && (
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', display: 'block', marginBottom: '6px' }}>🔀 NEW PATH / DIVERSION DETAILS *</label>
                            <textarea
                              placeholder="e.g. Route now goes via NH-48 (Sriperumbudur bypass) due to road closure at Porur junction. Expected delay: 20 mins."
                              value={alertForm.newPathDetails}
                              onChange={e => setAlertForm(f => ({ ...f, newPathDetails: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #93C5FD', minHeight: '80px', resize: 'vertical', fontSize: '0.9rem', background: '#EFF6FF' }}
                            />
                          </div>
                        )}
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ADDITIONAL MESSAGE (Optional)</label>
                          <textarea
                            placeholder="Enter any additional message for students, parents, drivers and coordinators…"
                            value={alertForm.customMessage}
                            onChange={e => setAlertForm(f => ({ ...f, customMessage: e.target.value }))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '70px', resize: 'none', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* STEP 4: Confirm & Send */}
                  {alertStep === 4 && (() => {
                    const selectedType = ALERT_TYPES.find(t => t.value === alertForm.notificationType);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Confirm & Send Alert</h3>

                        {/* Alert summary */}
                        <div style={{ background: selectedType?.bg || '#F9FAFB', border: `1px solid ${selectedType?.border || '#E5E7EB'}`, borderRadius: '12px', padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{selectedType?.emoji}</span>
                            <div style={{ fontWeight: 800, color: selectedType?.color, fontSize: '1rem' }}>{selectedType?.label}</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                            <div><strong>Route:</strong> {alertForm.routeName}</div>
                            <div><strong>Vehicles:</strong> {alertVehicles.length} active</div>
                            <div><strong>Date:</strong> {alertForm.effectiveDate}</div>
                            <div><strong>Time:</strong> {alertForm.effectiveTime}</div>
                            {alertForm.duration && <div style={{ gridColumn: '1/-1' }}><strong>Duration:</strong> {alertForm.duration}</div>}
                            {alertForm.newPathDetails && <div style={{ gridColumn: '1/-1' }}><strong>New Path:</strong> {alertForm.newPathDetails}</div>}
                            {alertForm.customMessage && <div style={{ gridColumn: '1/-1', fontStyle: 'italic' }}><strong>Message:</strong> "{alertForm.customMessage}"</div>}
                          </div>
                        </div>

                        {/* Dynamic stakeholders from route vehicle assignments */}
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px' }}>
                          <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                            <Users size={14} /> Recipients — Auto-Fetched from Route Vehicles
                          </div>
                          {alertStakeholdersLoading ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <RefreshCw size={12} /> Fetching members…
                            </div>
                          ) : alertStakeholders ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px' }}>
                              {[
                                { label: 'Students', count: alertStakeholders.students?.length || 0, color: '#3B82F6', emoji: '🎓' },
                                { label: 'Parents',  count: alertStakeholders.parents?.length || 0,  color: '#10B981', emoji: '👨‍👩‍👧' },
                                { label: 'Drivers',  count: alertStakeholders.drivers?.length || 0,  color: '#7C3AED', emoji: '🚗' },
                                { label: 'Coords',   count: alertStakeholders.coordinators?.length || 0, color: '#F59E0B', emoji: '👤' },
                                { label: 'HODs',     count: alertStakeholders.hods?.length || 0,     color: '#EF4444', emoji: '🏫' },
                              ].map(s => (
                                <div key={s.label} style={{ background: '#fff', borderRadius: '8px', padding: '10px 6px', textAlign: 'center', border: `2px solid ${s.color}30` }}>
                                  <div style={{ fontSize: '1rem', marginBottom: '2px' }}>{s.emoji}</div>
                                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: s.color }}>{s.count}</div>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              No assigned vehicles found — 0 members will be notified directly.
                            </div>
                          )}
                          <div style={{ marginTop: '10px', fontSize: '0.73rem', color: '#166534', background: '#DCFCE7', borderRadius: '6px', padding: '6px 10px' }}>
                            ℹ️ Members are <strong>automatically retrieved</strong> from vehicles assigned to this route.
                          </div>
                        </div>

                        {/* Channels */}
                        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#1D4ED8' }}>
                          <strong>📡 Broadcast via:</strong> In-App · Socket.IO · Student App · Parent App · Driver App · Coordinator App · HOD Dashboard
                        </div>

                        <button
                          onClick={handleAlertSend} disabled={alertSending}
                          style={{
                            width: '100%', padding: '16px',
                            background: alertSending ? '#9CA3AF' : `linear-gradient(135deg, ${ALERT_TYPES.find(t => t.value === alertForm.notificationType)?.color || '#7C3AED'}, #4F46E5)`,
                            color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem',
                            cursor: alertSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            boxShadow: alertSending ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Bell size={20} /> {alertSending ? 'Sending…' : '🔔 Send Alert Now'}
                        </button>
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* Success state */
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontWeight: 800, color: '#166534', marginBottom: '8px' }}>Alert Broadcasted!</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <strong>{ALERT_TYPES.find(t => t.value === alertForm.notificationType)?.label}</strong> dispatched for <strong>{alertForm.routeName}</strong>
                  </p>
                  {alertStakeholders && (
                    <p style={{ fontSize: '0.82rem', color: '#166534', background: '#F0FDF4', borderRadius: '8px', padding: '8px 16px', display: 'inline-block', marginBottom: '20px' }}>
                      📢 Notified: {(alertStakeholders.students?.length || 0) + (alertStakeholders.parents?.length || 0) + (alertStakeholders.drivers?.length || 0) + (alertStakeholders.coordinators?.length || 0) + (alertStakeholders.hods?.length || 0)} stakeholders across {alertVehicles.length} vehicle(s)
                    </p>
                  )}
                  <br />
                  <button
                    onClick={() => { setShowAlertModal(false); resetAlertModal(); }}
                    style={{ padding: '12px 28px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            {!alertSent && (
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: '#F8FAFC' }}>
                <button
                  onClick={() => alertStep > 1 ? setAlertStep(s => s - 1) : (setShowAlertModal(false), resetAlertModal())}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}
                >
                  {alertStep === 1 ? 'Cancel' : '← Back'}
                </button>
                {alertStep < 4 ? (
                  <button
                    onClick={() => setAlertStep(s => s + 1)}
                    disabled={(alertStep === 1 && !alertForm.routeId) || (alertStep === 2 && !alertForm.notificationType)}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      background: ((alertStep === 1 && !alertForm.routeId) || (alertStep === 2 && !alertForm.notificationType)) ? '#E5E7EB' : '#7C3AED',
                      color: ((alertStep === 1 && !alertForm.routeId) || (alertStep === 2 && !alertForm.notificationType)) ? '#9CA3AF' : '#fff',
                      cursor: ((alertStep === 1 && !alertForm.routeId) || (alertStep === 2 && !alertForm.notificationType)) ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Next →
                  </button>
                ) : null}
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
