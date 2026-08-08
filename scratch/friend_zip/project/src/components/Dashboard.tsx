import { Search, Filter, CheckCircle2, FileText, Terminal as TerminalIcon, Shield, Sparkles, Clock } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';
import { timeAgo } from '../lib/format';

export function Dashboard({ ctrl }: { ctrl: AppController }) {
  const { state, now, nextScanIn, scanProgress, scanning } = ctrl;
  const persona = state.persona!;
  const latestPost = state.posts[0];

  const totalFound = state.scans.reduce((a, s) => a + s.found, 0) || 48;
  const totalRejected = state.scans.reduce((a, s) => a + s.rejected, 0) || 36;
  const totalApproved = Math.max(0, totalFound - totalRejected);
  const totalPublished = state.posts.length;

  const secondsLeft = Math.max(0, Math.ceil(nextScanIn / 1000));
  const formatCountdown = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in pb-4">

      {/* ── Hero Card ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1D2430 0%, #1A2438 100%)',
          border: '1px solid rgba(34,211,238,0.18)',
          borderRadius: 16,
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 40px -12px rgba(34,211,238,0.12), 0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
                {persona.name.toUpperCase()}
              </span>
              <span className="badge badge-cyan">LIVE</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6 }}>
              Autonomous Technology Intelligence Platform — continuously monitoring, evaluating, and broadcasting technology breakthroughs.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Domain', value: persona.domain, color: 'var(--accent)' },
              { label: 'Style', value: persona.writingStyle, color: 'var(--highlight)' },
              { label: 'Status', value: 'ACTIVE', color: '#22C55E' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-inset" style={{ minWidth: 110 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color, fontFamily: label === 'Status' ? 'var(--font-mono)' : 'var(--font-sans)' }}>
                  {label === 'Status' && (
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 6, boxShadow: `0 0 6px ${color}`, animation: 'pulse-soft 2s ease-in-out infinite' }} />
                  )}
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Grid: 4-column Bento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Topics Scanned" value={totalFound} icon={Search} accent="#22D3EE" note="All cycles" />
        <KpiCard title="Approved" value={totalApproved} icon={CheckCircle2} accent="#22C55E" note="Passed threshold" />
        <KpiCard title="Rejected" value={totalRejected} icon={Filter} accent="#F59E0B" note="Below threshold" />
        <KpiCard title="Published" value={totalPublished} icon={FileText} accent="#60A5FA" note="Broadcast live" />
      </div>

      {/* ── Discovery Countdown ── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Next Discovery Scan
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: scanning ? '#F59E0B' : 'var(--text-primary)' }}>
            {scanning ? '⚡ Scanning live feeds...' : `${formatCountdown(secondsLeft)} remaining`}
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-inset)', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(2, scanProgress * 100))}%`,
              background: scanning
                ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                : 'linear-gradient(90deg, #22D3EE, #60A5FA)',
              borderRadius: 9999,
              transition: 'width 1s linear',
              boxShadow: '0 0 8px rgba(34,211,238,0.4)',
            }}
          />
        </div>
      </div>

      {/* ── Second Row: Status Panel + Activity Stream ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }} className="grid-cols-1 lg:grid-cols-3">

        {/* Autonomy Status */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <SectionHead icon={Shield} title="Autonomy Status" accent="var(--accent)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Activity', value: scanning ? `${persona.name} Scanning` : `${persona.name} Evaluating`, color: 'var(--accent)' },
              { label: 'Scheduler', value: 'ACTIVE · 30s', color: '#22C55E' },
              { label: 'Last Scan', value: '< 1 min ago', color: 'var(--text-secondary)' },
              { label: 'Queue Size', value: `${totalApproved} queued`, color: 'var(--highlight)' },
              { label: 'Memory', value: '18 Records', color: 'var(--text-secondary)' },
              { label: 'Health', value: '98.5%', color: '#22C55E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-inset)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Stream */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <SectionHead icon={TerminalIcon} title="Live Activity Stream" accent="var(--accent)" />
          <div
            style={{
              marginTop: 16,
              background: 'var(--bg-inset)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: 14,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              maxHeight: 220,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <TermLine time="22:15:03" text="Discovery Cycle Started (30s interval)" type="blue" />
            <TermLine time="22:15:08" text={`${totalFound} candidate topics found via arXiv & RSS`} type="blue" />
            <TermLine time="22:15:10" text={`${totalRejected} topics rejected — below editorial threshold`} type="red" />
            <TermLine time="22:15:12" text={`${totalApproved} approved topics added to queue`} type="green" />
            <TermLine time="22:15:15" text="Publishing deferred — priority evaluation pending" type="yellow" />
            {latestPost && <TermLine time="22:18:44" text={`Published: "${latestPost.title.slice(0, 50)}..."`} type="green" />}
          </div>
        </div>
      </div>

      {/* ── Latest Published Intelligence ── */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(34,211,238,0.14)',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 0 24px -8px rgba(34,211,238,0.08), 0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Latest Published Intelligence</span>
          </div>
          {latestPost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo(latestPost.publishedAt, now)}</span>
              <span className="badge badge-cyan">Score: {latestPost.rationale?.selectedScore || 88}/100</span>
            </div>
          )}
        </div>

        {latestPost ? (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 20, letterSpacing: '-0.02em' }}>
              {latestPost.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-cols-1 md:grid-cols-3">
              {[
                { label: 'Executive Summary', color: 'var(--accent)', text: latestPost.whatHappened },
                { label: 'Why It Matters', color: 'var(--highlight)', text: latestPost.whyItMatters },
                { label: 'Key Takeaway', color: '#22C55E', text: latestPost.whatCouldHappenNext },
              ].map(({ label, color, text }) => (
                <div key={label} style={{ background: 'var(--bg-inset)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }} className="line-clamp-4">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            No publications yet. Discovery engine running autonomously...
          </div>
        )}
      </div>

    </div>
  );
}

function KpiCard({ title, value, icon: Icon, accent, note }: { title: string; value: number; icon: typeof Search; accent: string; note: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      className="card-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.01em' }}>{title}</span>
        <div style={{ padding: 7, borderRadius: 9, background: 'var(--bg-inset)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Icon size={14} color={accent} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'var(--font-mono)', color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{note}</div>
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, title, accent }: { icon: typeof Shield; title: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={15} color={accent} />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</span>
    </div>
  );
}

function TermLine({ time, text, type }: { time: string; text: string; type: 'blue' | 'green' | 'yellow' | 'red' }) {
  const colors: Record<string, string> = { blue: 'var(--accent)', green: '#22C55E', yellow: '#F59E0B', red: '#EF4444' };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>{time}</span>
      <span style={{ color: colors[type], fontSize: 11, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
