import { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Brain, Shield, Cpu, Bot, FlaskConical, Scale, Zap } from 'lucide-react';
import type { Domain, Persona, WritingStyle } from '../types';
import { DOMAINS, INTEREST_OPTIONS, WRITING_STYLES } from '../data/presets';
import { PersonaAvatar } from './PersonaAvatar';

const DOMAIN_ICONS: Record<Domain, typeof Brain> = {
  'AI Security': Shield,
  'Machine Learning': Brain,
  'Robotics': Bot,
  'AI Products': Sparkles,
  'AI Research': FlaskConical,
  'AI Ethics & Policy': Scale,
};

const DOMAIN_COLORS: Record<Domain, string> = {
  'AI Security': 'from-rose-500 to-orange-500',
  'Machine Learning': 'from-teal-400 to-cyan-500',
  'Robotics': 'from-amber-400 to-orange-500',
  'AI Products': 'from-slate-400 to-teal-500',
  'AI Research': 'from-slate-400 to-cyan-500',
  'AI Ethics & Policy': 'from-emerald-400 to-teal-500',
};

const STEP_LABELS = ['Identity', 'Domain', 'Voice', 'Focus'];

export function Onboarding({ onCreate }: { onCreate: (p: Persona) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<Domain | null>(null);
  const [style, setStyle] = useState<WritingStyle | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [hue] = useState(Math.floor(Math.random() * 360));

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const canFinish = name.trim() && domain && style && interests.length >= 2;

  const finish = () => {
    if (!canFinish || !domain || !style) return;
    onCreate({ name: name.trim(), domain, writingStyle: style, interests, avatarHue: hue, createdAt: Date.now() });
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-app)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 12px', fontFamily:'var(--font-sans)' }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#22D3EE 0%,#3B82F6 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px -4px rgba(34,211,238,0.4)' }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color:'white', letterSpacing:'0.1em' }}>NAVRACHNA</span>
          </div>
          <p style={{ fontSize:14, color:'var(--text-tertiary)', maxWidth:400, margin:'0 auto' }}>
            Autonomous Technology Intelligence Platform — configure your analyst to get started.
          </p>
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-default)', borderRadius:20, boxShadow:'var(--shadow-card)', overflow:'hidden' }} className="animate-slide-up">
          {/* Progress steps */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'20px 28px 0' }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ height:3, flex:1, borderRadius:9999, background: i <= step ? 'var(--accent)' : 'var(--border-subtle)', transition:'background 0.4s' }} />
                <span style={{ fontSize:10, fontWeight:600, fontFamily:'var(--font-mono)', whiteSpace:'nowrap', color: i <= step ? 'var(--accent)' : 'var(--text-muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div style={{ height:3, flex:1, borderRadius:9999, background: i < step ? 'var(--accent)' : 'var(--border-subtle)', transition:'background 0.4s' }} />}
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {step === 0 && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6, letterSpacing:'-0.02em' }}>Name your analyst</h2>
                <p style={{ fontSize:14, color:'var(--text-tertiary)', marginBottom:20 }}>Give your AI persona an identity. This is the byline readers will see on every post.</p>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
                  placeholder="e.g. Nova, Atlas, Cipher..."
                  className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-3.5 text-white text-lg placeholder:text-ink-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition"
                />
                {name.trim() && (
                  <div className="mt-4 flex items-center gap-3 p-3.5 bg-ink-800/50 rounded-xl border border-ink-700 animate-fade-in">
                    <PersonaAvatar persona={{ name, domain: 'AI Research', writingStyle: 'Analytical', interests: [], avatarHue: hue, createdAt: 0 }} size={48} />
                    <div>
                      <p className="text-white font-medium text-sm">{name.trim()}</p>
                      <p className="text-ink-500 text-xs">Your analyst's avatar — color adapts to domain</p>
                    </div>
                  </div>
                )}
                <NavButtons onBack={undefined} onNext={() => setStep(1)} nextDisabled={!name.trim()} />
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6, letterSpacing:'-0.02em' }}>Choose a domain</h2>
                <p style={{ fontSize:14, color:'var(--text-tertiary)', marginBottom:20 }}>What field will your analyst cover? This drives topic discovery and scoring.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOMAINS.map((d) => {
                    const Icon = DOMAIN_ICONS[d];
                    const active = domain === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDomain(d)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${active ? 'border-teal-400 bg-teal-500/10 scale-[1.02]' : 'border-ink-700 bg-ink-800/50 hover:border-ink-600 hover:scale-[1.01]'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${DOMAIN_COLORS[d]} ${active ? 'opacity-100' : 'opacity-50'} transition`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <span className={`font-medium text-sm ${active ? 'text-white' : 'text-ink-200'}`}>{d}</span>
                        {active && <Check size={16} className="text-teal-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!domain} />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6, letterSpacing:'-0.02em' }}>Writing style</h2>
                <p style={{ fontSize:14, color:'var(--text-tertiary)', marginBottom:20 }}>How should your analyst sound? This shapes every post's voice and tone.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WRITING_STYLES.map((s) => {
                    const active = style === s;
                    const desc = {
                      Analytical: 'Data-driven, measured, objective.',
                      Conversational: 'Warm, approachable, readable.',
                      'Bold & Opinionated': 'Direct, provocative, takes a stance.',
                      Technical: 'Precise, detailed, expert-level.',
                    }[s];
                    return (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`p-4 rounded-xl border text-left transition-all ${active ? 'border-teal-400 bg-teal-500/10 scale-[1.02]' : 'border-ink-700 bg-ink-800/50 hover:border-ink-600'}`}
                      >
                        <span className={`font-medium text-sm ${active ? 'text-white' : 'text-ink-200'}`}>{s}</span>
                        <p className="text-ink-500 text-xs mt-1">{desc}</p>
                      </button>
                    );
                  })}
                </div>
                <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!style} />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6, letterSpacing:'-0.02em' }}>Pick interests</h2>
                <p style={{ fontSize:14, color:'var(--text-tertiary)', marginBottom:20 }}>Select at least 2 topics. The analyst uses these to score relevance — and learns from your feedback over time.</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((i) => {
                    const active = interests.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleInterest(i)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${active ? 'border-teal-400 bg-teal-500/15 text-teal-300 scale-105' : 'border-ink-700 bg-ink-800/50 text-ink-300 hover:border-ink-600'}`}
                      >
                        {active && <Check size={13} className="inline mr-1 -mt-0.5" />}
                        {i}
                      </button>
                    );
                  })}
                </div>
                <p className="text-ink-500 text-xs mt-3">{interests.length} selected · minimum 2</p>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-ink-400 hover:text-white text-sm transition">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    disabled={!canFinish}
                    onClick={finish}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-ink-950 font-semibold text-sm hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-amber-500/30 glow-amber"
                  >
                    Launch analyst <Zap size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }: { onBack?: () => void; onNext: () => void; nextDisabled: boolean }) {
  return (
    <div className="mt-6 flex justify-between">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-ink-400 hover:text-white text-sm transition">
          <ArrowLeft size={16} /> Back
        </button>
      ) : <div />}
      <button
        disabled={nextDisabled}
        onClick={onNext}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-medium text-sm hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-teal-500/20"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}
