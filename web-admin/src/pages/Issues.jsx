import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Wrench, ClipboardList, CheckCircle2, PlusCircle, Trash2, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000';
let socket = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const priorityStyle = (p) => {
  const map = {
    Critical: { bg: '#FEE2E2', color: '#DC2626', border: '#EF4444' },
    High:     { bg: '#FEF3C7', color: '#D97706', border: '#F59E0B' },
    Medium:   { bg: '#DBEAFE', color: '#2563EB', border: '#3B82F6' },
    Low:      { bg: '#D1FAE5', color: '#059669', border: '#10B981' },
  };
  return map[p] || map.Low;
};

const statusColors = (s) => {
  const map = {
    Resolved:     { text: '#059669', bg: '#D1FAE5', border: '#10B981' },
    Acknowledged: { text: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    Pending:      { text: '#DC2626', bg: '#FEE2E2', border: '#EF4444' },
  };
  return map[s] || { text: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' };
};

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true
});

// ── Issue Table ───────────────────────────────────────────────────────────────
const AlertTable = ({ logs, onMarkShutdown }) => {
  const thStyle = {
    padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700,
    color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em',
    background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap'
  };
  const tdStyle = {
    padding: '0.85rem 1rem', fontSize: '0.87rem', color: '#334155',
    borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle'
  };

  if (!logs.length) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
      <ClipboardList size={32} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
      <p style={{ margin: 0 }}>No issues raised yet. Click "Raise Issue" to create one.</p>
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Date & Time</th>
            <th style={thStyle}>Vehicle</th>
            <th style={thStyle}>Issue Type</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const p = priorityStyle(log.priority);
            const s = statusColors(log.status);
            return (
              <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC', animation: log._new ? 'highlight 2s ease-out' : 'none' }}>
                <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 700, width: '40px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#10B981" />
                    {fmtDate(log.createdAt)}
                  </div>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{log.vehicle}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={14} color={p.color} />
                    <span style={{ fontWeight: 600 }}>{log.issueType}</span>
                  </div>
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748B', maxWidth: '200px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color, background: p.bg, padding: '3px 10px', borderRadius: '999px', border: `1px solid ${p.border}` }}>
                    {log.priority}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.text, background: s.bg, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${s.border}` }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  {(log.priority === 'Critical' || log.priority === 'High') && log.status === 'Pending' && (
                    <button
                      onClick={() => onMarkShutdown(log)}
                      style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706', border: '1px solid #F59E0B', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      🚌 Push Shutdown Alert
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Issues = () => {
  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [shutdownTarget, setShutdownTarget] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const vehicleRef    = useRef();
  const issueTypeRef  = useRef();
  const descRef       = useRef();
  const priorityRef   = useRef();
  const replacementRef = useRef();
  const routeRef      = useRef();

  // ── Socket.IO Setup ──────────────────────────────────────────────────────
  useEffect(() => {
    // Connect to backend
    socket = io(API_BASE, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinRoom', { role: 'superadmin' });
      console.log('[Socket] Connected as admin');
    });

    socket.on('disconnect', () => setConnected(false));

    // Real-time: new alert from any source
    socket.on('newMaintenanceAlert', (alert) => {
      setAlerts(prev => [{ ...alert, _new: true }, ...prev]);
    });

    // Real-time: status updated (acknowledged/resolved)
    socket.on('alertStatusUpdated', (updated) => {
      setAlerts(prev => prev.map(a => a.id === updated.id ? { ...updated } : a));
    });

    return () => { socket?.disconnect(); };
  }, []);

  // ── Load existing alerts from DB on mount ────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/maintenance-alerts`)
      .then(r => r.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Raise New Issue ──────────────────────────────────────────────────────
  const handleRaiseIssue = async () => {
    const vehicle     = vehicleRef.current?.value?.trim();
    const issueType   = issueTypeRef.current?.value;
    const description = descRef.current?.value?.trim();
    const priority    = priorityRef.current?.value;

    if (!vehicle || !description) {
      alert('Please fill in Vehicle ID and Description.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/maintenance-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle, issueType, description, priority, raisedBy: 'Admin' })
      });
      if (!res.ok) throw new Error('Server error');
      // Socket.IO will push the new alert back via 'newMaintenanceAlert'
      setShowModal(false);
      if (vehicleRef.current)   vehicleRef.current.value   = '';
      if (descRef.current)      descRef.current.value      = '';
    } catch (err) {
      alert('Could not connect to backend. Check if server is running on port 3000.');
    }
  };

  // ── Push Bus Shutdown Alert ──────────────────────────────────────────────
  const handleShutdown = async () => {
    const replacementBus = replacementRef.current?.value?.trim();
    const affectedRoute  = routeRef.current?.value?.trim();
    if (!shutdownTarget) return;

    try {
      await fetch(`${API_BASE}/api/bus-shutdowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: shutdownTarget.vehicle,
          reason: `[${shutdownTarget.issueType}] ${shutdownTarget.description}`,
          replacementBus,
          affectedRoute,
          priority: shutdownTarget.priority
        })
      });
      setShowShutdownModal(false);
      setShutdownTarget(null);
      alert(`✅ Bus Shutdown alert pushed to Student, Parent, HoD and Coordinator apps for ${shutdownTarget.vehicle}.`);
    } catch {
      alert('Could not send shutdown alert. Check backend connection.');
    }
  };

  const openShutdownModal = (log) => { setShutdownTarget(log); setShowShutdownModal(true); };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>Maintenance Issue Log</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {connected
                  ? <><Wifi size={13} color="#10B981" /><span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Live — WebSocket Connected</span></>
                  : <><WifiOff size={13} color="#EF4444" /><span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 700 }}>Disconnected — Start backend on port 3000</span></>
                }
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '0.7rem 1.3rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', whiteSpace: 'nowrap' }}
            >
              <PlusCircle size={16} /> Raise Issue
            </button>
          </div>

          {/* Info Banner */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#1D4ED8' }}>
            <AlertTriangle size={16} />
            <span>
              Issues are saved to the <strong>database</strong> and pushed via <strong>WebSocket</strong> to the Maintenance Staff App instantly.
              Critical/High issues can also push a <strong>Bus Shutdown Alert</strong> to Student, Parent &amp; HoD apps.
            </span>
          </div>

          {/* Summary Chips */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total', val: alerts.length, color: '#2563EB', bg: '#DBEAFE' },
              { label: 'Pending', val: alerts.filter(a => a.status === 'Pending').length, color: '#DC2626', bg: '#FEE2E2' },
              { label: 'Acknowledged', val: alerts.filter(a => a.status === 'Acknowledged').length, color: '#D97706', bg: '#FEF3C7' },
              { label: 'Resolved', val: alerts.filter(a => a.status === 'Resolved').length, color: '#059669', bg: '#D1FAE5' },
              { label: 'Critical', val: alerts.filter(a => a.priority === 'Critical').length, color: '#7C3AED', bg: '#EDE9FE' },
            ].map(chip => (
              <div key={chip.label} style={{ background: chip.bg, padding: '8px 16px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: chip.color }}>{chip.val}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: chip.color }}>{chip.label}</span>
              </div>
            ))}
          </div>

          {loading
            ? <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading from database...</div>
            : <AlertTable logs={alerts} onMarkShutdown={openShutdownModal} />
          }

        </section>
      </main>

      {/* ── Raise Issue Modal ── */}
      {showModal && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '440px', maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.4rem', color: '#1E293B' }}>🚨 Raise New Issue</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: '#64748B' }}>
              Saved to DB &amp; pushed instantly to Maintenance Staff App via WebSocket.
            </p>

            {[
              { label: 'Vehicle ID *', ref: vehicleRef, type: 'input', placeholder: 'e.g. BUS-01' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>{f.label}</label>
                <input ref={f.ref} type="text" placeholder={f.placeholder} style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Issue Type</label>
              <select ref={issueTypeRef} style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option>Engine/Mechanical</option>
                <option>Brakes</option>
                <option>Electrical</option>
                <option>Tyres/Wheels</option>
                <option>Body/Interior</option>
                <option>Routine Maintenance</option>
                <option>Manual Issue Entry</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Priority</label>
              <select ref={priorityRef} style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Description *</label>
              <textarea ref={descRef} rows="3" placeholder="Describe the issue..." style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.7rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRaiseIssue} style={{ flex: 2, padding: '0.7rem', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <AlertTriangle size={15} /> Send to Maintenance Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bus Shutdown Modal ── */}
      {showShutdownModal && shutdownTarget && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '440px', maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#D97706' }}>🚌 Push Bus Shutdown Alert</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
              This will push an instant notification to <strong>Student, Parent, HoD and Coordinator</strong> apps about <strong>{shutdownTarget.vehicle}</strong>.
            </p>

            <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: '8px', padding: '12px', marginBottom: '1.2rem', fontSize: '0.85rem', color: '#92400E' }}>
              <strong>Issue:</strong> [{shutdownTarget.issueType}] {shutdownTarget.description}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Replacement Bus (optional)</label>
              <input ref={replacementRef} type="text" placeholder="e.g. BUS-05" style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Affected Route</label>
              <input ref={routeRef} type="text" placeholder="e.g. Route 7 (Theni)" style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowShutdownModal(false)} style={{ flex: 1, padding: '0.7rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleShutdown} style={{ flex: 2, padding: '0.7rem', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                📢 Send Shutdown Alert Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes highlight {
          0%   { background: #FEF9C3; }
          100% { background: transparent; }
        }
      `}</style>
    </div>
  );
};

export default Issues;
