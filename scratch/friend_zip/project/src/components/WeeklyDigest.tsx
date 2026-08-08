import { FileText, TrendingUp, Code2, FlaskConical, Sparkles, RefreshCw, FileDown } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';
import { formatDate } from '../lib/format';

export function WeeklyDigest({ ctrl }: { ctrl: AppController }) {
  const { state, buildDigest } = ctrl;
  const digest = state.digest;

  return (
    <div className="space-y-6 max-w-3xl pb-20 lg:pb-0">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-white tracking-tight">Weekly Digest</h1>
          <p className="text-ink-400 text-sm mt-1">An automatically generated AI intelligence briefing.</p>
        </div>
        <button
          onClick={buildDigest}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white font-medium text-sm hover:bg-teal-400 transition shadow-lg shadow-teal-500/20"
        >
          <RefreshCw size={15} /> {digest ? 'Regenerate' : 'Generate digest'}
        </button>
      </div>

      {!digest ? (
        <div className="text-center py-16 text-ink-500 text-sm bg-ink-900 border border-ink-800 rounded-2xl">
          <FileText size={36} className="mx-auto mb-3 opacity-40" />
          No digest yet. Click "Generate digest" to create one from the analyst's recent activity.
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          {/* Header card */}
          <div className="bg-gradient-to-br from-ink-900 to-ink-800 border border-ink-700 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">AI Intelligence Briefing</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-white mb-1">The Week in AI</h2>
            <p className="text-ink-400 text-sm">{formatDate(digest.generatedAt)} · {digest.postsThisWeek} {digest.postsThisWeek === 1 ? 'story' : 'stories'} published</p>
          </div>

          {/* Week summary */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6">
            <h3 className="font-serif text-lg font-semibold text-white mb-2">Summary</h3>
            <p className="text-ink-300 text-sm leading-relaxed">{digest.weekSummary}</p>
          </div>

          {/* Biggest trend */}
          <HighlightCard icon={TrendingUp} color="text-teal-400" bg="bg-teal-500/10" border="border-teal-500/20" label="Biggest trend" content={digest.biggestTrend} />

          {/* Best open source */}
          <HighlightCard icon={Code2} color="text-slate-400" bg="bg-slate-500/10" border="border-slate-500/20" label="Best open-source project" content={digest.bestOpenSource} />

          {/* Top research */}
          <HighlightCard icon={FlaskConical} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" label="Most important research paper" content={digest.topResearch} />

          {/* Top stories */}
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6">
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Top 5 stories</h3>
            <div className="space-y-3">
              {digest.topStories.map((story, i) => (
                <div key={i} className="flex gap-3">
                  <span className="font-serif text-2xl font-semibold text-ink-700 w-8 shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{story.title}</p>
                    <p className="text-ink-500 text-xs mt-1 line-clamp-2">{story.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <button className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-teal-300 transition">
            <FileDown size={15} /> Save as PDF (coming soon)
          </button>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ icon: Icon, color, bg, border, label, content }: { icon: typeof TrendingUp; color: string; bg: string; border: string; label: string; content: string }) {
  return (
    <div className={`rounded-2xl p-6 border ${bg} ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={17} className={color} />
        <span className={`${color} text-xs font-semibold uppercase tracking-wide`}>{label}</span>
      </div>
      <p className="text-ink-200 text-sm leading-relaxed">{content}</p>
    </div>
  );
}
