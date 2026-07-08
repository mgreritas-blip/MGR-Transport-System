import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle, Wrench, ClipboardList, CheckCircle2, PlusCircle,
  Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp,
  FileText, CheckCircle, XCircle, User, Bus, Calendar,
  Download, Eye, Clock, Activity, Shield, Search
} from 'lucide-react';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Topbar  from '../components/Topbar';

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
const API = 'http://localhost:3000';
let socket = null;

const PRI = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626', border: '#EF4444', dot: '#EF4444' },
  high:     { bg: 'rgba(245,158,11,0.12)', color: '#B45309', border: '#F59E0B', dot: '#F59E0B' },
  medium:   { bg: 'rgba(59,130,246,0.12)', color: '#1D4ED8', border: '#3B82F6', dot: '#3B82F6' },
  low:      { bg: 'rgba(16,185,129,0.12)', color: '#047857', border: '#10B981', dot: '#10B981' },
};
const pri = (p) => PRI[(p || '').toLowerCase()] || PRI.medium;

const STA = {
  pending:      { color: '#DC2626', bg: 'rgba(239,68,68,0.10)', icon: '🔴' },
  open:         { color: '#DC2626', bg: 'rgba(239,68,68,0.10)', icon: '🔴' },
  acknowledged: { color: '#D97706', bg: 'rgba(245,158,11,0.10)', icon: '👁️' },
  in_progress:  { color: '#2563EB', bg: 'rgba(59,130,246,0.10)', icon: '🔧' },
  approved:     { color: '#059669', bg: 'rgba(16,185,129,0.10)', icon: '✅' },
  completed:    { color: '#047857', bg: 'rgba(16,185,129,0.14)', icon: '✅' },
  resolved:     { color: '#047857', bg: 'rgba(16,185,129,0.14)', icon: '✅' },
  rejected:     { color: '#6B7280', bg: 'rgba(107,114,128,0.10)', icon: '❌' },
};
const sta = (s) => STA[(s || '').toLowerCase().replace(/\s/g, '_')] || { color: '#64748B', bg: '#F1F5F9', icon: '📋' };

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
}) : '—';
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

/* ═══════════════════════════════════════════════════════════════════════════════
   INLINE STYLE TOKENS  (Glassmorphism Design System)
   ═══════════════════════════════════════════════════════════════════════════════ */
const glass = {
  card: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  },
  cardSolid: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  th: {
    padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800,
    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em',
    background: '#F8FAFC', borderBottom: '2px solid #F1F5F9', whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px', fontSize: '0.82rem', color: '#334155',
    borderBottom: '1px solid #F8FAFC', verticalAlign: 'middle',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   BADGE / CHIP COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
const Badge = ({ children, bg, color, border, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: '999px',
    background: bg, color, border: `1px solid ${border || color}20`, ...style,
  }}>{children}</span>
);

