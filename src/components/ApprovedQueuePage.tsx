import { useEffect, useState } from 'react';
import { Inbox, RefreshCw, TrendingUp, CheckCircle2, Clock, Filter } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';

export function ApprovedQueuePage({ ctrl }: { ctrl: AppController }) {
  const { state } = ctrl;
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const agentId = localStorage.getItem('navrachna_agent_id');
      if (agentId) {
        const res = await fetch(`/api/agent/queue?agentId=${agentId}`);
        if (res.ok) setQueueData(await res.json());
      }
    } catch (e) {
      console.error('Queue fetch error:', e);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchQueue();
    const i = setInterval(fetchQueue, 4000);
    return () => clearInterval(i);
  }, []);

  const backendItems = queueData?.queue || [];
  let displayQueue: any[] = backendItems;

  if (state.approvedQueue && state.approvedQueue.length > 0) {
    displayQueue = state.approvedQueue.map((s: any, idx: number) => ({
      id: s.id || `q-${idx}`,
      title: s.title,
      summary: s.summary || s.tags?.join(' • ') || 'Autonomous intelligence topic candidate.',
      source: s.source?.name || 'arXiv / RSS',
      sourceUrl: s.source?.url || 'https://arxiv.org',
      editorialScore: s.score || 86,
      priorityScore: s.significance || 88,
      discoveredAt: new Date(s.publishedAt || Date.now()).toISOString(),
      status: 'QUEUED'
    }));
  } else if (displayQueue.length === 0 && state.scans.length > 0) {
    const acceptedFromScans = state.scans
      .flatMap((sc: any) => sc.scored || [])
      .filter((s: any) => s.accepted && !state.memory.coveredTopicIds.includes(s.id));
    displayQueue = acceptedFromScans.map((s: any, idx: number) => ({
      id: s.id || `q-${idx}`,
      title: s.title,
      summary: s.summary || s.tags?.join(' • ') || 'Autonomous intelligence topic candidate.',
      source: s.source?.name || 'arXiv / RSS',
      sourceUrl: s.source?.url || 'https://arxiv.org',
      editorialScore: s.score || 86,
      priorityScore: s.significance || 88,
      discoveredAt: new Date(s.publishedAt || Date.now()).toISOString(),
      status: 'QUEUED'
    }));
  }

  const sorted = [...displayQueue].sort((a, b) => (b.priorityScore || b.editorialScore || 0) - (a.priorityScore || a.editorialScore || 0));
  const avgScore = sorted.length > 0 ? (sorted.reduce((acc, curr) => acc + (curr.editorialScore || 85), 0) / sorted.length) : 0;
  const maxScore = sorted.length > 0 ? Math.max(...sorted.map(s => s.priorityScore || s.editorialScore || 85)) : 0;

  const qh = queueData?.queueHealth || {
    queueSize: sorted.length,
    averageScore: avgScore,
    highestPriorityScore: maxScore,
    publishingPressure: sorted.length >= 3 ? 'HIGH' : sorted.length >= 1 ? 'MEDIUM' : 'NOMINAL'
  };

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
        <PipelineStat label="Buffered Topics" value={sorted.length} icon={Inbox} color="var(--accent)" />
        <PipelineStat label="Average Score" value={qh.averageScore ? Number(qh.averageScore).toFixed(1) : '0.0'} icon={TrendingUp} color="var(--success)" />
        <PipelineStat label="Highest Signal Score" value={qh.highestPriorityScore ? Number(qh.highestPriorityScore).toFixed(1) : '0.0'} icon={CheckCircle2} color="var(--highlight)" />
        <PipelineStat label="Publish Pressure" value={qh.publishingPressure || 'NOMINAL'} icon={Filter} color="var(--warning)" />
      </div>

      {/* Main Data Table Card */}
      <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-inset)' }}>
          <span className="t-label text-primary" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>Active Priority Queue</span>
          <span className="badge badge-cyan mono" style={{ padding: '4px 10px', fontSize: 12 }}>{sorted.length} Approved Items</span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '75px' }} />
              <col style={{ width: '45%' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--bg-inset)' }}>
                <th style={{ width: 75, paddingLeft: 20, paddingRight: 10 }}>Priority</th>
                <th style={{ paddingLeft: 12, paddingRight: 20 }}>Topic Headline &amp; Context</th>
                <th style={{ width: 130, paddingLeft: 12, paddingRight: 16, whiteSpace: 'nowrap' }}>Signal Score</th>
                <th style={{ width: 130, paddingLeft: 12, paddingRight: 16 }}>Source</th>
                <th style={{ width: 110, paddingLeft: 12, paddingRight: 16 }}>Discovered</th>
                <th style={{ width: 90, paddingRight: 20 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-tertiary)' }} className="mono">
                    <Clock size={24} className="text-muted" style={{ margin: '0 auto 10px' }} />
                    Queue is currently empty. Discovery engine scans every 30 seconds.
                  </td>
                </tr>
              ) : (
                sorted.map((item: any, idx: number) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ width: 75, paddingLeft: 20, paddingRight: 10, verticalAlign: 'top', paddingTop: 16 }}>
                      <span className={`badge ${idx === 0 ? 'badge-cyan' : idx === 1 ? 'badge-blue' : 'badge-gray'}`}>
                        P{idx + 1}
                      </span>
                    </td>
                    <td style={{ paddingLeft: 12, paddingRight: 20, verticalAlign: 'top', paddingTop: 16 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {item.title}
                      </div>
                      {item.summary && (
                        <div className="text-secondary" style={{ fontSize: 12, lineHeight: 1.45, opacity: 0.85, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {item.summary.length > 110 ? `${item.summary.slice(0, 110)}...` : item.summary}
                        </div>
                      )}
                    </td>
                    <td className="mono text-accent" style={{ width: 130, paddingLeft: 12, paddingRight: 16, verticalAlign: 'top', paddingTop: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {(item.editorialScore || item.priorityScore || item.score || 86).toFixed(1)} / 100
                    </td>
                    <td className="text-secondary" style={{ width: 130, paddingLeft: 12, paddingRight: 16, verticalAlign: 'top', paddingTop: 16, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.source || 'arXiv / RSS'}
                    </td>
                    <td className="mono text-muted" style={{ width: 110, paddingLeft: 12, paddingRight: 16, verticalAlign: 'top', paddingTop: 16, fontSize: 12, whiteSpace: 'nowrap' }}>
                      {item.discoveredAt ? new Date(item.discoveredAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td style={{ width: 90, paddingRight: 20, verticalAlign: 'top', paddingTop: 16 }}>
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
        <div style={{ padding: 7, borderRadius: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div className="t-h1 mono" style={{ color, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
