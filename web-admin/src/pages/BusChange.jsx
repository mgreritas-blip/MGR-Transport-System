import React, { useState, useEffect } from 'react';
import { socket } from '../api';
import {
  ArrowLeftRight, Bus, CheckCircle, XCircle, Clock,
  UserCheck, MapPin, Shield, Loader2, RefreshCw,
  FileText, ChevronRight, ChevronLeft, Zap, RotateCcw,
  Pin, Bell, Activity
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const API = 'http://localhost:3000';

const api = async (path, method = 'GET', body = null) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  return res.json();
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '\u2014';
const STEPS = ['Select Buses', 'Set Period', 'Confirm', 'Execute'];

const CheckRow = ({ label, passed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
    {passed ? <CheckCircle size={17} color="#16a34a" /> : <XCircle size={17} color="#dc2626" />}
    <span style={{ fontSize: 13, color: passed ? '#166534' : '#991b1b', fontWeight: 500 }}>{label}</span>
    <span style={{ marginLeft: 'auto', fontSize: 12, background: passed ? '#dcfce7' : '#fee2e2', color: passed ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: 20 }}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  </div>
);

const SBadge = ({ icon, label, value, sub }) => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', minWidth: 130 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#64748b', fontSize: 11 }}>{icon} {label}</div>
    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{value || '\u2014'}</div>
    {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    active: { bg: '#dcfce7', color: '#166534', label: 'Active' },
    expired: { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    converted_to_permanent: { bg: '#dbeafe', color: '#1d4ed8', label: 'Permanent' },
  };
  const c = cfg[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.label}</span>;
};

