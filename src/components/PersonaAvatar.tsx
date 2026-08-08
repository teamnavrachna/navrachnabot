import type { Persona } from '../types';

const DOMAIN_GRADIENTS: Record<string, string> = {
  'AI Security': 'from-rose-500 to-orange-500',
  'Machine Learning': 'from-teal-400 to-cyan-500',
  'Robotics': 'from-amber-400 to-orange-500',
  'AI Products': 'from-slate-400 to-teal-500',
  'AI Research': 'from-slate-400 to-cyan-500',
  'AI Ethics & Policy': 'from-emerald-400 to-teal-500',
};

export function domainGradient(domain: string): string {
  return DOMAIN_GRADIENTS[domain] ?? 'from-teal-400 to-slate-500';
}

export function personaInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PersonaAvatar({ persona, size = 40 }: { persona: Persona; size?: number }) {
  const grad = domainGradient(persona.domain);
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white shadow-lg shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {personaInitials(persona.name)}
    </div>
  );
}
