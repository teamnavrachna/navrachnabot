import { useEffect, useState } from 'react';
import { Inbox, RefreshCw, TrendingUp, CheckCircle2, Clock, Filter } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';

export function ApprovedQueuePage({ ctrl }: { ctrl: AppController }) {
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const agentId = localStorage.getItem('navarachna_agent_id');
      if (!agentId) return;
      const res = await fetch(`/api/agent/queue?agentId=${agentId}`);
      if (res.ok) setQueueData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const i = setInterval(fetchQueue, 5000);
    return () => clearInterval(i);
  }, []);

  const qh = queueData?.queueHealth || { queueSize: 0, averageScore: 0, highestPriorityScore: 0, publishingPressure: 'LOW' };
  const rawQueue: any[] = queueData?.queue || [];
  const sorted = [...rawQueue].sort((a, b) => (b.priorityScore || b.score || 0) - (a.priorityScore || a.score || 0));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }} className="animate-slide-up">
        <div>
          <h1 className="t-h1 text-primary">Editorial Pipeline</h1>
          <p className="t-body text-secondary" style={{ marginTop: 6 }}>
            Scored &amp; approved candidate topics queued for next publication cycle.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: 13, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Pipeline Status
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }} className="animate-slide-up">
        <PipelineStat label="Buffered Topics" value={sorted.length || qh.queueSize} icon={Inbox} color="var(--accent)" />
        <PipelineStat label="Average Score" value={qh.averageScore ? qh.averageScore.toFixed(1) : '86.0'} icon={TrendingUp} color="var(--success)" />
        <PipelineStat label="Highest Signal Score" value={qh.highestPriorityScore ? qh.highestPriorityScore.toFixed(1) : '92.0'} icon={CheckCircle2} color="var(--highlight)" />
        <PipelineStat label="Publish Pressure" value={qh.publishingPressure || 'MEDIUM'} icon={Filter} color="var(--warning)" />
      </div>

      {/* Main Data Table Card */}
      <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(22, 27, 34, 0.40)' }}>
          <span className="t-label text-primary" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>Active Priority Queue</span>
          <span className="badge badge-cyan mono">{sorted.length} Approved Items</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Priority</th>
                <th style={{ minWidth: 340 }}>Topic Headline &amp; Context</th>
                <th style={{ width: 140, whiteSpace: 'nowrap' }}>Signal Score</th>
                <th style={{ width: 140 }}>Source</th>
                <th style={{ width: 130 }}>Discovered</th>
                <th style={{ width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-tertiary)' }} className="mono">
                    <Clock size={24} className="text-muted" style={{ margin: '0 auto 10px' }} />
                    Queue is currently empty. Discovery engine scans every 30 seconds.
                  </td>
                </tr>
              ) : (
                sorted.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td>
                      <span className={`badge ${idx === 0 ? 'badge-cyan' : idx === 1 ? 'badge-blue' : 'badge-gray'}`}>
                        P{idx + 1}
                      </span>
                    </td>
                    <td style={{ paddingRight: 24 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
                      {item.summary && <div className="text-secondary" style={{ fontSize: 12, lineHeight: 1.45 }}>{item.summary.slice(0, 110)}...</div>}
                    </td>
                    <td className="mono text-accent" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {(item.editorialScore || item.priorityScore || item.score || 86).toFixed(1)} / 100
                    </td>
                    <td className="text-secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{item.source || 'arXiv / RSS'}</td>
                    <td className="mono text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {item.discoveredAt ? new Date(item.discoveredAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td>
                      <span className="badge badge-green">BUFFERED</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PipelineStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Inbox; color: string }) {
  return (
    <div className="card card-hover" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="t-caption" style={{ fontWeight: 600 }}>{label}</span>
        <div style={{ padding: 7, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div className="t-h1 mono" style={{ color, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
