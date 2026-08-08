import { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, RefreshCw, Filter } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';

export function ActivityStreamPage({ ctrl }: { ctrl: AppController }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'DISCOVERY' | 'ACCEPT' | 'REJECT' | 'PUBLISH'>('ALL');

  const fetchLogs = async () => {
    try {
      const agentId = localStorage.getItem('navarachna_agent_id');
      if (!agentId) return;
      const res = await fetch(`/api/agent/status?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.recentActivity) {
          setLogs(data.recentActivity);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    if (filter === 'DISCOVERY') return log.eventType.includes('DISCOVERY');
    if (filter === 'ACCEPT') return log.eventType.includes('ACCEPTED');
    if (filter === 'REJECT') return log.eventType.includes('REJECTED');
    if (filter === 'PUBLISH') return log.eventType.includes('PUBLISHED');
    return true;
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in mono">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="t-h1 c-primary" style={{ fontFamily: 'var(--font-sans)' }}>Autonomous Activity Stream</h1>
          <p className="t-body c-secondary" style={{ marginTop: 6, fontFamily: 'var(--font-sans)' }}>
            Real-time stdout execution log of continuous discovery scans, LLM scoring, and broadcast events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="t-caption" style={{ marginRight: 4 }}>FILTER STDOUT:</span>
        {(['ALL', 'DISCOVERY', 'ACCEPT', 'REJECT', 'PUBLISH'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Terminal Container */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-inset)', minHeight: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
          <span className="t-caption c-accent">&gt;_ STDOUT TERMINAL &bull; NAVARACHNA DAEMON TTY/0</span>
          <span className="t-caption c-success">ACTIVE &bull; 30s INTERVAL</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }} className="c-muted t-caption">
            Listening to stdout stream... Active discovery loop in progress.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredLogs.map((log, idx) => {
              const isApproved = log.eventType.includes('ACCEPTED') || log.eventType.includes('PUBLISHED');
              const isRejected = log.eventType.includes('REJECTED');
              const badgeClass = isApproved ? 'badge-green' : isRejected ? 'badge-red' : 'badge-cyan';

              return (
                <div key={idx} style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="c-muted" style={{ fontSize: 12 }}>
                      [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '11:38:00'}]
                    </span>
                    <span className={`badge ${badgeClass}`}>{log.eventType}</span>
                    <span className="c-primary" style={{ fontWeight: 600, fontSize: 13 }}>{log.title}</span>
                  </div>
                  {log.description && (
                    <div className="c-secondary" style={{ fontSize: 12, paddingLeft: 12, borderLeft: '2px solid var(--border-medium)', marginTop: 6 }}>
                      {log.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
