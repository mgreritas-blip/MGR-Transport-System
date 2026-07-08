import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon, MapPin, Pause, Play, Download, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Filter, Search, X, ChevronDown,
  BusFront, UserCog, Save, Wifi, Database, Bell
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar  from '../components/Topbar';

const API = 'http://localhost:3000';

/* ── Helpers ── */
const fmtDuration = (sec) => {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const getTodayISO = () => new Date().toISOString().slice(0, 10);

/* ── Status Badge ── */
const HaltBadge = ({ status }) => {
  const isActive = status === 'active';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800,
      background: isActive ? '#FEF3C7' : '#D1FAE5',
      color:      isActive ? '#D97706' : '#059669',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      {isActive ? <Pause size={11}/> : <Play size={11}/>}
      {isActive ? 'HALTED' : 'RESUMED'}
    </span>
  );
};

/* ── Reason label map ── */
const REASON_MAP = {
  traffic:             '🚦 Traffic',
  breakdown:           '🔧 Breakdown',
  scheduled_stop:      '🛑 Scheduled Stop',
  passenger_boarding:  '🧍 Passenger Boarding',
  other:               '❓ Other',
};

/* ══════════════════════════════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════════════════════════════ */
const SettingsPage = () => {
  /* ── GPS config state ── */
  const [gpsConfig, setGpsConfig] = useState({
    alertRadius: 50,
    logInterval: 10,
    mapsApiKey: '',
    systemEmail: 'admin@ctms.edu',
  });
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  /* ── Halt list state ── */
  const [halts, setHalts]           = useState([]);
  const [haltSummary, setHaltSummary] = useState({ active: 0, total: 0, avgDurationSec: 0 });
  const [haltLoading, setHaltLoading] = useState(true);

  /* ── Filters ── */
  const [filterStatus,    setFilterStatus]    = useState('all');   // all | active | resumed
  const [filterVehicle,   setFilterVehicle]   = useState('');
  const [filterDate,      setFilterDate]      = useState(getTodayISO());
  const [searchVehicle,   setSearchVehicle]   = useState('');

  /* ── Active tab ── */
  const [tab, setTab] = useState('halts'); // halts | gps | system

  /* ── Fetch halts ── */
  const fetchHalts = useCallback(async () => {
    setHaltLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterVehicle)          params.set('vehicleId', filterVehicle);
      if (filterDate)             params.set('date', filterDate);
      params.set('limit', '200');

      const [haltsRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/halts?${params}`).then(r => r.json()),
        fetch(`${API}/api/halts/summary`).then(r => r.json()),
      ]);
      setHalts(Array.isArray(haltsRes) ? haltsRes : []);
      setHaltSummary(summaryRes);
    } catch (e) {
      console.error('Halts fetch error', e);
    } finally {
      setHaltLoading(false);
    }
  }, [filterStatus, filterVehicle, filterDate]);

  useEffect(() => { fetchHalts(); }, [fetchHalts]);

  /* ── Auto-refresh halts every 15s for live active halts ── */
  useEffect(() => {
    const iv = setInterval(fetchHalts, 15000);
    return () => clearInterval(iv);
  }, [fetchHalts]);

  /* ── Derived: client-side vehicle search ── */
  const filteredHalts = halts.filter(h =>
    !searchVehicle || (h.vehicleNumber || '').toLowerCase().includes(searchVehicle.toLowerCase())
  );

  /* ── CSV Export ── */
  const exportCSV = () => {
    const headers = ['ID','Vehicle','Driver','Reason','Custom Reason','Start','End','Duration','Students on Board','Status'];
    const rows = filteredHalts.map(h => [
      h.id, h.vehicleNumber || h.vehicleId, h.driverName || '—',
      REASON_MAP[h.haltReason] || h.haltReason, h.customReason || '',
      fmtTime(h.startedAt), fmtTime(h.endedAt),
      fmtDuration(h.durationSec), h.studentCount, h.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `halt-log-${filterDate || 'all'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Save GPS config ── */
  const saveConfig = async () => {
    setSaveStatus('saving');
    // Store to localStorage as a simple config store (can be backed by API later)
    try {
      localStorage.setItem('ctms_gps_config', JSON.stringify(gpsConfig));
      await new Promise(r => setTimeout(r, 600)); // simulated async
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  /* ── Load config from localStorage on mount ── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ctms_gps_config') || '{}');
      if (saved.alertRadius) setGpsConfig(prev => ({ ...prev, ...saved }));
    } catch {}
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content" style={{ padding: '24px 28px', background: '#F8FAFC', minHeight: '100vh' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SettingsIcon size={26} color="#475569" /> System Settings
              </h1>
              <p style={{ margin: '5px 0 0', color: '#94A3B8', fontSize: '0.83rem' }}>
                GPS configuration, halt management, and system preferences
              </p>
            </div>
          </div>

          {/* ── Tab Nav ── */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', borderBottom: '2px solid #E2E8F0', paddingBottom: '0' }}>
            {[
              { key: 'halts',  label: '🛑 Halt List',       badge: haltSummary.active > 0 ? haltSummary.active : null },
              { key: 'gps',    label: '📡 GPS Config',       badge: null },
              { key: 'system', label: '⚙️ System',           badge: null },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '0.85rem',
                color: tab === t.key ? '#1D4ED8' : '#64748B',
                borderBottom: `3px solid ${tab === t.key ? '#1D4ED8' : 'transparent'}`,
                marginBottom: '-2px', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {t.label}
                {t.badge !== null && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '0.68rem', fontWeight: 900 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════
              TAB: HALT LIST
          ════════════════════════════════════════════ */}
          {tab === 'halts' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '22px' }}>
                {[
                  { label: 'Active Halts', value: haltSummary.active, color: '#D97706', bg: '#FEF3C7', icon: <Pause size={20} color="#D97706"/> },
                  { label: 'Total Halts (All time)', value: haltSummary.total, color: '#1D4ED8', bg: '#DBEAFE', icon: <Database size={20} color="#1D4ED8"/> },
                  { label: 'Avg Halt Duration', value: fmtDuration(haltSummary.avgDurationSec), color: '#7C3AED', bg: '#F5F3FF', icon: <Clock size={20} color="#7C3AED"/> },
                ].map(c => (
                  <div key={c.label} style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', border: `1.5px solid ${c.color}20`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '11px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>{c.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter Bar */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={16} color="#94A3B8" />
                {/* Status filter */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all','active','resumed'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{
                      padding: '6px 13px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      background: filterStatus === s ? '#1D4ED8' : '#F1F5F9',
                      color: filterStatus === s ? '#fff' : '#64748B',
                      fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.15s',
                    }}>
                      {s === 'all' ? 'All' : s === 'active' ? '🟡 Active' : '🟢 Resumed'}
                    </button>
                  ))}
                </div>
                {/* Date filter */}
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.82rem', background: '#F9FAFB' }}
                />
                {/* Vehicle search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={searchVehicle} onChange={e => setSearchVehicle(e.target.value)}
                    placeholder="Search vehicle number…"
                    style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '0.82rem', background: '#F9FAFB', boxSizing: 'border-box' }}
                  />
                  {searchVehicle && <button onClick={() => setSearchVehicle('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={13} color="#94A3B8"/></button>}
                </div>
                {/* Actions */}
                <button onClick={fetchHalts} style={{ padding: '7px 14px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem', color: '#475569' }}>
                  <RefreshCw size={13}/> Refresh
                </button>
                <button onClick={exportCSV} style={{ padding: '7px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem' }}>
                  <Download size={13}/> Export CSV
                </button>
              </div>

              {/* Halt Table */}
              <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 1fr 1fr 1.2fr', gap: '0', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', padding: '12px 16px' }}>
                  {['Vehicle', 'Driver', 'Reason', 'Started', 'Duration', 'Students', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>

                {/* Table body */}
                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  {haltLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading halt records…</div>
                  ) : filteredHalts.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                      <CheckCircle size={32} color="#CBD5E1" style={{ marginBottom: '10px' }} />
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No halt records found for the selected filters.</p>
                    </div>
                  ) : filteredHalts.map((h, i) => {
                    const isActive = h.status === 'active';
                    return (
                      <div key={h.id} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 1fr 1fr 1.2fr',
                        gap: '0', padding: '13px 16px', borderBottom: '1px solid #F8FAFC',
                        background: isActive ? '#FFFBEB' : (i % 2 === 0 ? '#fff' : '#FAFBFC'),
                        transition: 'background 0.12s',
                        alignItems: 'center',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isActive ? '#FFFBEB' : (i % 2 === 0 ? '#fff' : '#FAFBFC'); }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <BusFront size={13} color="#1D4ED8" /> {h.vehicleNumber || h.vehicleId}
                          </div>
                          {h.latitude && (
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} /> {h.latitude.toFixed(4)}, {h.longitude?.toFixed(4)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                          {h.driverName || <span style={{ color: '#CBD5E1' }}>—</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 600 }}>{REASON_MAP[h.haltReason] || h.haltReason}</div>
                          {h.customReason && <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{h.customReason}</div>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{fmtTime(h.startedAt)}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? '#D97706' : '#059669' }}>
                          {isActive ? <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={12}/> Active</span> : fmtDuration(h.durationSec)}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: h.studentCount > 0 ? '#7C3AED' : '#94A3B8' }}>
                          {h.studentCount > 0 ? `${h.studentCount} 🧑‍🎓` : '—'}
                        </div>
                        <HaltBadge status={h.status} />
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
                  <span>{filteredHalts.length} record{filteredHalts.length !== 1 ? 's' : ''} shown</span>
                  <span>Auto-refreshes every 15s</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              TAB: GPS CONFIG
          ════════════════════════════════════════════ */}
          {tab === 'gps' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#1D4ED8"/> GPS Tracking Configuration
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Alert Radius */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>
                      GPS MISMATCH ALERT RADIUS (meters)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="number" value={gpsConfig.alertRadius}
                        onChange={e => setGpsConfig(p => ({ ...p, alertRadius: parseInt(e.target.value) || 50 }))}
                        style={{ width: 120, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.92rem', fontWeight: 700 }}
                      />
                      <input type="range" min={10} max={500} step={10} value={gpsConfig.alertRadius}
                        onChange={e => setGpsConfig(p => ({ ...p, alertRadius: parseInt(e.target.value) }))}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '0.73rem', color: '#94A3B8' }}>
                      Alert if student scans QR but is beyond this radius from the vehicle's GPS position.
                    </p>
                  </div>

                  {/* Log Interval */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>
                      GPS DB LOG INTERVAL (seconds)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="number" value={gpsConfig.logInterval}
                        onChange={e => setGpsConfig(p => ({ ...p, logInterval: parseInt(e.target.value) || 10 }))}
                        style={{ width: 120, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.92rem', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>seconds between DB writes per vehicle</span>
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '0.73rem', color: '#94A3B8' }}>
                      Lower = more GPS history granularity, higher = less DB load. Recommended: 10–30s.
                    </p>
                  </div>

                  {/* Maps API Key */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>
                      GOOGLE MAPS API KEY (optional)
                    </label>
                    <input type="password" value={gpsConfig.mapsApiKey}
                      onChange={e => setGpsConfig(p => ({ ...p, mapsApiKey: e.target.value }))}
                      placeholder="AIzaSyA..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                    <p style={{ margin: '5px 0 0', fontSize: '0.73rem', color: '#94A3B8' }}>
                      Used for satellite view and geocoding. Leave blank to use OpenStreetMap (default).
                    </p>
                  </div>
                </div>

                <button onClick={saveConfig} disabled={saveStatus === 'saving'} style={{
                  marginTop: '22px', padding: '12px 24px',
                  background: saveStatus === 'saved' ? '#059669' : saveStatus === 'error' ? '#DC2626' : 'linear-gradient(135deg,#1D4ED8,#1E40AF)',
                  color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800,
                  cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(29,78,216,0.3)', transition: 'all 0.2s',
                }}>
                  {saveStatus === 'saving' ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }}/> : saveStatus === 'saved' ? <CheckCircle size={16}/> : <Save size={16}/>}
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error — Retry' : 'Save GPS Config'}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              TAB: SYSTEM
          ════════════════════════════════════════════ */}
          {tab === 'system' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SettingsIcon size={18} color="#475569"/> System Preferences
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, marginBottom: '6px', color: '#475569' }}>SYSTEM EMAIL</label>
                    <input type="email" value={gpsConfig.systemEmail}
                      onChange={e => setGpsConfig(p => ({ ...p, systemEmail: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Info cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    {[
                      { icon: <Wifi size={18} color="#059669"/>, label: 'Socket.IO', value: 'Connected', bg: '#D1FAE5', color: '#059669' },
                      { icon: <Database size={18} color="#1D4ED8"/>, label: 'Database', value: 'SQLite (dev)', bg: '#DBEAFE', color: '#1D4ED8' },
                      { icon: <Bell size={18} color="#D97706"/>, label: 'Notifications', value: 'Real-time', bg: '#FEF3C7', color: '#D97706' },
                      { icon: <MapPin size={18} color="#7C3AED"/>, label: 'GPS Engine', value: 'In-Memory + DB', bg: '#F5F3FF', color: '#7C3AED' },
                    ].map(c => (
                      <div key={c.label} style={{ padding: '14px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {c.icon}
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>{c.label}</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveConfig} style={{
                  marginTop: '22px', padding: '12px 24px',
                  background: 'linear-gradient(135deg,#475569,#334155)',
                  color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(71,85,105,0.25)',
                }}>
                  <Save size={16}/> Save System Config
                </button>
              </div>
            </div>
          )}

          {/* Keyframes */}
          <style>{`
            @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
          `}</style>

        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
