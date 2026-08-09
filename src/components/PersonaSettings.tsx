import { useState } from 'react';
import { Check, Save, Sparkles, Shield, Brain, Bot, FlaskConical, Scale, Sliders, Clock, CheckCircle2, User, Radio, RotateCcw } from 'lucide-react';
import type { Domain, WritingStyle } from '../types';
import { DOMAINS, WRITING_STYLES } from '../data/presets';
import type { AppController } from '../hooks/useAppState';

const DOMAIN_ICONS: Record<Domain, typeof Brain> = {
  'AI Security': Shield,
  'Machine Learning': Brain,
  'Robotics': Bot,
  'AI Products': Sparkles,
  'AI Research': FlaskConical,
  'AI Ethics & Policy': Scale,
};

const WRITING_STYLE_DESCS: Record<WritingStyle, string> = {
  'Analytical': 'Data-driven, precise evaluation with structured takeaways.',
  'Conversational': 'Accessible, engaging, and breakdown-oriented.',
  'Bold & Opinionated': 'Strong perspectives with direct industrial projections.',
  'Technical': 'Deep-dive architectural focus for engineers and researchers.',
};

const INTERVAL_PRESETS = [
  { label: '30s', value: 0.5 },
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

export function PersonaSettings({ ctrl }: { ctrl: AppController }) {
  const { state, updatePersona } = ctrl;
  const persona = state.persona!;

  const [name, setName] = useState(persona.name || 'Navarachna');
  const [domain, setDomain] = useState<Domain>(persona.domain);
  const [style, setStyle] = useState<WritingStyle>(persona.writingStyle);

  const [scanInterval, setScanInterval] = useState<number>(() => {
    const s = localStorage.getItem('navarachna_scan_interval_min');
    return s ? parseFloat(s) : 30;
  });

  const [signalScore, setSignalScore] = useState<number>(() => {
    const s = localStorage.getItem('navarachna_signal_score_threshold');
    return s ? parseInt(s) : 75;
  });

  const [saved, setSaved] = useState(false);
  const domainChanged = domain !== persona.domain;

  const save = () => {
    localStorage.setItem('navarachna_scan_interval_min', String(scanInterval));
    localStorage.setItem('navarachna_signal_score_threshold', String(signalScore));

    window.dispatchEvent(new Event('navarachna_interval_changed'));
    updatePersona({ ...persona, name: name.trim(), domain, writingStyle: style });

    setSaved(true);
    if (domainChanged) {
      setTimeout(() => window.location.reload(), 600);
    } else {
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const intervalIdx = INTERVAL_PRESETS.findIndex((p) => p.value === scanInterval);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-in">
      
      {/* Page Header */}
      <div className="animate-slide-up">
        <h1 className="t-h1 text-primary">Platform Settings &amp; Parameters</h1>
        <p className="t-body text-secondary" style={{ marginTop: 6 }}>
          Configure autonomous agent identity, continuous execution interval, and editorial threshold parameters.
        </p>
      </div>

      {/* Card 1: Identity & Persona */}
      <div className="card animate-slide-up" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
            <User size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="t-h3 text-primary">Agent Identity &amp; Persona</h3>
            <span className="t-caption">Personalize the AI analyst name and target domain</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <label className="t-caption" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>ANALYST NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field focus-accent"
              style={{ padding: '11px 14px', fontSize: 14, borderRadius: 10 }}
              placeholder="e.g. Nova, Atlas, Cipher..."
            />
          </div>

          <div>
            <label className="t-caption" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>TARGET DOMAIN</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="field focus-accent"
              style={{ padding: '11px 14px', fontSize: 14, borderRadius: 10, cursor: 'pointer' }}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Writing Voice & Tone — Outlined Button Grid */}
        <div style={{ marginTop: 28 }}>
          <label className="t-caption" style={{ display: 'block', marginBottom: 12, fontWeight: 600 }}>
            WRITING VOICE &amp; TONE
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }} className="grid-cols-2 md:grid-cols-4">
            {WRITING_STYLES.map((s) => {
              const active = style === s;
              return (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    textAlign: 'left',
                    background: active ? 'var(--accent-soft)' : 'var(--bg-inset)',
                    border: active ? '1.5px solid var(--accent)' : '1px solid var(--border-default)',
                    boxShadow: active ? '0 0 16px -4px rgba(34,211,238,0.25)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.2, 0, 0, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="hover:border-accent hover:-translate-y-0.5"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {s}
                    </span>
                    {active ? (
                      <CheckCircle2 size={16} className="text-accent" />
                    ) : (
                      <Radio size={14} className="text-muted" />
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: active ? 'var(--text-secondary)' : 'var(--text-tertiary)', lineHeight: 1.45 }}>
                    {WRITING_STYLE_DESCS[s]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 2: Autonomous Frequency */}
      <div className="card animate-slide-up" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'var(--highlight-soft)', border: '1px solid var(--highlight-border)' }}>
            <Clock size={18} className="text-highlight" />
          </div>
          <div>
            <h3 className="t-h3 text-primary">Autonomous Execution Loop Interval</h3>
            <span className="t-caption">Frequency of RSS discovery scans and candidate evaluations</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <p className="t-body text-secondary" style={{ fontSize: 14, maxWidth: 600 }}>
            Frequency at which the continuous discovery loop scans RSS feeds, checks memory, and evaluates candidates.
          </p>
          <span className="badge badge-blue mono" style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8 }}>
            {scanInterval < 1 ? `${Math.round(scanInterval * 60)}s` : `${scanInterval}m`}
          </span>
        </div>

        {/* Range Slider Container */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-inset)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <input
            type="range"
            min={0}
            max={INTERVAL_PRESETS.length - 1}
            step={1}
            value={intervalIdx !== -1 ? intervalIdx : 0}
            onChange={(e) => {
              const val = INTERVAL_PRESETS[parseInt(e.target.value)].value;
              setScanInterval(val);
              localStorage.setItem('navarachna_scan_interval_min', String(val));
              window.dispatchEvent(new Event('navarachna_interval_changed'));
            }}
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: 6 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            {INTERVAL_PRESETS.map((p) => (
              <span
                key={p.label}
                className={`mono ${scanInterval === p.value ? 'text-accent font-bold' : 'text-muted'}`}
                style={{ fontSize: 12, transition: 'all 0.15s' }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Editorial Quality Threshold */}
      <div className="card animate-slide-up" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'var(--warning-soft)', border: '1px solid var(--warning-border)' }}>
            <Sliders size={18} className="text-warning" />
          </div>
          <div>
            <h3 className="t-h3 text-primary">Editorial Quality Signal Threshold</h3>
            <span className="t-caption">Minimum composite score required for topic approval</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <p className="t-body text-secondary" style={{ fontSize: 14, maxWidth: 600 }}>
            Candidate topics scoring below this threshold will be automatically rejected. Higher scores increase strictness.
          </p>
          <span className="badge badge-yellow mono" style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8 }}>
            {signalScore} / 100
          </span>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--bg-inset)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={signalScore}
            onChange={(e) => setSignalScore(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--warning)', cursor: 'pointer', height: 6 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }} className="mono t-caption">
            <span className={signalScore === 50 ? 'text-warning font-bold' : ''}>50 (Broad)</span>
            <span className={signalScore === 65 ? 'text-warning font-bold' : ''}>65</span>
            <span className={signalScore === 75 ? 'text-warning font-bold' : ''}>75 (Balanced)</span>
            <span className={signalScore === 85 ? 'text-warning font-bold' : ''}>85</span>
            <span className={signalScore === 95 ? 'text-warning font-bold' : ''}>95 (Strict)</span>
          </div>
        </div>
      </div>

      {/* Card 4: Domain Grid Selector — Outlined Cards */}
      <div className="card animate-slide-up" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: 8, borderRadius: 10, background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
            <Brain size={18} className="text-success" />
          </div>
          <div>
            <h3 className="t-h3 text-primary">Domain Focus Area</h3>
            <span className="t-caption">Target research and publication domain for the agent</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICONS[d];
            const active = domain === d;
            return (
              <button
                key={d}
                onClick={() => setDomain(d)}
                style={{
                  padding: '16px 18px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  background: active ? 'var(--accent-soft)' : 'var(--bg-inset)',
                  border: active ? '1.5px solid var(--accent)' : '1px solid var(--border-default)',
                  boxShadow: active ? '0 0 16px -4px rgba(34,211,238,0.25)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.2, 0, 0, 1)',
                  cursor: 'pointer',
                }}
                className="hover:border-accent hover:-translate-y-0.5"
              >
                <div style={{ padding: 8, borderRadius: 8, background: active ? 'var(--accent-soft)' : 'var(--bg-inset)' }}>
                  <Icon size={18} className={active ? 'text-accent' : 'text-muted'} />
                </div>
                <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {d}
                </span>
                {active && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle2 size={18} className="text-accent" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }} className="animate-slide-up">
        <button
          onClick={save}
          className="btn btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 12,
            boxShadow: '0 0 20px -4px rgba(34,211,238,0.3)',
          }}
        >
          {saved ? (
            domainChanged ? <><Check size={16} /> Reloading Agent Session...</> : <><Check size={16} /> Parameters Saved</>
          ) : (
            <><Save size={16} /> Save Configuration</>
          )}
        </button>

        {saved && !domainChanged && (
          <span className="t-body text-success animate-fade-in" style={{ fontSize: 14, fontWeight: 500 }}>
            ✓ All settings persisted dynamically
          </span>
        )}
        {saved && domainChanged && (
          <span className="t-body text-warning animate-fade-in" style={{ fontSize: 14, fontWeight: 500 }}>
            ⚡ Domain updated — restarting session...
          </span>
        )}
      </div>

      {/* Danger Zone: Reset Agent Session */}
      <div className="card animate-slide-up" style={{ padding: 28, border: '1px solid rgba(239, 68, 68, 0.30)', background: 'rgba(239, 68, 68, 0.04)', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 className="t-h3 text-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              <RotateCcw size={18} /> Reset Agent Session
            </h3>
            <p className="t-body text-secondary" style={{ fontSize: 13, marginTop: 4, maxWidth: 550 }}>
              Wipes all local state, candidate memory records, published feed briefings, and agent configuration. Returns immediately to Onboarding setup.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the agent session? Everything will be deleted and reset to the beginning.')) {
                ctrl.resetAll();
              }
            }}
            className="btn"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset Everything &amp; Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
