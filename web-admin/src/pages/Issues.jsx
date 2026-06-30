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

// Removed old IncidentCard and ServiceRequestCard as they are replaced by Maintenance Logs

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
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [loading, setLoading] = useState(true);
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
        requestType: issue.title || issue.type,
        description: issue.description || 'Routine check.',
        vehicle: issue.vehicle?.number || 'N/A',
        driverName: issue.user?.name || 'Unknown',
        priority: issue.priority || 'Medium',
        approvedAt: new Date(issue.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: issue.status === 'OPEN' ? 'Ongoing' : (issue.status === 'RESOLVED' ? 'Completed' : 'Ongoing')
      }));
      setMaintenanceLog(mapped);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1>Log Maintenance</h1>
          </div>

          <div>
            {/* Info Banner */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#15803D' }}>
              <ClipboardList size={16} />
              <span>Comprehensive log of all maintenance work. Work status is updated live by the <strong>Maintenance Staff App</strong>.</span>
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

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading logs...</div>
            ) : maintenanceLog.length > 0 ? (
              <MaintenanceLogTable logs={maintenanceLog.filter(l => logFilter === 'All' || l.status === logFilter)} />
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <ClipboardList size={32} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0 }}>No approved work orders yet.</p>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
};

export default Issues;
