import { useState } from 'react';
import { Check, Save, Sparkles, Shield, Brain, Bot, FlaskConical, Scale, Sliders, Clock, Terminal, CheckCircle2 } from 'lucide-react';
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
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 className="t-h1 c-primary">Platform Settings &amp; Parameters</h1>
        <p className="t-body c-secondary" style={{ marginTop: 6 }}>
          Configure autonomous agent identity, continuous execution interval, and editorial threshold parameters.
        </p>
      </div>

      {/* Card 1: Identity & Persona */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <Sparkles size={18} className="c-accent" />
          <h3 className="t-h3 c-primary">Agent Identity &amp; Persona</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <label className="t-caption" style={{ display: 'block', marginBottom: 8 }}>ANALYST NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="e.g. Nova, Atlas, Cipher..."
            />
          </div>

          <div>
            <label className="t-caption" style={{ display: 'block', marginBottom: 8 }}>TARGET DOMAIN</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as Domain)}
              className="field"
              style={{ cursor: 'pointer' }}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <label className="t-caption" style={{ display: 'block', marginBottom: 10 }}>WRITING VOICE &amp; TONE</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {WRITING_STYLES.map((s) => {
              const active = style === s;
              return (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '12px 14px', justifyContent: 'center', textAlign: 'center' }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 2: Autonomous Frequency */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <Clock size={18} className="c-highlight" />
          <h3 className="t-h3 c-primary">Autonomous Execution Loop Interval</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="t-body c-secondary" style={{ fontSize: 14 }}>
            Frequency at which the continuous discovery loop scans RSS feeds, checks memory, and evaluates candidates.
          </p>
          <span className="badge badge-blue mono" style={{ fontSize: 13, padding: '4px 10px' }}>
            {scanInterval < 1 ? `${scanInterval * 60}s` : `${scanInterval}m`}
          </span>
        </div>

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
          style={{ width: '100%', accentColor: 'var(--highlight)', cursor: 'pointer', height: 6 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {INTERVAL_PRESETS.map((p) => (
            <span
              key={p.label}
              className={`mono ${scanInterval === p.value ? 'c-highlight' : 'c-muted'}`}
              style={{ fontSize: 11, fontWeight: scanInterval === p.value ? 700 : 400 }}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Card 3: Editorial Quality Threshold */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <Sliders size={18} className="c-warning" />
          <h3 className="t-h3 c-primary">Editorial Quality Signal Threshold</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="t-body c-secondary" style={{ fontSize: 14 }}>
            Candidate topics scoring below this threshold will be automatically rejected. Higher scores increase strictness.
          </p>
          <span className="badge badge-yellow mono" style={{ fontSize: 13, padding: '4px 10px' }}>
            {signalScore} / 100
          </span>
        </div>

        <input
          type="range"
          min={50}
          max={95}
          step={5}
          value={signalScore}
          onChange={(e) => setSignalScore(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--warning)', cursor: 'pointer', height: 6 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }} className="mono t-caption">
          <span>50 (Broad)</span>
          <span>65</span>
          <span>75 (Balanced)</span>
          <span>85</span>
          <span>95 (Strict)</span>
        </div>
      </div>

      {/* Card 4: Domain Grid Selector */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <Brain size={18} className="c-success" />
          <h3 className="t-h3 c-primary">Domain Focus Area</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICONS[d];
            const active = domain === d;
            return (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '14px 16px', justifyContent: 'flex-start', textAlign: 'left', borderRadius: 12 }}
              >
                <Icon size={16} className={active ? 'c-accent' : 'c-muted'} />
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{d}</span>
                {active && <CheckCircle2 size={16} className="c-accent" style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={save}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: 14, fontWeight: 600 }}
        >
          {saved ? (
            domainChanged ? <><Check size={16} /> Reloading Agent Session...</> : <><Check size={16} /> Parameters Saved</>
          ) : (
            <><Save size={16} /> Save Configuration</>
          )}
        </button>

        {saved && !domainChanged && (
          <span className="t-body c-success" style={{ fontSize: 14 }}>✓ All settings persisted dynamically</span>
        )}
        {saved && domainChanged && (
          <span className="t-body c-warning" style={{ fontSize: 14 }}>⚡ Domain updated — restarting session...</span>
        )}
      </div>
    </div>
  );
}
