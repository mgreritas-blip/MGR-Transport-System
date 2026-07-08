import React, { useState, useEffect, useCallback } from 'react';
import {
  BusFront, UserCog, GraduationCap, AlertTriangle, X, Bell,
  Calendar, Map as MapIcon, RefreshCw, ChevronRight, Activity,
  CheckCircle, Clock, Wrench, Route, Car, Users, Shield, TrendingUp,
  AlertCircle, FileText, Zap,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const API = 'http://localhost:3000';

/* ── helpers ────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ZONE_COLORS = ['#3B82F6', '#10B981', '#7C3AED', '#F59E0B', '#EF4444', '#06B6D4'];

/* ── priority badge ──────────────────────────────────────────────── */
const PriBadge = ({ p }) => {
  const map = { Critical: ['#DC2626','#FEE2E2'], High: ['#D97706','#FEF3C7'], Medium: ['#2563EB','#DBEAFE'], Low: ['#059669','#D1FAE5'] };
  const [c, bg] = map[p] || ['#64748B','#F1F5F9'];
  return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 800, background: bg, color: c }}>{p}</span>;
};

const StatusBadge = ({ s }) => {
  const map = { open: ['#DC2626','#FEE2E2'], resolved: ['#059669','#D1FAE5'], Pending: ['#D97706','#FEF3C7'], Acknowledged: ['#2563EB','#DBEAFE'], Resolved: ['#059669','#D1FAE5'] };
  const [c, bg] = map[s] || ['#64748B','#F1F5F9'];
  return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 800, background: bg, color: c }}>{s}</span>;
};

