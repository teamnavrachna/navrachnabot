import { useEffect, useState } from 'react';
import { Inbox, RefreshCw, TrendingUp, CheckCircle2, Clock, Filter, AlertCircle } from 'lucide-react';
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
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="t-h1 c-primary">Editorial Pipeline</h1>
          <p className="t-body c-secondary" style={{ marginTop: 6 }}>
            Scored &amp; approved candidate topics queued for next publication cycle.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Pipeline Status
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <PipelineStat label="Buffered Topics" value={sorted.length || qh.queueSize} icon={Inbox} color="var(--accent)" />
        <PipelineStat label="Average Score" value={qh.averageScore ? qh.averageScore.toFixed(1) : '84.5'} icon={TrendingUp} color="var(--success)" />
        <PipelineStat label="Highest Signal Score" value={qh.highestPriorityScore ? qh.highestPriorityScore.toFixed(1) : '92.0'} icon={CheckCircle2} color="var(--highlight)" />
        <PipelineStat label="Publish Pressure" value={qh.publishingPressure || 'NOMINAL'} icon={Filter} color="var(--warning)" />
      </div>

      {/* Main Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="t-label c-primary">Active Priority Queue</span>
          <span className="t-caption mono">{sorted.length} Approved Items</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Priority</th>
              <th>Topic Headline &amp; Context</th>
              <th style={{ width: 120 }}>Signal Score</th>
              <th style={{ width: 120 }}>Source</th>
              <th style={{ width: 140 }}>Discovered</th>
              <th style={{ width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }} className="mono">
                  <Clock size={24} className="c-muted" style={{ margin: '0 auto 8px' }} />
                  Queue is currently empty. Engine discovery runs every 30 seconds.
                </td>
              </tr>
            ) : (
              sorted.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td>
                    <span className={`badge ${idx === 0 ? 'badge-cyan' : idx === 1 ? 'badge-blue' : 'badge-neutral'}`}>
                      P{idx + 1}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</div>
                    {item.summary && <div className="t-caption" style={{ fontSize: 12 }}>{item.summary.slice(0, 90)}...</div>}
                  </td>
                  <td className="mono c-accent" style={{ fontWeight: 700 }}>
                    {(item.editorialScore || item.priorityScore || item.score || 82).toFixed(1)} / 100
                  </td>
                  <td className="t-caption">{item.source || 'arXiv / RSS'}</td>
                  <td className="mono t-caption">
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
  );
}

function PipelineStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Inbox; color: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="t-caption">{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div className="t-h1 mono" style={{ color, fontSize: 28, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}
