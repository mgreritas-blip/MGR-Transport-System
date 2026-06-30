import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Wrench, ClipboardList, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { fetchIssues } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const LS_KEY = 'ctms_maint_issues';

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
    Completed:    { text: '#059669', bg: '#D1FAE5', border: '#10B981' },
    'In Progress':{ text: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    Pending:      { text: '#DC2626', bg: '#FEE2E2', border: '#EF4444' },
    Ongoing:      { text: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
    Approved:     { text: '#2563EB', bg: '#DBEAFE', border: '#3B82F6' },
  };
  return map[s] || { text: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' };
};

// ── Admin Raised Issues Table ─────────────────────────────────────────────────
const AdminIssueTable = ({ logs, onDelete }) => {
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
            <th style={thStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const p = priorityStyle(log.priority);
            const s = statusColors(log.status);
            return (
              <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 700, width: '40px' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#10B981" />
                    {log.date}
                  </div>
                </td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{log.vehicle}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={14} color={p.color} />
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{log.issueType}</span>
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
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.text, background: s.bg, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                    {log.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => onDelete(log.id)} style={{ padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, background: '#FEE2E2', color: '#DC2626', border: '1px solid #EF4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Remove
                  </button>
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
  const [adminIssues, setAdminIssues] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const vehicleRef = useRef();
  const issueTypeRef = useRef();
  const descRef = useRef();
  const priorityRef = useRef();

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try { setAdminIssues(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(adminIssues));
  }, [adminIssues]);

  const handleRaiseIssue = () => {
    const vehicle = vehicleRef.current?.value?.trim();
    const issueType = issueTypeRef.current?.value;
    const description = descRef.current?.value?.trim();
    const priority = priorityRef.current?.value;

    if (!vehicle || !description) {
      alert('Please fill in Vehicle ID and Description.');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const newIssue = {
      id: `ADM-${Date.now()}`,
      date: dateStr,
      vehicle,
      issueType,
      description,
      priority,
      status: 'Pending',
      raisedBy: 'Admin',
    };

    setAdminIssues(prev => [newIssue, ...prev]);
    setShowModal(false);
    if (vehicleRef.current) vehicleRef.current.value = '';
    if (descRef.current) descRef.current.value = '';
  };

  const handleDelete = (id) => {
    setAdminIssues(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar />
        <section className="page-content">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>Maintenance Issue Log</h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                Issues raised here are <strong>instantly pushed</strong> to the Maintenance Staff App as notifications.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} style={{ padding: '0.7rem 1.3rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', whiteSpace: 'nowrap' }}>
              <PlusCircle size={16} />
              Raise Issue
            </button>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#1D4ED8' }}>
            <AlertTriangle size={16} />
            <span>
              Issues raised from this panel are stored via a shared <strong>localStorage channel</strong> and synced to the
              <strong> Maintenance Staff App</strong> in real time.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Raised', val: adminIssues.length, color: '#2563EB', bg: '#DBEAFE' },
              { label: 'Pending', val: adminIssues.filter(i => i.status === 'Pending').length, color: '#DC2626', bg: '#FEE2E2' },
              { label: 'Critical', val: adminIssues.filter(i => i.priority === 'Critical').length, color: '#7C3AED', bg: '#EDE9FE' },
            ].map(chip => (
              <div key={chip.label} style={{ background: chip.bg, padding: '8px 16px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: chip.color }}>{chip.val}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: chip.color }}>{chip.label}</span>
              </div>
            ))}
          </div>

          <AdminIssueTable logs={adminIssues} onDelete={handleDelete} />

        </section>
      </main>

      {showModal && (
        <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', width: '440px', maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.4rem', color: '#1E293B', fontSize: '1.2rem' }}>🚨 Raise New Issue</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: '#64748B' }}>This will appear as a notification in the Maintenance Staff App.</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Vehicle ID *</label>
              <input ref={vehicleRef} type="text" placeholder="e.g. BUS-01" style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Issue Type</label>
              <select ref={issueTypeRef} style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option>Engine/Mechanical</option>
                <option>Brakes</option>
                <option>Electrical</option>
                <option>Tyres/Wheels</option>
                <option>Body/Interior</option>
                <option>Routine Maintenance</option>
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
              <textarea ref={descRef} rows="3" placeholder="Describe the issue in detail..." style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #CBD5E1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
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
    </div>
  );
};

export default Issues;