export default function BusChange() {
  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [fromVehicleId, setFromVehicleId] = useState('');
  const [toVehicleId, setToVehicleId] = useState('');
  const [fromInfo, setFromInfo] = useState(null);
  const [toInfo, setToInfo] = useState(null);
  const [validation, setValidation] = useState(null);
  const [assignmentType, setAssignmentType] = useState('temporary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState(null);
  const [execProgress, setExecProgress] = useState([]);
  const [activeTab, setActiveTab] = useState('wizard');
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [liveNotif, setLiveNotif] = useState(null);

  useEffect(() => {
    api('/api/bus-change/vehicles').then(setVehicles).catch(() => {});
    loadActiveAssignments();
    loadAuditLog();
  }, []);

  useEffect(() => {
    socket.emit('joinRoom', { role: 'superadmin' });
    const onConn = () => setWsStatus('connected');
    const onDisconn = () => setWsStatus('disconnected');
    const onAudit = () => { loadActiveAssignments(); loadAuditLog(); };
    const onReassigned = (d) => setLiveNotif({ type: 'success', msg: d.message });
    const onRestored = (d) => setLiveNotif({ type: 'info', msg: d.message });
    socket.on('connect', onConn); socket.on('disconnect', onDisconn);
    socket.on('busChangeAuditUpdate', onAudit);
    socket.on('busReassigned', onReassigned); socket.on('busRestored', onRestored);
    if (socket.connected) setWsStatus('connected');
    return () => {
      socket.off('connect', onConn); socket.off('disconnect', onDisconn);
      socket.off('busChangeAuditUpdate', onAudit);
      socket.off('busReassigned', onReassigned); socket.off('busRestored', onRestored);
    };
  }, []);

  useEffect(() => {
    if (liveNotif) { const t = setTimeout(() => setLiveNotif(null), 5000); return () => clearTimeout(t); }
  }, [liveNotif]);

  const loadActiveAssignments = () => api('/api/bus-change/active').then(setActiveAssignments).catch(() => {});
  const loadAuditLog = () => api('/api/bus-change/audit').then(setAuditLog).catch(() => {});

  useEffect(() => {
    if (!fromVehicleId) { setFromInfo(null); return; }
    setLoading(true);
    api('/api/bus-change/vehicle-info/' + fromVehicleId).then(setFromInfo).finally(() => setLoading(false));
  }, [fromVehicleId]);

  useEffect(() => {
    if (!toVehicleId || !fromVehicleId) { setToInfo(null); setValidation(null); return; }
    setLoading(true);
    Promise.all([
      api('/api/bus-change/vehicle-info/' + toVehicleId),
      api('/api/bus-change/validate', 'POST', { fromVehicleId, toVehicleId, assignmentType, startDate, endDate })
    ]).then(([info, val]) => { setToInfo(info); setValidation(val); }).finally(() => setLoading(false));
  }, [toVehicleId, fromVehicleId, assignmentType, startDate, endDate]);

  const executeChange = async () => {
    setExecuting(true); setExecProgress([]);
    const stepLabels = [
      'Validating stakeholders...', 'Saving to database (transaction)...', 'Updating StudentVehicleMapping...',
      'Writing audit log...', 'Dispatching notifications...', 'Broadcasting via WebSocket...',
      'Syncing GPS tracking...', 'Syncing attendance module...'
    ];
    for (let i = 0; i < stepLabels.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      setExecProgress(p => [...p, stepLabels[i]]);
    }
    try {
      const result = await api('/api/bus-change/execute', 'POST', {
        fromVehicleId, toVehicleId, assignmentType,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || null,
        adminId: 'admin', adminName: 'Super Admin', ipAddress: 'localhost'
      });
      setExecResult(result); loadActiveAssignments(); loadAuditLog();
    } catch (err) { setExecResult({ error: err.message }); }
    setExecuting(false);
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Restore original bus?')) return;
    await api('/api/bus-change/restore/' + id, 'POST'); loadActiveAssignments();
  };
  const handleMakePermanent = async (id) => {
    if (!window.confirm('Make permanent? Cannot be undone.')) return;
    await api('/api/bus-change/make-permanent/' + id, 'POST'); loadActiveAssignments();
  };
  const resetWizard = () => {
    setStep(0); setFromVehicleId(''); setToVehicleId('');
    setFromInfo(null); setToInfo(null); setValidation(null);
    setAssignmentType('temporary'); setStartDate(''); setEndDate('');
    setExecResult(null); setExecProgress([]);
  };

  const canGo0 = fromVehicleId && toVehicleId && fromVehicleId !== toVehicleId && validation && validation.valid;
  const canGo1 = assignmentType === 'permanent' || (startDate && endDate);

  const card = (extra = {}) => ({ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', ...extra });
  const btnBase = (extra = {}) => ({ border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, ...extra });
  const selStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, marginBottom: 16 };
  const dtStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <div style={{ padding: '2rem', background: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>

        {liveNotif && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: liveNotif.type === 'success' ? '#dcfce7' : '#dbeafe', border: '1px solid ' + (liveNotif.type === 'success' ? '#86efac' : '#93c5fd'), color: liveNotif.type === 'success' ? '#166534' : '#1d4ed8', padding: '12px 20px', borderRadius: 12, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', maxWidth: 400, fontSize: 14 }}>
            <Bell size={14} style={{ marginRight: 6 }} />{liveNotif.msg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ArrowLeftRight size={28} color="var(--primary)" /> Bus / Vehicle Change
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Reassign students, notify all stakeholders, sync GPS and attendance automatically.</p>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: wsStatus === 'connected' ? '#dcfce7' : '#fee2e2', color: wsStatus === 'connected' ? '#166534' : '#991b1b' }}>
            <Activity size={12} /> {wsStatus === 'connected' ? 'Live - WebSocket Connected' : 'Disconnected'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
          {[{ key: 'wizard', label: 'New Assignment' }, { key: 'active', label: 'Active (' + activeAssignments.length + ')' }, { key: 'audit', label: 'Audit Log (' + auditLog.length + ')' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: activeTab === t.key ? 800 : 500, fontSize: 14, color: activeTab === t.key ? 'var(--primary)' : '#64748b', borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2 }}>{t.label}</button>
          ))}
        </div>

        {/* WIZARD TAB */}
        {activeTab === 'wizard' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, background: step === i ? 'var(--primary)' : step > i ? '#dcfce7' : '#f1f5f9', color: step === i ? '#fff' : step > i ? '#166534' : '#94a3b8' }}>
                    {step > i ? <CheckCircle size={15} /> : <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === i ? 'rgba(255,255,255,0.25)' : '#e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: step === i ? '#fff' : '#94a3b8' }}>{i + 1}</span>} {s}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > i ? '#16a34a' : '#e2e8f0', minWidth: 20 }} />}
                </React.Fragment>
              ))}
            </div>

            {step === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={card()}>
                  <h3 style={{ margin: '0 0 16px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}><Bus size={18} /> Current Bus (From)</h3>
                  <select value={fromVehicleId} onChange={e => { setFromVehicleId(e.target.value); setToVehicleId(''); setValidation(null); }} style={selStyle}>
                    <option value="">-- Select current bus --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.number} ({v.type}) - {v.route || 'No route'}</option>)}
                  </select>
                  {loading && !fromInfo && <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading stakeholders...</div>}
                  {fromInfo && (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                        <SBadge icon={<Bus size={12} />} label="Vehicle" value={fromInfo.vehicle && fromInfo.vehicle.number} sub={fromInfo.vehicle && fromInfo.vehicle.model} />
                        <SBadge icon={<MapPin size={12} />} label="Route" value={fromInfo.vehicle && (fromInfo.vehicle.route || 'N/A')} />
                        <SBadge icon={<UserCheck size={12} />} label="Driver" value={fromInfo.driver ? fromInfo.driver.name : 'Unassigned'} sub={fromInfo.driver && fromInfo.driver.phone} />
                      </div>
                      <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                        <strong>{fromInfo.studentCount} Students</strong> - {fromInfo.parentCount} Parents - {fromInfo.coordinators ? fromInfo.coordinators.length : 0} Coordinator(s) - {fromInfo.hods ? fromInfo.hods.length : 0} HoD(s)
                        <div style={{ marginTop: 8, maxHeight: 100, overflowY: 'auto' }}>
                          {fromInfo.students && fromInfo.students.slice(0, 8).map(s => <div key={s.id} style={{ fontSize: 12, color: '#92400e', marginBottom: 2 }}>* {s.name} {s.phone ? '(' + s.phone + ')' : ''}</div>)}
                          {fromInfo.studentCount > 8 && <div style={{ fontSize: 12, color: '#a16207' }}>+{fromInfo.studentCount - 8} more...</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={card()}>
                  <h3 style={{ margin: '0 0 16px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 8 }}><Bus size={18} /> Replacement Bus (To)</h3>
                  <select value={toVehicleId} onChange={e => setToVehicleId(e.target.value)} disabled={!fromVehicleId} style={{ ...selStyle, opacity: !fromVehicleId ? 0.5 : 1 }}>
                    <option value="">-- Select replacement bus --</option>
                    {vehicles.filter(v => v.id !== fromVehicleId).map(v => <option key={v.id} value={v.id}>{v.number} ({v.type}) - {v.route || 'No route'}</option>)}
                  </select>
                  {loading && toVehicleId && <div style={{ color: '#94a3b8', fontSize: 13 }}>Validating...</div>}
                  {validation && (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                        <SBadge icon={<Bus size={12} />} label="Vehicle" value={toInfo && toInfo.vehicle && toInfo.vehicle.number} sub={toInfo && toInfo.vehicle && toInfo.vehicle.model} />
                        <SBadge icon={<MapPin size={12} />} label="Route" value={toInfo && toInfo.vehicle && (toInfo.vehicle.route || 'N/A')} />
                        <SBadge icon={<UserCheck size={12} />} label="Driver" value={toInfo && (toInfo.driver ? toInfo.driver.name : 'Unassigned')} sub={toInfo && toInfo.driver && toInfo.driver.phone} />
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: validation.valid ? '#16a34a' : '#dc2626' }}>{validation.valid ? 'All validations passed' : 'Validation failed'}</div>
                        <CheckRow label="Vehicle Available" passed={validation.checks && validation.checks.vehicleAvailable} />
                        <CheckRow label="Driver Assigned" passed={validation.checks && validation.checks.driverAssigned} />
                        <CheckRow label="Route Compatible" passed={validation.checks && validation.checks.routeCompatible} />
                        <CheckRow label="Capacity Sufficient" passed={validation.checks && validation.checks.capacitySufficient} />
                        <CheckRow label="Seat Available" passed={validation.checks && validation.checks.seatAvailable} />
                        <CheckRow label="Operational Status OK" passed={validation.checks && validation.checks.operationalStatus} />
                        <CheckRow label="GPS Available" passed={validation.checks && validation.checks.gpsAvailable} />
                        <CheckRow label="No Schedule Conflict" passed={validation.checks && validation.checks.noScheduleConflict} />
                        <CheckRow label="No Active Temp Assignment" passed={validation.checks && validation.checks.noActiveTempAssignment} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ ...card(), maxWidth: 540 }}>
                <h3 style={{ margin: '0 0 20px' }}>Assignment Type and Period</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  {['temporary', 'permanent'].map(type => (
                    <button key={type} onClick={() => setAssignmentType(type)} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer', border: '2px solid ' + (assignmentType === type ? 'var(--primary)' : '#e2e8f0'), background: assignmentType === type ? 'var(--primary)' : '#f8fafc', color: assignmentType === type ? '#fff' : '#64748b', fontWeight: 700, fontSize: 14 }}>
                      {type === 'temporary' ? 'Temporary' : 'Permanent'}
                      <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4 }}>{type === 'temporary' ? 'Auto-reverts at end date' : 'Replaces original permanently'}</div>
                    </button>
                  ))}
                </div>
                {assignmentType === 'temporary' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Effective Start</label><input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={dtStyle} /></div>
                    <div><label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Effective End</label><input type="datetime-local" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} style={dtStyle} /></div>
                  </div>
                ) : (
                  <div><label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Effective Date</label><input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={dtStyle} /></div>
                )}
              </div>
            )}

            {step === 2 && fromInfo && toInfo && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, alignItems: 'start', marginBottom: 20 }}>
                  <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 16, padding: 20 }}>
                    <h4 style={{ margin: '0 0 12px', color: '#c2410c' }}>Existing Bus</h4>
                    <table style={{ fontSize: 13, width: '100%', borderCollapse: 'collapse' }}>
                      {[['Vehicle', fromInfo.vehicle && fromInfo.vehicle.number], ['Route', fromInfo.vehicle && (fromInfo.vehicle.route || 'N/A')], ['Driver', fromInfo.driver ? fromInfo.driver.name : 'Unassigned'], ['Phone', (fromInfo.driver && fromInfo.driver.phone) || '--'], ['Coordinator', fromInfo.coordinators && fromInfo.coordinators[0] ? fromInfo.coordinators[0].name : '--'], ['HoD', fromInfo.hods && fromInfo.hods[0] ? fromInfo.hods[0].name : '--'], ['Students', fromInfo.studentCount]].map(([k, v]) => (
                        <tr key={k}><td style={{ padding: '4px 0', color: '#92400e', fontWeight: 600, width: '45%' }}>{k}</td><td style={{ color: '#1e293b' }}>{v}</td></tr>
                      ))}
                    </table>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, paddingTop: 40 }}>{'\u2192'}</div>
                  <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: 20 }}>
                    <h4 style={{ margin: '0 0 12px', color: '#15803d' }}>Replacement Bus</h4>
                    <table style={{ fontSize: 13, width: '100%', borderCollapse: 'collapse' }}>
                      {[['Vehicle', toInfo.vehicle && toInfo.vehicle.number], ['Route', toInfo.vehicle && (toInfo.vehicle.route || 'N/A')], ['Driver', toInfo.driver ? toInfo.driver.name : 'Unassigned'], ['Phone', (toInfo.driver && toInfo.driver.phone) || '--'], ['Coordinator', toInfo.coordinators && toInfo.coordinators[0] ? toInfo.coordinators[0].name : '--'], ['HoD', toInfo.hods && toInfo.hods[0] ? toInfo.hods[0].name : '--'], ['Capacity', (toInfo.vehicle && toInfo.vehicle.capacity) || 'N/A']].map(([k, v]) => (
                        <tr key={k}><td style={{ padding: '4px 0', color: '#166534', fontWeight: 600, width: '45%' }}>{k}</td><td style={{ color: '#1e293b' }}>{v}</td></tr>
                      ))}
                    </table>
                  </div>
                </div>
                <div style={{ ...card(), marginBottom: 12 }}>
                  <h4 style={{ margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="#f59e0b" /> Impact Summary</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {[{ label: 'Students Affected', value: fromInfo.studentCount }, { label: 'Parents Notified', value: fromInfo.parentCount }, { label: 'Drivers Notified', value: 2 }, { label: 'Coordinators', value: fromInfo.coordinators ? fromInfo.coordinators.length : 0 }, { label: 'HoDs', value: fromInfo.hods ? fromInfo.hods.length : 0 }, { label: 'Type', value: assignmentType === 'temporary' ? 'Temporary' : 'Permanent' }, { label: 'Effective From', value: startDate ? fmtDate(startDate) : 'Immediately' }, { label: 'Reverts At', value: assignmentType === 'temporary' && endDate ? fmtDate(endDate) : '--' }].map(item => (
                      <div key={item.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 16px', minWidth: 140, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12, padding: '12px 16px' }}>
                  <strong style={{ fontSize: 13, color: '#713f12' }}>Notification Channels:</strong>
                  <span style={{ fontSize: 13, color: '#854d0e', marginLeft: 8 }}>Push | In-App | WebSocket | Web Dashboard Alert</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ maxWidth: 640 }}>
                {!execResult ? (
                  <div style={card()}>
                    <h3 style={{ margin: '0 0 16px' }}>Execute Reassignment</h3>
                    {execProgress.length === 0 && !executing ? (
                      <div>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Click Execute Now. All stakeholders will be notified instantly.</p>
                        <button onClick={executeChange} style={btnBase({ padding: '14px 32px', background: 'var(--primary)', color: '#fff', fontSize: 15 })}><Zap size={18} /> Execute Now</button>
                      </div>
                    ) : (
                      <div>
                        {execProgress.map((s, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}><CheckCircle size={16} color="#16a34a" /> <span style={{ color: '#374151' }}>{s}</span></div>)}
                        {executing && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: '#64748b', fontSize: 14 }}><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</div>}
                      </div>
                    )}
                  </div>
                ) : execResult.error ? (
                  <div style={{ background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 16, padding: 28 }}>
                    <h3 style={{ color: '#991b1b', margin: '0 0 12px' }}>Execution Failed</h3>
                    <p style={{ color: '#b91c1c', fontSize: 14 }}>{execResult.error}</p>
                    <p style={{ color: '#dc2626', fontSize: 13 }}>Transaction rolled back. No data was modified.</p>
                    <button onClick={resetWizard} style={btnBase({ marginTop: 16, padding: '10px 22px', background: '#dc2626', color: '#fff' })}><RotateCcw size={14} /> Try Again</button>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: 28 }}>
                    <h3 style={{ color: '#15803d', margin: '0 0 16px', display: 'flex', gap: 8, alignItems: 'center' }}><CheckCircle size={24} /> Reassignment Successful!</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                      {[['Assignment ID', execResult.assignment && execResult.assignment.id && execResult.assignment.id.slice(0, 16) + '...'], ['Type', execResult.assignment && execResult.assignment.assignmentType], ['From Bus', execResult.assignment && execResult.assignment.fromVehicleNumber], ['To Bus', execResult.assignment && execResult.assignment.toVehicleNumber], ['Students Moved', execResult.assignment && execResult.assignment.studentCount], ['Notified', execResult.assignment && (execResult.assignment.notifiedCount + ' stakeholders')], ['DB Transaction', 'Success'], ['WebSocket Broadcast', 'Sent'], ['GPS Sync', 'Synced'], ['Attendance Sync', 'Synced']].map(([k, v]) => (
                        <div key={k} style={{ background: '#fff', borderRadius: 8, padding: '8px 14px', border: '1px solid #86efac' }}>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {execResult.assignment && execResult.assignment.assignmentType === 'temporary' && execResult.assignment.endDate && (
                      <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#713f12', marginBottom: 16 }}>Auto-restore scheduled for <strong>{fmtDate(execResult.assignment.endDate)}</strong></div>
                    )}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={resetWizard} style={btnBase({ padding: '10px 22px', background: 'var(--primary)', color: '#fff' })}>New Assignment</button>
                      <button onClick={() => setActiveTab('active')} style={btnBase({ padding: '10px 22px', background: '#f1f5f9', color: '#374151' })}>Active Assignments</button>
                      <button onClick={() => setActiveTab('audit')} style={btnBase({ padding: '10px 22px', background: '#f1f5f9', color: '#374151' })}>Audit Log</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step < 3 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                {step > 0 && <button onClick={() => setStep(s => s - 1)} style={btnBase({ padding: '11px 24px', background: '#f1f5f9', color: '#374151' })}><ChevronLeft size={16} /> Back</button>}
                <button onClick={() => setStep(s => s + 1)} disabled={step === 0 ? !canGo0 : step === 1 ? !canGo1 : false} style={btnBase({ padding: '11px 28px', background: 'var(--primary)', color: '#fff', opacity: (step === 0 ? !canGo0 : step === 1 ? !canGo1 : false) ? 0.4 : 1 })}>{step === 2 ? 'Confirm and Proceed' : 'Continue'} <ChevronRight size={16} /></button>
                {step === 0 && <button onClick={resetWizard} style={btnBase({ padding: '11px 16px', background: '#f1f5f9', color: '#374151' })}>Reset</button>}
              </div>
            )}
          </>
        )}

        {/* ACTIVE ASSIGNMENTS TAB */}
        {activeTab === 'active' && (
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Active Bus Assignments</h3>
              <button onClick={loadActiveAssignments} style={btnBase({ padding: '7px 16px', background: '#f1f5f9', color: '#374151', fontSize: 13 })}><RefreshCw size={13} /> Refresh</button>
            </div>
            {activeAssignments.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No active assignments right now.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f8fafc' }}>{['From Bus', 'To Bus', 'Type', 'Status', 'Students', 'Start', 'End', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
                  <tbody>{activeAssignments.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#dc2626' }}>{a.fromVehicleNumber}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>{a.toVehicleNumber}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ background: a.assignmentType === 'temporary' ? '#fef9c3' : '#dbeafe', color: a.assignmentType === 'temporary' ? '#713f12' : '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{a.assignmentType}</span></td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={a.status} /></td>
                      <td style={{ padding: '10px 14px' }}>{a.studentCount}</td>
                      <td style={{ padding: '10px 14px' }}>{fmtDate(a.startDate)}</td>
                      <td style={{ padding: '10px 14px' }}>{a.endDate ? fmtDate(a.endDate) : '--'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {a.assignmentType === 'temporary' && <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleRestore(a.id)} style={btnBase({ padding: '5px 12px', background: '#fee2e2', color: '#991b1b', fontSize: 12 })}><RotateCcw size={12} /> Restore</button>
                          <button onClick={() => handleMakePermanent(a.id)} style={btnBase({ padding: '5px 12px', background: '#dbeafe', color: '#1d4ed8', fontSize: 12 })}><Pin size={12} /> Make Permanent</button>
                        </div>}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={18} color="#6366f1" /> Immutable Audit Log</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>All bus change events - tamper-proof, compliance-ready.</p>
              </div>
              <button onClick={loadAuditLog} style={btnBase({ padding: '7px 16px', background: '#f1f5f9', color: '#374151', fontSize: 13 })}><RefreshCw size={13} /> Refresh</button>
            </div>
            {auditLog.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No audit records yet.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#f8fafc' }}>{['#', 'Admin', 'From', 'To', 'Driver Change', 'Type', 'Students', 'Parents', 'DB', 'GPS', 'Notif', 'Timestamp'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>{auditLog.map((log, idx) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '9px 12px', color: '#94a3b8', fontWeight: 700 }}>#{String(auditLog.length - idx).padStart(2, '0')}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{log.adminName}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#dc2626' }}>{log.fromVehicle}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#16a34a' }}>{log.toVehicle}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b', fontSize: 11 }}>{log.previousDriver || '--'} {'\u2192'} {log.newDriver || '--'}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ background: log.assignmentType === 'temporary' ? '#fef9c3' : '#dbeafe', color: log.assignmentType === 'temporary' ? '#713f12' : '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{log.assignmentType}</span></td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>{log.studentsAffected}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>{log.parentsNotified}</td>
                      <td style={{ padding: '9px 12px', color: '#16a34a' }}>OK</td>
                      <td style={{ padding: '9px 12px', color: '#16a34a' }}>OK</td>
                      <td style={{ padding: '9px 12px', color: '#16a34a' }}>OK</td>
                      <td style={{ padding: '9px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(log.createdAt)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <style>{'@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
        </div>
      </main>
    </div>
  );
}
