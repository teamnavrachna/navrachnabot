import { BrainCog, FileText, Repeat, Ban, TrendingUp, Clock } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';
import { timeAgo, formatDate } from '../lib/format';
import { domainGradient } from './PersonaAvatar';

export function MemoryPage({ ctrl }: { ctrl: AppController }) {
  const { state, now } = ctrl;
  const { memory, posts } = state;

  const weekAgo = now - 7 * 86400_000;
  const weekPosts = posts.filter((p) => p.publishedAt >= weekAgo);

  const topTags = Object.entries(memory.coveredTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const avoided = memory.avoidedTopicIds
    .map((id) => posts.find((p) => p.topicId === id))
    .filter(Boolean) as typeof posts;

  return (
    <div className="space-y-6 max-w-4xl pb-20 lg:pb-0">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-white tracking-tight">Memory Engine</h1>
        <p className="text-ink-400 text-sm mt-1">What the analyst remembers — preventing duplicates and tracking what it avoids.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={17} className="text-teal-400" />
            <h2 className="font-serif text-lg font-semibold text-white">Posts this week</h2>
            <span className="ml-auto text-xs text-ink-500 font-mono">{weekPosts.length}</span>
          </div>

          {weekPosts.length === 0 ? (
            <p className="text-ink-500 text-sm text-center py-8">No posts this week yet.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-ink-700" />
              <div className="space-y-4">
                {weekPosts.map((post) => (
                  <div key={post.id} className="relative pl-10">
                    <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full bg-gradient-to-br ${domainGradient(post.domain)} ring-4 ring-ink-900`} />
                    <div className="bg-ink-800/50 border border-ink-700/50 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-ink-500 text-xs">{formatDate(post.publishedAt)}</span>
                        <span className={`text-[10px] px-1.5 py-0 rounded bg-gradient-to-r ${domainGradient(post.domain)} text-white`}>{post.domain}</span>
                      </div>
                      <p className="text-white text-sm font-medium leading-snug">{post.title}</p>
                      <p className="text-ink-500 text-xs mt-1">{timeAgo(post.publishedAt, now)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side stats */}
        <div className="space-y-4">
          <MemoryStat icon={FileText} label="Topics covered" value={memory.coveredTopicIds.length} color="text-teal-400" />
          <MemoryStat icon={Ban} label="Intentionally avoided" value={avoided.length} color="text-rose-400" />
          <MemoryStat icon={Repeat} label="Duplicates prevented" value={memory.coveredTopicIds.length} color="text-amber-400" />
        </div>
      </div>

      {/* Most discussed tags */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={17} className="text-amber-400" />
          <h2 className="font-serif text-lg font-semibold text-white">Most discussed topics</h2>
        </div>
        {topTags.length === 0 ? (
          <p className="text-ink-500 text-sm text-center py-6">No topic history yet.</p>
        ) : (
          <div className="space-y-2.5">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center gap-3">
                <span className="text-sm text-ink-200 w-32 shrink-0">{tag}</span>
                <div className="flex-1 h-6 bg-ink-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500/40 to-amber-400/40 rounded-lg flex items-center px-2"
                    style={{ width: `${Math.min(100, (count / topTags[0][1]) * 100)}%` }}
                  >
                    <span className="text-xs text-white font-mono">{count}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avoided topics */}
      {avoided.length > 0 && (
        <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ban size={17} className="text-rose-400" />
            <h2 className="font-serif text-lg font-semibold text-white">Topics intentionally avoided</h2>
          </div>
          <div className="space-y-2">
            {avoided.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                <Ban size={14} className="text-rose-400 shrink-0" />
                <span className="text-ink-300 text-sm flex-1 truncate">{p.title}</span>
                <span className="text-rose-400/70 text-xs">Marked "not interested"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engine status */}
      <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <BrainCog size={17} className="text-slate-400" />
          <h2 className="font-serif text-lg font-semibold text-white">Memory engine status</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <StatusItem label="Covered topic IDs" value={`${memory.coveredTopicIds.length} stored`} />
          <StatusItem label="Tag frequency map" value={`${Object.keys(memory.coveredTagCounts).length} tags tracked`} />
          <StatusItem label="Avoided list" value={`${memory.avoidedTopicIds.length} entries`} />
        </div>
      </div>
    </div>
  );
}

function MemoryStat({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number; color: string }) {
  return (
    <div className="bg-ink-900 border border-ink-800 rounded-xl p-4">
      <Icon size={18} className={color} />
      <p className="text-2xl font-semibold text-white mt-2 font-mono">{value}</p>
      <p className="text-ink-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="text-ink-200 text-sm mt-0.5">{value}</p>
    </div>
  );
}
