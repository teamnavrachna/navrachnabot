import { useState } from 'react';
import { CheckCircle2, XCircle, Search, ChevronDown, TrendingUp } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';
import { timeAgo } from '../lib/format';
import { domainGradient } from './PersonaAvatar';

export function TopicReview({ ctrl }: { ctrl: AppController }) {
  const { state, now } = ctrl;
  const [tab, setTab] = useState<'accepted' | 'rejected'>('rejected');
  const [openId, setOpenId] = useState<string | null>(null);

  const allScored = state.scans.flatMap((s) => s.scored);
  const accepted = allScored.filter((s) => s.accepted).sort((a, b) => b.score - a.score);
  const rejected = allScored.filter((s) => !s.accepted).sort((a, b) => b.score - a.score);

  const list = tab === 'accepted' ? accepted : rejected;

  return (
    <div className="space-y-6 max-w-3xl pb-20 lg:pb-0">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-white tracking-tight">Topic Review</h1>
        <p className="text-ink-400 text-sm mt-1">Every candidate the analyst evaluated — and why it was accepted or rejected.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-900 border border-ink-800 rounded-xl w-fit">
        <TabButton active={tab === 'accepted'} onClick={() => setTab('accepted')} icon={CheckCircle2} label={`Accepted (${accepted.length})`} color="teal" />
        <TabButton active={tab === 'rejected'} onClick={() => setTab('rejected')} icon={XCircle} label={`Rejected (${rejected.length})`} color="amber" />
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-ink-500 text-sm">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          No {tab} topics yet. Run a scan to see editorial judgment in action.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((topic) => (
            <div key={topic.id} className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenId((o) => (o === topic.id ? null : topic.id))}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-ink-800/40 transition"
              >
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${topic.accepted ? 'bg-teal-500/15 text-teal-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {topic.accepted ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{topic.title}</p>
                  <p className="text-ink-500 text-xs mt-0.5">
                    <span className={`inline-block px-1.5 py-0 rounded text-[10px] bg-gradient-to-r ${domainGradient(topic.domain)} text-white mr-2`}>{topic.domain}</span>
                    {topic.source.name} · {timeAgo(topic.publishedAt, now)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono text-sm font-semibold ${topic.accepted ? 'text-teal-400' : 'text-amber-400'}`}>{topic.score}</span>
                  <p className="text-ink-600 text-[10px]">score</p>
                </div>
                <ChevronDown size={15} className={`text-ink-600 transition-transform shrink-0 ${openId === topic.id ? 'rotate-180' : ''}`} />
              </button>

              {openId === topic.id && (
                <div className="px-4 pb-4 animate-fade-in border-t border-ink-800 pt-3">
                  {topic.rejectReason && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-0.5">Rejection reason</p>
                      <p className="text-ink-300 text-sm">{topic.rejectReason}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <ScorePill label="Relevance" value={topic.scoreBreakdown.relevance} />
                    <ScorePill label="Significance" value={topic.scoreBreakdown.significance} />
                    <ScorePill label="Novelty" value={topic.scoreBreakdown.novelty} />
                    <ScorePill label="Interest match" value={topic.scoreBreakdown.interestMatch} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-ink-800 text-ink-400 border border-ink-700">{t}</span>
                    ))}
                  </div>
                  {topic.accepted && (
                    <p className="text-teal-400 text-xs mt-3 flex items-center gap-1.5">
                      <TrendingUp size={13} /> Passed the editorial quality threshold ({topic.score}/100) and was published.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, color }: { active: boolean; onClick: () => void; icon: typeof CheckCircle2; label: string; color: 'teal' | 'amber' }) {
  const activeBg = color === 'teal' ? 'bg-teal-500/15 text-teal-300' : 'bg-amber-500/15 text-amber-300';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${active ? activeBg : 'text-ink-400 hover:text-white'}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-800/60 rounded-lg p-2.5 text-center">
      <p className="font-mono text-sm font-semibold text-white">{value}</p>
      <p className="text-ink-500 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}
