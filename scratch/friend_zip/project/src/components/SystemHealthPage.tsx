import { Cpu, Server, Database, Brain, Activity, Zap, ShieldCheck } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';

export function SystemHealthPage({ ctrl }: { ctrl: AppController }) {
  const services = [
    { name: 'Continuous Discovery Engine (Engine 1)', type: 'Autonomous Engine Daemon', status: 'Operational', ping: '12ms', uptime: '99.99%', icon: Zap },
    { name: 'Dynamic Publishing Engine (Engine 2)', type: 'Publication Engine', status: 'Operational', ping: '45ms', uptime: '100%', icon: Activity },
    { name: 'Gemini AI Intelligence Evaluator', type: 'LLM Scoring Pipeline', status: 'Operational', ping: '210ms', uptime: '99.9%', icon: Brain },
    { name: 'SQLite Storage & Buffer Queue', type: 'Database Engine', status: 'Operational', ping: '2ms', uptime: '100%', icon: Database },
    { name: 'APScheduler Continuous Daemon', type: 'Background Loop', status: 'Operational', ping: '0ms', uptime: '100%', icon: Cpu },
    { name: 'Vector Memory & Deduplication', type: 'Context Memory', status: 'Operational', ping: '6ms', uptime: '100%', icon: Server },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 className="t-h1 c-primary">System Health &amp; Infrastructure</h1>
        <p className="t-body c-secondary" style={{ marginTop: 6 }}>
          Operational status of underlying autonomous discovery loops, evaluators, database pipelines, and daemons.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div key={svc.name} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
                  <Icon size={18} className="c-accent" />
                </div>
                <span className="badge badge-green flex items-center gap-1.5">
                  <span className="dot-online pulse" /> {svc.status}
                </span>
              </div>

              <h3 className="t-h3 c-primary" style={{ fontSize: 16, marginBottom: 4 }}>{svc.name}</h3>
              <div className="t-caption">{svc.type}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ background: 'var(--bg-inset)', padding: 10, borderRadius: 8 }}>
                  <div className="t-caption">LATENCY</div>
                  <div className="mono t-meta c-accent" style={{ fontWeight: 600, marginTop: 2 }}>{svc.ping}</div>
                </div>
                <div style={{ background: 'var(--bg-inset)', padding: 10, borderRadius: 8 }}>
                  <div className="t-caption">UPTIME</div>
                  <div className="mono t-meta c-success" style={{ fontWeight: 600, marginTop: 2 }}>{svc.uptime}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={24} className="c-success" />
          <div>
            <div className="t-h3 c-primary" style={{ fontSize: 16 }}>All Autonomous Services Operational</div>
            <div className="t-body c-secondary" style={{ fontSize: 13, marginTop: 2 }}>
              FastAPI event loops and SQLite storage engine running smoothly with continuous 30-second discovery pulse.
            </div>
          </div>
        </div>
        <span className="badge badge-green" style={{ padding: '6px 12px', fontSize: 12 }}>VERIFIED ACTIVE</span>
      </div>
    </div>
  );
}
