import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, Wrench, ClipboardList, ThumbsUp, CheckCircle2, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { fetchIssues } from '../api';

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
    Completed:   { text: '#059669', bg: '#D1FAE5', border: '#10B981' },
    'In Progress':{ text: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    Pending:     { text: '#DC2626', bg: '#FEE2E2', border: '#EF4444' },
    Ongoing:     { text: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    Approved:    { text: '#2563EB', bg: '#DBEAFE', border: '#3B82F6' },
  };
  return map[s] || { text: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' };
};

const tabStyle = (active) => ({
  padding: '0.6rem 1.4rem',
  borderRadius: '8px 8px 0 0',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  background: active ? '#fff' : 'transparent',
  color: active ? '#2563EB' : '#64748B',
  borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
  transition: 'all 0.2s',
});

// ── Sub-components ────────────────────────────────────────────────────────────

const IncidentCard = ({ issue, onUpdate }) => {
  const c = statusColors(issue.status);
  return (
    <div style={{ flex: '1 1 240px', background: '#fff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', borderLeft: `4px solid ${c.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#1E293B', fontSize: '0.95rem' }}>
          <AlertTriangle size={16} color={c.text} /> {issue.type}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, background: '#F8FAFC', padding: '4px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>{issue.time}</span>
      </div>
      <p style={{ margin: '6px 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
        <strong style={{ color: '#334155' }}>Vehicle:</strong> {issue.vehicle}<br />
        <strong style={{ color: '#334155' }}>Reporter:</strong> {issue.reportedBy}
      </p>
      <div style={{ marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.text, background: c.bg, padding: '4px 10px', borderRadius: '999px' }}>{issue.status}</span>
        {issue.status === 'Pending' && (
          <button className="btn btn-primary" onClick={() => onUpdate(issue.id, 'Ongoing')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '4px' }}>Start Work</button>
        )}
        {issue.status === 'Ongoing' && (
          <button onClick={() => onUpdate(issue.id, 'Completed')} style={{ background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <CheckSquare size={14} /> Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};

const ServiceRequestCard = ({ req, onApprove, onReject }) => {
  const p = priorityStyle(req.priority);
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: `4px solid ${p.border}`, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Wrench size={16} color={p.color} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B' }}>{req.requestType}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.color, background: p.bg, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${p.border}` }}>{req.priority}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', maxWidth: '520px', lineHeight: 1.5 }}>{req.description}</p>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>{req.submittedAt}</span>
      </div>

      <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.84rem', color: '#475569' }}>
        <span><strong style={{ color: '#334155' }}>Driver:</strong> {req.driverName} <span style={{ color: '#94A3B8' }}>({req.driverId})</span></span>
        <span><strong style={{ color: '#334155' }}>Vehicle:</strong> {req.vehicle}</span>
        <span><strong style={{ color: '#334155' }}>Ref:</strong> {req.id}</span>
      </div>

      <div style={{ marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onReject(req.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.45rem 1rem', borderRadius: '6px', border: '1.5px solid #EF4444', background: '#fff', color: '#DC2626', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          <XCircle size={15} /> Reject
        </button>
        <button
          onClick={() => onApprove(req.id)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.45rem 1.1rem', borderRadius: '6px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          <ThumbsUp size={15} /> Approve
        </button>
      </div>
    </div>
  );
};

const MaintenanceLogTable = ({ logs }) => {
  const thStyle = {
    padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700,
    color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em',
    background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap'
  };
  const tdStyle = {
    padding: '0.85rem 1rem', fontSize: '0.87rem', color: '#334155',
    borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle'
  };

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Ref</th>
            <th style={thStyle}>Work Type</th>
            <th style={thStyle}>Vehicle</th>
            <th style={thStyle}>Reported By</th>
            <th style={thStyle}>Priority</th>
            <th style={thStyle}>Paper Log</th>
            <th style={thStyle}>Approved On</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const s = statusColors(log.status);
            const p = priorityStyle(log.priority);
            return (
              <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600, width: '40px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B' }}>
                  {log.id}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={14} color={p.color} />
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{log.requestType}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description}</div>
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{log.vehicle}</td>
                <td style={tdStyle}>{log.driverName}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.color, background: p.bg, padding: '3px 10px', borderRadius: '999px', border: `1px solid ${p.border}` }}>
                    {log.priority}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                  <button onClick={() => alert('Viewing paper log for ' + log.id)} style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, background: '#E0E7FF', color: '#4338CA', border: '1px solid #C7D2FE', borderRadius: '6px', cursor: 'pointer' }}>View</button>
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color='#10B981' />
                    {log.approvedAt}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.text, background: s.bg, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                    {log.status}
                  </span>
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
  const [activeTab, setActiveTab] = useState('incidents');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [todayFilter, setTodayFilter] = useState('All');
  const [rejectedIds, setRejectedIds] = useState([]);
  const [logFilter, setLogFilter] = useState('All');
  const [logPeriod, setLogPeriod] = useState('Day');

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await fetchIssues();
      const mapped = data.map(issue => ({
        id: issue.id,
        type: issue.title || issue.type,
        vehicle: issue.vehicle?.number || 'N/A',
        reportedBy: issue.user?.name || 'Unknown',
        time: new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: issue.status === 'OPEN' ? 'Pending' : (issue.status === 'RESOLVED' ? 'Completed' : 'Ongoing'),
        dateGroup: 'Today'
      }));
      setIncidents(mapped);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentUpdate = (id, newStatus) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const handleApprove = (id) => {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;
    const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setMaintenanceLog(prev => [...prev, { ...req, status: 'Approved', approvedAt: now }]);
    setServiceRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleReject = (id) => {
    setRejectedIds(prev => [...prev, id]);
    setServiceRequests(prev => prev.filter(r => r.id !== id));
  };

  const todayIncidents = incidents.filter(d => d.dateGroup === 'Today' && (todayFilter === 'All' || d.status === todayFilter));

  const filterBtn = (f, current, set, labels) => (
    <button key={f} onClick={() => set(f)} style={{
      padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', transition: 'all 0.2s',
      border: current === f ? '1px solid #2563EB' : '1px solid #CBD5E1',
      background: current === f ? '#3B82F6' : '#fff',
      color: current === f ? '#fff' : '#475569',
    }}>{labels?.[f] || f}</button>
  );

  const tabs = [
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={15} />, count: incidents.length },
    { id: 'requests', label: 'Service Requests', icon: <Wrench size={15} />, count: serviceRequests.length },
    { id: 'log', label: 'Maintenance Log', icon: <ClipboardList size={15} />, count: maintenanceLog.length },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>Maintenance &amp; Service Hub</h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E2E8F0', marginBottom: '1.75rem' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(activeTab === tab.id)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tab.icon} {tab.label}
                  <span style={{
                    background: activeTab === tab.id ? '#2563EB' : '#E2E8F0',
                    color: activeTab === tab.id ? '#fff' : '#475569',
                    fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', minWidth: '20px', textAlign: 'center'
                  }}>{tab.count}</span>
                </span>
              </button>
            ))}
          </div>

          {/* ── Tab: Incidents ── */}
          {activeTab === 'incidents' && (
            <>
              {/* Today */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: '0 0 1rem 0' }}>Today's Incidents</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['All', 'Pending', 'Ongoing', 'Completed'].map(f => filterBtn(f, todayFilter, setTodayFilter))}
                  </div>
                  <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#64748B' }}>Displaying {todayIncidents.length} incident(s)</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {todayIncidents.length > 0
                    ? todayIncidents.map(i => <IncidentCard key={i.id} issue={i} onUpdate={handleIncidentUpdate} />)
                    : <div style={{ width: '100%', padding: '2rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>No incidents for this filter.</div>
                  }
                </div>
              </div>

              {/* Earlier */}
              <div>
                <h2 style={{ fontSize: '1.2rem', color: '#1E293B', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #E2E8F0' }}>Earlier Records</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {incidents.filter(d => d.dateGroup === 'Earlier').map(i => (
                    <IncidentCard key={i.id} issue={i} onUpdate={handleIncidentUpdate} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Service Requests ── */}
          {activeTab === 'requests' && (
            <div>
              {/* Info Banner */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#1D4ED8' }}>
                <ThumbsUp size={16} />
                <span>Approve a request to send it to the Maintenance Team log. Rejected requests are archived.</span>
              </div>

              {serviceRequests.length > 0
                ? serviceRequests.map(req => (
                    <ServiceRequestCard key={req.id} req={req} onApprove={handleApprove} onReject={handleReject} />
                  ))
                : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <Wrench size={32} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0 }}>No pending service requests from drivers.</p>
                  </div>
                )}

              {rejectedIds.length > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#94A3B8', textAlign: 'center' }}>
                  {rejectedIds.length} request(s) rejected and archived this session.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Maintenance Log ── */}
          {activeTab === 'log' && (
            <div>
              {/* Info Banner */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#15803D' }}>
                <ClipboardList size={16} />
                <span>Read-only log of admin-approved work orders. Work status is updated live by the <strong>Maintenance Staff App</strong>.</span>
              </div>

              {/* Summary + Filter Row */}
              {maintenanceLog.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.1rem' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#334155', marginRight: '8px', alignSelf: 'center' }}>Period:</strong>
                    {['Day', 'Week', 'Month', 'Year'].map(p => (
                      <button key={p} onClick={() => setLogPeriod(p)} style={{
                        padding: '5px 13px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                        background: logPeriod === p ? '#2563EB' : '#fff',
                        color: logPeriod === p ? '#fff' : '#64748B',
                        border: logPeriod === p ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0'
                      }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#334155', marginRight: '8px', alignSelf: 'center' }}>Status:</strong>
                      {['All', 'Approved', 'Ongoing', 'Completed', 'Aborted'].map(s => {
                        const c = statusColors(s === 'All' ? 'Approved' : s);
                        const cnt = s === 'All' ? maintenanceLog.length : maintenanceLog.filter(l => l.status === s).length;
                        return (
                          <button key={s} onClick={() => setLogFilter(s)} style={{
                            padding: '5px 13px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                            background: logFilter === s ? (s === 'All' ? '#1E293B' : c.bg) : '#fff',
                            color: logFilter === s ? (s === 'All' ? '#fff' : c.text) : '#64748B',
                            border: logFilter === s ? `1.5px solid ${s === 'All' ? '#1E293B' : c.border}` : '1.5px solid #E2E8F0'
                          }}>
                            {s} ({cnt})
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{maintenanceLog.length} total record(s)</span>
                  </div>
                </div>
              )}

              {maintenanceLog.length > 0
                ? <MaintenanceLogTable logs={maintenanceLog.filter(l => logFilter === 'All' || l.status === logFilter)} />
                : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <ClipboardList size={32} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0 }}>No approved work orders yet.</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>Approve service requests in the <strong>Service Requests</strong> tab to populate this log.</p>
                  </div>
                )}
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default Issues;