/* ── Modal wrapper ───────────────────────────────────────────────── */
const Modal = ({ title, icon, onClose, children, width = 640 }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
    animation: 'fadeIn 0.18s ease-out',
  }}>
    <div style={{
      background: '#fff', borderRadius: '20px', width, maxWidth: '94vw',
      maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      animation: 'scaleIn 0.22s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900, fontSize: '1.05rem', color: '#0F172A' }}>
          {icon} {title}
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '8px', border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  </div>
);

/* ── Stat card ───────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color, bg, onClick, pulse }) => (
  <div onClick={onClick} style={{
    background: '#fff', borderRadius: '16px', padding: '18px 20px',
    border: `1.5px solid ${color}20`, cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.18s', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    display: 'flex', alignItems: 'center', gap: '14px',
    ':hover': { boxShadow: `0 6px 24px ${color}25` },
  }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${color}20`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
  >
    <div style={{ width: 48, height: 48, borderRadius: '13px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
      {icon}
      {pulse && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulseDot 1.5s infinite' }} />}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color, lineHeight: 1.1, marginTop: '2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>{sub}</div>}
    </div>
    {onClick && <ChevronRight size={16} color="#CBD5E1" />}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  // ── State ──
  const [stats, setStats]             = useState(null);
  const [alertBreak, setAlertBreak]   = useState(null);
  const [zones, setZones]             = useState([]);
  const [zoneBoarded, setZoneBoarded] = useState({ boarded: 0, total: 0 });
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  // Live transit + halt indicators
  const [liveTransit, setLiveTransit] = useState({ inTransit: 0, dropped: 0 });
  const [activeHalts, setActiveHalts] = useState([]);

  // Modals
  const [modal, setModal] = useState(null); // 'vehicles'|'drivers'|'issues'|'alerts'|'students'|'notify'

  // Alert tab inside alerts modal
  const [alertTab, setAlertTab] = useState('all'); // all|route|driver|admin

  // Route alerts tab on dashboard panel
  const [routeTab, setRouteTab] = useState('All');

  // Notification modal form
  const [notiForm, setNotiForm] = useState({ route: '', type: 'Bus Cancellation', from: '', to: '', message: '' });

  // GPS
  const [gpsData, setGpsData] = useState([
    { id: '124A', lat: 13.0827, lng: 80.2707, type: 'bus', lastMove: Date.now() },
    { id: '125B', lat: 13.0600, lng: 80.2500, type: 'bus', lastMove: Date.now() - 6000 },
    { id: '126C', lat: 13.0500, lng: 80.2800, type: 'car', lastMove: Date.now() },
  ]);

  // ── Fetch all dashboard data ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, z] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`).then(r => r.json()),
        fetch(`${API}/api/dashboard/alerts-breakdown`).then(r => r.json()),
        fetch(`${API}/api/dashboard/attendance-zones`).then(r => r.json()),
      ]);
      setStats(s);
      setAlertBreak(a);
      setZones(Array.isArray(z.zones) ? z.zones : []);
      setZoneBoarded({ boarded: z.totalBoarded || 0, total: z.totalAssigned || 0 });
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000); // auto-refresh every 30s
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Mock GPS movement
  useEffect(() => {
    const iv = setInterval(() => {
      setGpsData(prev => prev.map(v => {
        if (v.id === '124A' || v.id === '126C') return { ...v, lng: v.lng + 0.0001, lat: v.lat + 0.00005, lastMove: Date.now() };
        return v;
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Socket.IO
  useEffect(() => {
    import('../api').then(({ socket }) => {
      socket.on('busLocationChanged', d => {
        setGpsData(prev => {
          const i = prev.findIndex(v => v.id === (d.vehicleId || d.id));
          if (i !== -1) { const u = [...prev]; u[i] = { ...u[i], lat: d.lat, lng: d.lng, lastMove: Date.now(), isHalted: d.isHalted }; return u; }
          return [...prev, { id: d.vehicleId || d.id, lat: d.lat, lng: d.lng, type: 'bus', lastMove: Date.now(), isHalted: false }];
        });
      });
      socket.on('newMaintenanceAlert', () => fetchAll());
      socket.on('newIssue', () => fetchAll());
      // Live transit updates — re-fetch stats for accurate student boarded count
      socket.on('studentTransitUpdate', () => fetchAll());
      // Halt events — update active halts list
      socket.on('vehicleHalted', halt => {
        setActiveHalts(prev => [halt, ...prev.filter(h => h.vehicleId !== halt.vehicleId)]);
      });
      socket.on('vehicleResumed', resume => {
        setActiveHalts(prev => prev.filter(h => h.haltId !== resume.haltId));
      });
      socket.on('initialHalts', halts => setActiveHalts(halts || []));
    });
  }, [fetchAll]);

  // Fetch today's transit summary for live indicator
  useEffect(() => {
    const fetchTransit = async () => {
      try {
        const r = await fetch(`${API}/api/transit/today`).then(res => res.json());
        setLiveTransit({ inTransit: r.summary?.inTransit || 0, dropped: r.summary?.dropped || 0 });
      } catch {}
    };
    fetchTransit();
    const iv = setInterval(fetchTransit, 20000);
    return () => clearInterval(iv);
  }, []);

  /* ── derived ── */
  const issuesList   = stats ? [...(stats.openIssuesList || []), ...(stats.maintenanceAlertsList || [])] : [];
  const alertsToday  = alertBreak ? alertBreak.totals.total : 0;
  const routeAlerts  = alertBreak?.routeAlerts || [];
  const todayRouteTabFiltered = routeTab === 'All' ? routeAlerts : routeAlerts.filter(r => r.notificationType === routeTab);

  /* ── colour helpers for zone bars ── */
  const zoneColor = (i) => ZONE_COLORS[i % ZONE_COLORS.length];

  /* ═══════════════════════════════════════════════════════════════
     MODALS
  ═══════════════════════════════════════════════════════════════ */

  const renderIssuesModal = () => (
    <Modal title="System Issues — Live" icon={<AlertTriangle size={18} color="#D97706" />} onClose={() => setModal(null)} width={720}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: `Driver Issues (${stats?.driverIssues || 0})`, key: 'driver', color: '#DC2626', bg: '#FEE2E2' },
          { label: `Admin Maintenance (${stats?.adminIssues || 0})`, key: 'admin', color: '#D97706', bg: '#FEF3C7' },
        ].map(t => (
          <button key={t.key} onClick={() => setAlertTab(t.key)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
            background: alertTab === t.key ? t.color : t.bg, color: alertTab === t.key ? '#fff' : t.color, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
        <button onClick={() => setAlertTab('all')} style={{
          padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
          background: alertTab === 'all' ? '#475569' : '#F1F5F9', color: alertTab === 'all' ? '#fff' : '#475569',
        }}>All ({issuesList.length})</button>
      </div>

      {/* Driver Issues */}
      {(alertTab === 'all' || alertTab === 'driver') && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            🚗 Driver-Raised Vehicle Issues
          </div>
          {(stats?.openIssuesList || []).length === 0
            ? <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', textAlign: 'center', color: '#94A3B8', fontSize: '0.83rem' }}>No open driver issues ✅</div>
            : (stats?.openIssuesList || []).map((issue, i) => (
              <div key={issue.id} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{issue.type}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>{issue.description}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                    🚌 Vehicle: {issue.vehicleId || 'N/A'} &nbsp;|&nbsp; 👤 {issue.reportedBy} &nbsp;|&nbsp; 🕐 {fmt(issue.createdAt)}
                  </div>
                </div>
                <StatusBadge s={issue.status} />
              </div>
            ))
          }
        </div>
      )}

      {/* Admin Maintenance Alerts */}
      {(alertTab === 'all' || alertTab === 'admin') && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            🔧 Admin Maintenance Alerts
          </div>
          {(stats?.maintenanceAlertsList || []).length === 0
            ? <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', textAlign: 'center', color: '#94A3B8', fontSize: '0.83rem' }}>No pending maintenance alerts ✅</div>
            : (stats?.maintenanceAlertsList || []).map((alert) => (
              <div key={alert.id} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{alert.issueType}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>{alert.description}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                    🚌 {alert.vehicle} &nbsp;|&nbsp; 👤 {alert.raisedBy} &nbsp;|&nbsp; 🕐 {fmt(alert.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <PriBadge p={alert.priority} />
                  <StatusBadge s={alert.status} />
                </div>
              </div>
            ))
          }
        </div>
      )}
    </Modal>
  );

  const renderAlertsModal = () => {
    const tabs = [
      { key: 'all', label: `All (${alertBreak?.totals?.total || 0})`, color: '#475569' },
      { key: 'route', label: `Route (${alertBreak?.totals?.route || 0})`, color: '#B91C1C' },
      { key: 'driver', label: `Driver Issues (${alertBreak?.totals?.driver || 0})`, color: '#D97706' },
      { key: 'admin', label: `Maintenance (${alertBreak?.totals?.admin || 0})`, color: '#7C3AED' },
    ];
    const today = alertBreak?.today || '—';

    const renderList = (items, emptyMsg, renderRow) =>
      items.length === 0
        ? <div style={{ padding: '16px', background: '#FAFBFC', borderRadius: '10px', textAlign: 'center', color: '#94A3B8', fontSize: '0.83rem' }}>{emptyMsg}</div>
        : items.map(renderRow);

    return (
      <Modal title={`Alerts Raised — Today (${today})`} icon={<Bell size={18} color="#B91C1C" />} onClose={() => setModal(null)} width={760}>
        {/* Summary counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '18px' }}>
          {[
            { label: 'Route Alerts', val: alertBreak?.totals?.route || 0, color: '#B91C1C', bg: '#FEF2F2', icon: <Route size={15} /> },
            { label: 'Driver Issues', val: alertBreak?.totals?.driver || 0, color: '#D97706', bg: '#FFFBEB', icon: <Car size={15} /> },
            { label: 'Maintenance Logs', val: alertBreak?.totals?.admin || 0, color: '#7C3AED', bg: '#F5F3FF', icon: <Wrench size={15} /> },
          ].map(c => (
            <div key={c.label} style={{ padding: '12px 14px', borderRadius: '12px', background: c.bg, border: `1px solid ${c.color}20`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ color: c.color }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: c.color }}>{c.val}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setAlertTab(t.key)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
              background: alertTab === t.key ? t.color : '#F1F5F9', color: alertTab === t.key ? '#fff' : t.color, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Route alerts */}
        {(alertTab === 'all' || alertTab === 'route') && (
          <section style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🗺 Route Alerts (Coordinator/Admin)</div>
            {renderList(alertBreak?.routeAlerts || [], 'No route alerts today ✅', (r) => (
              <div key={r.id} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{r.routeName}</div>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 800, background: '#DC2626', color: '#fff' }}>{r.notificationType}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>{r.customMessage || '—'}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                  📅 {r.effectiveDate} {r.effectiveTime} &nbsp;|&nbsp; 🕐 {fmt(r.createdAt)} &nbsp;|&nbsp; 👥 {r.totalStudents}s {r.totalParents}p
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Driver issues */}
        {(alertTab === 'all' || alertTab === 'driver') && (
          <section style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🚗 Driver-Raised Vehicle Issues</div>
            {renderList(alertBreak?.driverIssues || [], 'No driver issues today ✅', (d) => (
              <div key={d.id} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{d.type}</div>
                  <StatusBadge s={d.status} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>{d.description}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>🚌 {d.vehicleId || 'N/A'} &nbsp;|&nbsp; 👤 {d.reportedBy} &nbsp;|&nbsp; 🕐 {fmt(d.createdAt)}</div>
              </div>
            ))}
          </section>
        )}

        {/* Admin/maintenance alerts */}
        {(alertTab === 'all' || alertTab === 'admin') && (
          <section>
            <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>🔧 Admin Maintenance Logs</div>
            {renderList(alertBreak?.adminAlerts || [], 'No maintenance alerts today ✅', (a) => (
              <div key={a.id} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{a.issueType} — {a.vehicle}</div>
                  <div style={{ display: 'flex', gap: '4px' }}><PriBadge p={a.priority} /><StatusBadge s={a.status} /></div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>{a.description}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>👤 {a.raisedBy} &nbsp;|&nbsp; 🕐 {fmt(a.createdAt)}</div>
              </div>
            ))}
          </section>
        )}
      </Modal>
    );
  };

  const renderStudentsModal = () => (
    <Modal title={`Students Boarded Today`} icon={<GraduationCap size={18} color="#7E22CE" />} onClose={() => setModal(null)} width={580}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '14px', borderRadius: '12px', background: '#F5F3FF', border: '1px solid #DDD6FE', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7C3AED' }}>{zoneBoarded.boarded}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Boarded Today</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>{zoneBoarded.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Total Assigned</div>
        </div>
      </div>
      <div style={{ marginBottom: '14px', fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>Zone-wise Attendance Breakdown</div>
      {zones.length === 0
        ? <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>No zone data available</div>
        : zones.map((z, i) => (
          <div key={z.zone} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px', fontWeight: 600 }}>
              <span>{z.zone} <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({z.vehicles?.length || 0} vehicles)</span></span>
              <span style={{ fontWeight: 800, color: zoneColor(i) }}>{z.present}/{z.assigned} — {z.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${z.percentage}%`, height: '100%', background: zoneColor(i), borderRadius: '6px', transition: 'width 0.6s ease-out' }} />
            </div>
          </div>
        ))
      }
    </Modal>
  );

  const renderNotifyModal = () => (
    <Modal title="Raise Route Notification" icon={<Bell size={18} color="#B91C1C" />} onClose={() => setModal(null)} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>TARGET ROUTE / ZONE</label>
            <select value={notiForm.route} onChange={e => setNotiForm(p => ({ ...p, route: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F9FAFB', fontSize: '0.88rem' }}>
              <option value="">All Zones (Tamil Nadu)</option>
              <option>Chennai - Route 1</option>
              <option>Chennai - Route 6 (TAMBARAM)</option>
              <option>Arani - Route 1</option>
              <option>Bangalore - Route 1</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>ALERT TYPE</label>
            <select value={notiForm.type} onChange={e => setNotiForm(p => ({ ...p, type: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F9FAFB', fontSize: '0.88rem' }}>
              {['Bus Cancellation','Delay (Road/Tech)','Vehicle Change (Maintenance)','Driver Reassignment'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={14} /> VALIDITY / DURATION
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={notiForm.from} onChange={e => setNotiForm(p => ({ ...p, from: e.target.value }))}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
            <span style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontWeight: 700 }}>to</span>
            <input type="date" value={notiForm.to} onChange={e => setNotiForm(p => ({ ...p, to: e.target.value }))}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>NOTIFICATION MESSAGE</label>
          <textarea value={notiForm.message} onChange={e => setNotiForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Enter the official message for students and parents..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '90px', resize: 'vertical', fontSize: '0.88rem', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => { alert('Emergency Broadcast Sent!'); setModal(null); }} style={{
          padding: '14px', background: 'linear-gradient(135deg,#B91C1C,#991B1B)', color: '#fff', border: 'none',
          borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.92rem',
          boxShadow: '0 4px 14px rgba(185,28,28,0.35)',
        }}>
          📢 SEND NOTIFICATION TO ALL MEMBERS
        </button>
      </div>
    </Modal>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content" style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100vh' }}>

          {/* ── MODALS ── */}
          {modal === 'issues'   && renderIssuesModal()}
          {modal === 'alerts'   && renderAlertsModal()}
          {modal === 'students' && renderStudentsModal()}
          {modal === 'notify'   && renderNotifyModal()}

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.83rem' }}>Terminal monitoring &amp; emergency fleet control</p>
                {lastRefresh && (
                  <span style={{ fontSize: '0.7rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={fetchAll} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button onClick={() => setModal('notify')} style={{
                padding: '10px 20px', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff',
                border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              }}>
                <Bell size={16} /> RAISE NOTIFICATION
              </button>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '24px' }}>
            <StatCard
              icon={<BusFront size={22} color="#1D4ED8" />}
              label="Active Vehicles" color="#1D4ED8" bg="#DBEAFE"
              value={loading ? '…' : `${stats?.activeVehicles ?? 0}/${stats?.totalVehicles ?? 0}`}
              sub="Fleet online"
              onClick={() => window.location.href = '/vehicles'}
            />
            <StatCard
              icon={<UserCog size={22} color="#047857" />}
              label="Active Drivers" color="#047857" bg="#D1FAE5"
              value={loading ? '…' : stats?.activeDrivers ?? 0}
              sub="On duty now"
              onClick={() => window.location.href = '/drivers'}
            />
            <StatCard
              icon={<AlertTriangle size={22} color="#D97706" />}
              label="System Issues" color="#D97706" bg="#FEF3C7"
              value={loading ? '…' : stats?.systemIssues ?? 0}
              sub={`${stats?.driverIssues ?? 0} driver • ${stats?.adminIssues ?? 0} admin`}
              onClick={() => { setAlertTab('all'); setModal('issues'); }}
              pulse={stats?.systemIssues > 0}
            />
            <StatCard
              icon={<Bell size={22} color="#B91C1C" />}
              label="Alerts Raised" color="#B91C1C" bg="#FEE2E2"
              value={loading ? '…' : alertsToday}
              sub="Today — tap for split"
              onClick={() => { setAlertTab('all'); setModal('alerts'); }}
              pulse={alertsToday > 0}
            />
            <StatCard
              icon={<GraduationCap size={22} color="#7E22CE" />}
              label="Students Boarded" color="#7E22CE" bg="#F3E8FF"
              value={loading ? '…' : zoneBoarded.boarded}
              sub={`of ${zoneBoarded.total} assigned`}
              onClick={() => setModal('students')}
            />
          </div>

          {/* ── LIVE TRANSIT INDICATOR BAR ── */}
          {(liveTransit.inTransit > 0 || activeHalts.length > 0) && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {liveTransit.inTransit > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'linear-gradient(135deg,#0F172A,#1E3A5F)', borderRadius: '12px', color: '#fff' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulseDot 1.5s infinite', display: 'inline-block' }}/>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{liveTransit.inTransit} Students In-Transit</span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>· {liveTransit.dropped} dropped today</span>
                </div>
              )}
              {activeHalts.length > 0 && (
                <div style={{ flex: 1, padding: '10px 16px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ⏸ {activeHalts.length} Active Halt{activeHalts.length !== 1 ? 's' : ''}:
                  </span>
                  {activeHalts.slice(0, 4).map(h => (
                    <span key={h.haltId || h.id} style={{ padding: '3px 10px', background: '#FEF3C7', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>
                      🚌 {h.vehicleNumber || h.vehicleId} — {h.haltReason}
                      {h.studentCount > 0 && ` (${h.studentCount} students)`}
                    </span>
                  ))}
                  {activeHalts.length > 4 && <span style={{ fontSize: '0.75rem', color: '#D97706' }}>+{activeHalts.length - 4} more</span>}
                  <a href="/settings" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 700, textDecoration: 'none' }}>View Halt List →</a>
                </div>
              )}
            </div>
          )}

          {/* ── MAIN CONTENT GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* ── LEFT: Route Alerts Panel ── */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} /> Overall Route Alerts
                </h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['All', 'RouteChange', 'DelayedDeparture', 'Closure', 'Emergency'].map(tab => (
                    <button key={tab} onClick={() => setRouteTab(tab)} style={{
                      padding: '6px 13px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      background: routeTab === tab ? '#B91C1C' : '#F8FAFC', color: routeTab === tab ? '#fff' : '#64748B',
                      fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.15s',
                    }}>{tab === 'All' ? 'All' : tab.replace(/([A-Z])/g, ' $1').trim()}</button>
                  ))}
                </div>
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {loading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>Loading…</div>
                ) : todayRouteTabFiltered.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                    <CheckCircle size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No {routeTab === 'All' ? '' : routeTab} route alerts today.</p>
                  </div>
                ) : (
                  todayRouteTabFiltered.map((r) => {
                    const typeColor = r.notificationType === 'Closure' || r.notificationType === 'Emergency' ? '#EF4444' : r.notificationType === 'DelayedDeparture' ? '#F59E0B' : '#3B82F6';
                    return (
                      <div key={r.id} style={{ padding: '14px 16px', background: '#fff', borderRadius: '12px', borderLeft: `5px solid ${typeColor}`, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${typeColor}25`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: typeColor }}>{r.routeName}</div>
                          <span style={{ fontSize: '0.68rem', color: '#fff', background: typeColor, padding: '3px 9px', borderRadius: '12px', fontWeight: 800 }}>{r.notificationType}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{r.customMessage || '—'}</p>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={11} /> {r.effectiveDate} {r.effectiveTime}
                          &nbsp;|&nbsp; 👥 {r.totalStudents} students · {r.totalParents} parents
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT: Zone Attendance ── */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BusFront size={18} /> Zone Attendance Monitor
                </h3>
                <button onClick={() => setModal('students')} style={{ padding: '5px 10px', background: '#DBEAFE', color: '#1D4ED8', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
                  Details
                </button>
              </div>

              {/* Total boarded progress ring summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '4px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#7C3AED' }}>
                    {zoneBoarded.total > 0 ? Math.round((zoneBoarded.boarded / zoneBoarded.total) * 100) : 0}%
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{zoneBoarded.boarded} Boarded</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>of {zoneBoarded.total} assigned students today</div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>Loading attendance…</div>
                ) : zones.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem', fontSize: '0.83rem' }}>No zone data available</div>
                ) : (
                  zones.map((z, i) => (
                    <div key={z.zone}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px', fontWeight: 600 }}>
                        <span style={{ color: '#0F172A' }}>{z.zone}</span>
                        <span style={{ color: zoneColor(i), fontWeight: 800 }}>{z.percentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${z.percentage}%`, height: '100%', background: zoneColor(i), borderRadius: '4px', transition: 'width 0.6s ease-out' }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>{z.present}/{z.assigned} &nbsp;·&nbsp; {z.vehicles?.length || 0} vehicles</div>
                    </div>
                  ))
                )}
              </div>
              <p style={{ marginTop: '14px', fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                Aggregated attendance — <strong>State-wide</strong> fleet operations
              </p>
            </div>
          </div>

          {/* ── MAP ── */}
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #F1F5F9' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A' }}>
                <MapIcon size={20} color="#2563EB" /> Global Fleet Tracking
              </h2>
              <span style={{ color: '#10B981', background: '#dcfce7', padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 2s infinite' }} />
                Live Updates Active
              </span>
            </div>
            <div style={{ height: '460px', position: 'relative' }}>
              <style>{`
                .leaflet-container { width: 100%; height: 100%; z-index: 1; }
                @keyframes mapPing { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes scaleIn { from { opacity:0;transform:scale(0.95) } to { opacity:1;transform:scale(1) } }
                @keyframes pulseDot { 0%,100% { transform:scale(1);opacity:0.6 } 50% { transform:scale(1.8);opacity:0 } }
                @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
              `}</style>
              <MapContainer center={[13.0600, 80.2600]} zoom={12} scrollWheelZoom={true}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                {gpsData.map(v => {
                  const idle = (Date.now() - v.lastMove) > 5000;
                  const pinColor = idle ? '#EF4444' : '#10B981';
                  const icon = L.divIcon({
                    className: 'custom-vehicle-marker',
                    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-10px)"><div style="background:#1F2937;color:#fff;padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:800;margin-bottom:6px;box-shadow:0 2px 4px rgba(0,0,0,0.2);white-space:nowrap;font-family:sans-serif">${v.id}</div><div style="width:20px;height:20px;background:${pinColor};border-radius:50%;border:3px solid #fff;animation:${idle ? 'none' : 'mapPing 1.5s infinite'};box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div></div>`,
                    iconSize: [60, 60], iconAnchor: [30, 30],
                  });
                  return (
                    <Marker key={v.id} position={[v.lat, v.lng]} icon={icon}>
                      <Popup><strong>Vehicle: {v.id}</strong><br />Type: {v.type.toUpperCase()}<br />Status: <strong style={{ color: pinColor }}>{idle ? 'IDLE' : 'MOVING'}</strong></Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Map overlay filter */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(255,255,255,0.96)', padding: '16px', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.18)', width: '240px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', zIndex: 1000 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#2563EB', fontWeight: 900 }}>🗂 Live Fleet Filter</h3>
                {['Zone','Route','Vehicle'].map(lbl => (
                  <div key={lbl} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, marginBottom: '4px', color: '#64748B' }}>{lbl}</label>
                    <select style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F9FAFB', fontSize: '0.82rem', fontWeight: 500 }}>
                      <option>All {lbl}s</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

export default Dashboard;