const StatCard = ({ icon, label, value, color, bg }) => (
  <div style={{
    ...glass.cardSolid, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
    minWidth: '155px', flex: '1 1 155px', transition: 'transform 0.15s, box-shadow 0.15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
  >
    <div style={{ width: 40, height: 40, borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   PULSE DOT
   ═══════════════════════════════════════════════════════════════════════════════ */
const PulseDot = ({ color = '#10B981', size = 8 }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
    <span style={{
      position: 'absolute', inset: 0, borderRadius: '50%', background: color,
      animation: 'pulseDot 1.5s ease-in-out infinite', opacity: 0.6,
    }} />
    <span style={{ width: size, height: size, borderRadius: '50%', background: color }} />
  </span>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const Issues = () => {
  // ── State ──
  const [alerts, setAlerts]       = useState([]);           // admin-raised maintenance logs
  const [issues, setIssues]       = useState([]);           // driver-reported issues
  const [vehicles, setVehicles]   = useState([]);           // for dropdown
  const [drivers, setDrivers]     = useState([]);           // for dropdown
  const [loading, setLoading]     = useState({ alerts: true, issues: true });
  const [connected, setConnected] = useState(false);

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData]     = useState({
    vehicle: '', issueType: 'Engine/Mechanical', description: '',
    priority: 'Medium', scheduledDate: '', notes: '',
  });

  // Filters for ongoing section
  const [ongoingFilter, setOngoingFilter] = useState('all'); // all | Pending | Acknowledged
  const [search, setSearch] = useState('');

  // Completed section toggle
  const [showCompleted, setShowCompleted] = useState(false);

  // Export vehicle filter — admin selects which vehicle log to download
  const [exportVehicle, setExportVehicle] = useState('');

  // Vehicle members preview (shown in create-modal when a vehicle is selected)
  const [vehicleMembers, setVehicleMembers] = useState(null); // { driver, students:[], parents:[], coordinators:[] }

  // ── Socket.IO ──
  useEffect(() => {
    socket = io(API, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => { setConnected(true); socket.emit('joinRoom', { role: 'superadmin' }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('newMaintenanceAlert', (a)  => setAlerts(p => [{ ...a, _new: true }, ...p]));
    socket.on('alertStatusUpdated',  (u)  => setAlerts(p => p.map(a => a.id === u.id ? u : a)));
    socket.on('newIssueAlert',       (i)  => setIssues(p => [{ ...i, _new: true }, ...p]));
    socket.on('issueResolved',       (u)  => setIssues(p => p.map(i => i.id === u.id ? u : i)));
    return () => { socket?.disconnect(); };
  }, []);

  // ── Fetch ──
  const fetchAll = useCallback(() => {
    setLoading({ alerts: true, issues: true });
    fetch(`${API}/api/maintenance-alerts`).then(r => r.json()).then(d => setAlerts(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(l => ({ ...l, alerts: false })));
    fetch(`${API}/api/issues`).then(r => r.json()).then(d => setIssues(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(l => ({ ...l, issues: false })));
    fetch(`${API}/api/vehicles`).then(r => r.json()).then(d => {
      const vList = Array.isArray(d) ? d : [];
      setVehicles(vList);
      // Extract drivers from vehicle relations
      const drvs = vList.filter(v => v.driver).map(v => ({ id: v.driver.id, name: v.driver.name, vehicleNumber: v.number }));
      setDrivers(drvs);
    }).catch(() => {});
  }, []);
  useEffect(fetchAll, [fetchAll]);

  // ── Derived data ──
  const ongoingAlerts   = alerts.filter(a => a.status !== 'Resolved');
  const completedAlerts = alerts.filter(a => a.status === 'Resolved');
  const openIssues      = issues.filter(i => i.status === 'open');
  const resolvedIssues  = issues.filter(i => i.status === 'resolved');

  const filteredOngoing = ongoingAlerts.filter(a => {
    if (ongoingFilter !== 'all' && a.status !== ongoingFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (a.vehicle || '').toLowerCase().includes(s)
        || (a.issueType || '').toLowerCase().includes(s)
        || (a.description || '').toLowerCase().includes(s);
    }
    return true;
  });

  // ── Vehicle → driver lookup ──
  const vehicleDriverMap = {};
  vehicles.forEach(v => { if (v.driver) vehicleDriverMap[v.number] = v.driver.name; });

  // ── Handlers ──

  // When admin picks a vehicle in the modal, fetch its members dynamically
  const handleVehicleSelect = async (vehicleNumber) => {
    setFormData(p => ({ ...p, vehicle: vehicleNumber }));
    setVehicleMembers(null);
    if (!vehicleNumber) return;
    try {
      const veh = vehicles.find(v => v.number === vehicleNumber);
      if (!veh) return;
      const res = await fetch(`${API}/api/vehicles/${veh.id}/members`);
      if (res.ok) setVehicleMembers(await res.json());
    } catch { /* non-fatal */ }
  };

  const handleCreate = async () => {
    if (!formData.vehicle || !formData.description) return alert('Vehicle and Description are required.');
    const desc = formData.scheduledDate
      ? `${formData.description} | Scheduled: ${formData.scheduledDate}${formData.notes ? ` | Notes: ${formData.notes}` : ''}`
      : `${formData.description}${formData.notes ? ` | Notes: ${formData.notes}` : ''}`;
    try {
      const res = await fetch(`${API}/api/maintenance-alerts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle: formData.vehicle, issueType: formData.issueType, description: desc, priority: formData.priority, raisedBy: 'Admin' }),
      });
      if (!res.ok) throw new Error();
      setShowCreate(false);
      setVehicleMembers(null);
      setFormData({ vehicle: '', issueType: 'Engine/Mechanical', description: '', priority: 'Medium', scheduledDate: '', notes: '' });
    } catch { alert('Backend error — is server running on port 3000?'); }
  };

  const resolveIssue = async (id) => {
    try {
      await fetch(`${API}/api/issues/${id}/resolve`, { method: 'PATCH' });
      setIssues(p => p.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
    } catch { alert('Failed to resolve.'); }
  };

  const updateAlertStatus = async (id, status) => {
    try {
      await fetch(`${API}/api/maintenance-alerts/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, acknowledgedBy: 'Admin' }),
      });
    } catch { alert('Failed to update status.'); }
  };

  const downloadCSV = (range) => {
    const veh = exportVehicle ? `&vehicle=${encodeURIComponent(exportVehicle)}` : '';
    window.open(`${API}/api/maintenance-alerts/export?range=${range}&status=Resolved${veh}`, '_blank');
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content" style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100vh' }}>

          {/* ╔═══════════════════════════════════════════════════╗
              ║  HEADER                                          ║
              ╚═══════════════════════════════════════════════════╝ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                🔧 Maintenance Log
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                {connected
                  ? <><PulseDot color="#10B981" /><span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>Live — Real-time sync active</span></>
                  : <><WifiOff size={13} color="#EF4444" /><span style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 700 }}>Disconnected</span></>
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={fetchAll} style={{
                padding: '10px 18px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0',
                borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
              }}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setShowCreate(true)} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800,
                fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)', transition: 'all 0.15s',
              }}>
                <PlusCircle size={15} /> Create Maintenance Log
              </button>
            </div>
          </div>

          {/* ╔═══════════════════════════════════════════════════╗
              ║  STAT CARDS                                      ║
              ╚═══════════════════════════════════════════════════╝ */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <StatCard icon={<AlertTriangle size={18} color="#DC2626" />} label="Driver Issues (Open)" value={openIssues.length}   color="#DC2626" bg="rgba(239,68,68,0.10)" />
            <StatCard icon={<Activity size={18} color="#D97706" />}      label="Ongoing Logs"        value={ongoingAlerts.length} color="#D97706" bg="rgba(245,158,11,0.10)" />
            <StatCard icon={<CheckCircle size={18} color="#059669" />}   label="Completed"            value={completedAlerts.length} color="#059669" bg="rgba(16,185,129,0.10)" />
            <StatCard icon={<Shield size={18} color="#7C3AED" />}       label="Critical/High"        value={alerts.filter(a => a.priority === 'Critical' || a.priority === 'High').length} color="#7C3AED" bg="rgba(124,58,237,0.10)" />
            <StatCard icon={<Bus size={18} color="#2563EB" />}          label="Total Vehicles"       value={vehicles.length}      color="#2563EB" bg="rgba(59,130,246,0.10)" />
          </div>

          {/* ╔═══════════════════════════════════════════════════╗
              ║  SIDE-BY-SIDE NOTIFICATION PANELS                ║
              ╚═══════════════════════════════════════════════════╝ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

            {/* ── LEFT: Driver-Raised Issues ── */}
            <div style={{ ...glass.card, padding: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={16} color="#DC2626" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>Driver-Raised Issues</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Reported via Mobile Officer App</div>
                  </div>
                </div>
                <Badge bg="rgba(239,68,68,0.10)" color="#DC2626" style={{ fontSize: '0.72rem' }}>
                  {openIssues.length} open
                </Badge>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {loading.issues ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>Loading…</div>
                ) : issues.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                    <Bus size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No driver issues reported yet.</p>
                  </div>
                ) : (
                  issues.map((issue, idx) => {
                    const s = sta(issue.status);
                    const isOpen = issue.status === 'open';
                    return (
                      <div key={issue.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                        background: isOpen ? 'rgba(239,68,68,0.04)' : '#F8FAFC',
                        border: `1px solid ${isOpen ? 'rgba(239,68,68,0.15)' : '#F1F5F9'}`,
                        animation: issue._new ? 'slideIn 0.4s ease-out' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A' }}>{issue.type}</span>
                            <Badge bg={s.bg} color={s.color}>{s.icon} {issue.status}</Badge>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                            {issue.description}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '5px', fontSize: '0.7rem', color: '#94A3B8' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Bus size={10} /> {issue.vehicleId || 'N/A'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <User size={10} /> {issue.reportedBy || 'Driver'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> {fmtShort(issue.createdAt)}
                            </span>
                          </div>
                        </div>
                        {isOpen && (
                          <button onClick={() => resolveIssue(issue.id)} style={{
                            padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800,
                            background: 'rgba(16,185,129,0.10)', color: '#059669',
                            border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px',
                            cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '10px', transition: 'all 0.15s',
                          }}>
                            ✅ Resolve
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT: Completed Maintenance Logs (admin-raised, resolved by maintenance team) ── */}
            <div style={{ ...glass.card, padding: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={16} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>Completed Maintenance Logs</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Resolved by Maintenance Team via App</div>
                  </div>
                </div>
                <Badge bg="rgba(16,185,129,0.10)" color="#059669" style={{ fontSize: '0.72rem' }}>
                  {completedAlerts.length} done
                </Badge>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {loading.alerts ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>Loading…</div>
                ) : completedAlerts.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                    <CheckCircle2 size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No completed logs yet.</p>
                  </div>
                ) : (
                  completedAlerts.map((log) => (
                    <div key={log.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                      background: '#F0FDF4', border: '1px solid rgba(16,185,129,0.15)',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A' }}>{log.vehicle}</span>
                          <Badge bg={pri(log.priority).bg} color={pri(log.priority).color}>{log.priority}</Badge>
                          <Badge bg="rgba(16,185,129,0.12)" color="#059669">✅ Resolved</Badge>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                          [{log.issueType}] {log.description}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '5px', fontSize: '0.7rem', color: '#94A3B8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <User size={10} /> {log.acknowledgedBy || log.raisedBy}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={10} /> Resolved: {fmtShort(log.resolvedAt)}
                          </span>
                          {vehicleDriverMap[log.vehicle] && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <User size={10} /> Driver: {vehicleDriverMap[log.vehicle]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ╔═══════════════════════════════════════════════════╗
              ║  ONGOING MAINTENANCE — STATUS SECTION             ║
              ╚═══════════════════════════════════════════════════╝ */}
          <div style={{ ...glass.card, padding: '20px', marginBottom: '24px' }}>
            {/* Section header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={17} color="#D97706" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Ongoing Maintenance Status</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>All active logs synced to vehicle &amp; driver IDs</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px' }} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search vehicle, type…"
                    style={{ padding: '7px 10px 7px 30px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.78rem', width: '180px', outline: 'none', background: '#F8FAFC' }}
                  />
                </div>
                {/* Filter pills */}
                {['all', 'Pending', 'Acknowledged'].map(f => (
                  <button key={f} onClick={() => setOngoingFilter(f)} style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                    background: ongoingFilter === f ? '#7C3AED' : '#fff',
                    color: ongoingFilter === f ? '#fff' : '#64748B',
                    border: `1.5px solid ${ongoingFilter === f ? '#7C3AED' : '#E2E8F0'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {f === 'all' ? `All (${ongoingAlerts.length})` : `${f} (${ongoingAlerts.filter(a => a.status === f).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Ongoing table */}
            {filteredOngoing.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', background: '#FAFBFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                <ClipboardList size={30} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No ongoing maintenance logs{search ? ' matching your search' : ''}.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr>
                      {['#', 'Vehicle', 'Driver', 'Issue Type', 'Description', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                        <th key={h} style={glass.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOngoing.map((log, idx) => {
                      const p = pri(log.priority);
                      const s = sta(log.status);
                      const driverName = vehicleDriverMap[log.vehicle] || '—';
                      return (
                        <tr key={log.id} style={{
                          background: idx % 2 === 0 ? '#fff' : '#FAFBFC',
                          animation: log._new ? 'highlight 2s ease-out' : 'none',
                          transition: 'background 0.15s',
                        }}>
                          <td style={{ ...glass.td, color: '#CBD5E1', fontWeight: 800, width: '36px' }}>{String(idx + 1).padStart(2, '0')}</td>
                          <td style={{ ...glass.td, fontWeight: 800, color: '#1E293B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Bus size={13} color="#2563EB" /> {log.vehicle}
                            </div>
                          </td>
                          <td style={{ ...glass.td, fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7C3AED', fontWeight: 600 }}>
                              <User size={12} color="#7C3AED" /> {driverName}
                            </div>
                          </td>
                          <td style={{ ...glass.td, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Wrench size={12} color={p.color} /> {log.issueType}
                            </div>
                          </td>
                          <td style={{ ...glass.td, maxWidth: '200px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem', color: '#64748B' }}>
                              {log.description}
                            </div>
                          </td>
                          <td style={glass.td}>
                            <Badge bg={p.bg} color={p.color} border={p.border}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot, display: 'inline-block' }} />
                              {log.priority}
                            </Badge>
                          </td>
                          <td style={glass.td}>
                            <Badge bg={s.bg} color={s.color}>
                              <PulseDot color={s.color} size={6} /> {log.status}
                            </Badge>
                          </td>
                          <td style={{ ...glass.td, fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {fmtShort(log.createdAt)}
                          </td>
                          <td style={{ ...glass.td, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              {log.status === 'Pending' && (
                                <button onClick={() => updateAlertStatus(log.id, 'Acknowledged')} style={{
                                  padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800,
                                  background: 'rgba(245,158,11,0.10)', color: '#D97706',
                                  border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', cursor: 'pointer',
                                }}>
                                  👁️ Ack
                                </button>
                              )}
                              {(log.status === 'Pending' || log.status === 'Acknowledged') && (
                                <button onClick={() => updateAlertStatus(log.id, 'Resolved')} style={{
                                  padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800,
                                  background: 'rgba(16,185,129,0.10)', color: '#059669',
                                  border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', cursor: 'pointer',
                                }}>
                                  ✅ Done
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ╔═══════════════════════════════════════════════════╗
              ║  COMPLETED LOGS + DOWNLOAD                       ║
              ╚═══════════════════════════════════════════════════╝ */}
          <div style={{ ...glass.card, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCompleted ? '16px' : 0, flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setShowCompleted(p => !p)}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={17} color="#059669" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Completed Maintenance Records</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Full history with export options</div>
                </div>
                <span style={{ marginLeft: '6px' }}>
                  {showCompleted ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Vehicle filter selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>Vehicle:</span>
                  <select
                    value={exportVehicle}
                    onChange={e => setExportVehicle(e.target.value)}
                    style={{
                      padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700,
                      border: '1.5px solid #E2E8F0', borderRadius: '8px',
                      background: exportVehicle ? 'rgba(37,99,235,0.06)' : '#F8FAFC',
                      color: exportVehicle ? '#2563EB' : '#64748B',
                      outline: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      minWidth: '120px',
                    }}
                  >
                    <option value=''>All Vehicles</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.number}>{v.number}{v.driver ? ` (${v.driver.name})` : ''}</option>
                    ))}
                  </select>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginLeft: '4px' }}>Export:</span>
                {[
                  { label: 'Today', range: 'day', color: '#2563EB', bg: 'rgba(59,130,246,0.08)' },
                  { label: 'This Week', range: 'week', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
                  { label: 'This Year', range: 'year', color: '#059669', bg: 'rgba(16,185,129,0.08)' },
                ].map(dl => (
                  <button key={dl.range} onClick={() => downloadCSV(dl.range)} style={{
                    padding: '7px 14px', fontSize: '0.75rem', fontWeight: 800,
                    background: dl.bg, color: dl.color, border: `1px solid ${dl.color}30`,
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'all 0.15s',
                  }}>
                    <Download size={12} /> {dl.label}
                  </button>
                ))}
              </div>
            </div>

            {showCompleted && (
              completedAlerts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', background: '#FAFBFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                  <CheckCircle2 size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No completed logs to display.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                    <thead>
                      <tr>
                        {['#', 'Vehicle', 'Driver', 'Issue Type', 'Description', 'Priority', 'Raised By', 'Resolved By', 'Created', 'Resolved'].map(h => (
                          <th key={h} style={glass.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {completedAlerts.map((log, idx) => {
                        const p = pri(log.priority);
                        const driverName = vehicleDriverMap[log.vehicle] || '—';
                        return (
                          <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                            <td style={{ ...glass.td, color: '#CBD5E1', fontWeight: 800, width: '36px' }}>{String(idx + 1).padStart(2, '0')}</td>
                            <td style={{ ...glass.td, fontWeight: 800, color: '#1E293B' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Bus size={12} color="#2563EB" /> {log.vehicle}
                              </div>
                            </td>
                            <td style={{ ...glass.td, fontSize: '0.8rem', color: '#7C3AED', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={11} color="#7C3AED" /> {driverName}
                              </div>
                            </td>
                            <td style={{ ...glass.td, fontWeight: 600 }}>{log.issueType}</td>
                            <td style={{ ...glass.td, maxWidth: '180px' }}>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem', color: '#64748B' }}>
                                {log.description}
                              </div>
                            </td>
                            <td style={glass.td}>
                              <Badge bg={p.bg} color={p.color}>{log.priority}</Badge>
                            </td>
                            <td style={{ ...glass.td, fontSize: '0.78rem', color: '#64748B' }}>{log.raisedBy}</td>
                            <td style={{ ...glass.td, fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>{log.acknowledgedBy || '—'}</td>
                            <td style={{ ...glass.td, fontSize: '0.73rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>{fmtShort(log.createdAt)}</td>
                            <td style={{ ...glass.td, fontSize: '0.73rem', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtShort(log.resolvedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

        </section>
      </main>

      {/* ╔═══════════════════════════════════════════════════════════════════════
          ║  CREATE MAINTENANCE LOG MODAL
          ╚═══════════════════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            background: '#fff', padding: '28px', borderRadius: '20px', width: '500px',
            maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 70px rgba(0,0,0,0.2)', animation: 'scaleIn 0.25s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0F172A' }}>
                  🔧 Create Maintenance Log
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                  Saved to DB &amp; pushed via WebSocket to Maintenance Team
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{
                width: 32, height: 32, borderRadius: '8px', border: 'none',
                background: '#F1F5F9', color: '#64748B', fontSize: '1.1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* Vehicle dropdown — dynamic */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>
                Vehicle *
              </label>
              <select
                value={formData.vehicle}
                onChange={e => handleVehicleSelect(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0',
                  borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC', outline: 'none',
                  color: formData.vehicle ? '#0F172A' : '#94A3B8',
                }}
              >
                <option value="">Select a vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.number}>
                    {v.number} — {v.type}{v.driver ? ` (Driver: ${v.driver.name})` : ''}
                  </option>
                ))}
              </select>

              {/* ── Members preview panel — appears after vehicle pick ── */}
              {formData.vehicle && (
                <div style={{
                  marginTop: '10px', padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)',
                  animation: 'fadeIn 0.25s ease-out',
                }}>
                  {vehicleMembers === null ? (
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>⏳ Loading members…</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED', marginBottom: '8px' }}>
                        📣 Alert will notify these members:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {/* Driver */}
                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#fff', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>🚗 DRIVER</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                            {vehicleMembers.driver ? vehicleMembers.driver.name : <span style={{ color: '#CBD5E1' }}>Unassigned</span>}
                          </div>
                          {vehicleMembers.driver?.phone && <div style={{ fontSize: '0.67rem', color: '#64748B' }}>{vehicleMembers.driver.phone}</div>}
                        </div>
                        {/* Students */}
                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#fff', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>🎓 STUDENTS</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563EB' }}>
                            {(vehicleMembers.students || []).length} assigned
                          </div>
                        </div>
                        {/* Coordinators */}
                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#fff', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>🧑‍💼 COORDINATORS</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                            {(vehicleMembers.coordinators || []).length > 0
                              ? (vehicleMembers.coordinators || []).map(c => c.name).join(', ')
                              : <span style={{ color: '#CBD5E1' }}>None</span>}
                          </div>
                        </div>
                        {/* Parents — auto-derived server-side from student links */}
                        <div style={{ padding: '7px 10px', borderRadius: '8px', background: '#fff', border: '1px solid #F1F5F9' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginBottom: '2px' }}>👨‍👩‍👧 PARENTS</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706' }}>Auto-notified</div>
                          <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>via student links</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>


            {/* Issue type + Priority row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>
                  Maintenance Type
                </label>
                <select value={formData.issueType} onChange={e => setFormData(p => ({ ...p, issueType: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC' }}>
                  {['Engine/Mechanical', 'Brakes', 'Electrical', 'Tyres/Wheels', 'Body/Interior', 'Routine Maintenance', 'Oil Change', 'Safety Inspection', 'Scheduled Service'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>Priority</label>
                <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC' }}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheduled date */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>
                Scheduled Date (optional)
              </label>
              <input type="date" value={formData.scheduledDate}
                onChange={e => setFormData(p => ({ ...p, scheduledDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC', boxSizing: 'border-box' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>
                Description *
              </label>
              <textarea rows="3" value={formData.description} placeholder="Describe the maintenance work…"
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>
                Admin Notes (optional)
              </label>
              <input type="text" value={formData.notes} placeholder="e.g. Vendor: Bosch, Cost: ₹12,000"
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '0.88rem', background: '#FAFBFC', boxSizing: 'border-box' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreate(false)} style={{
                flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569',
                border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleCreate} style={{
                flex: 2, padding: '12px', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}>
                <PlusCircle size={15} /> Save &amp; Push to Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes highlight {
          0%   { background: rgba(254,249,195,0.6) !important; }
          100% { background: transparent !important; }
        }
        @keyframes slideIn {
          0%   { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scaleIn {
          0%   { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.8); opacity: 0; }
        }
        /* Custom scrollbar for panels */
        div::-webkit-scrollbar { width: 5px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Issues;
