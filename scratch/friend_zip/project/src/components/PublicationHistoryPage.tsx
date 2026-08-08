import { History, ExternalLink, Calendar, Clock } from 'lucide-react';
import type { AppController } from '../hooks/useAppState';
import { timeAgo } from '../lib/format';

export function PublicationHistoryPage({ ctrl }: { ctrl: AppController }) {
  const { state, now } = ctrl;
  const posts = state.posts || [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 className="t-h1 c-primary">Publication History</h1>
        <p className="t-body c-secondary" style={{ marginTop: 6 }}>
          Historical archive of technology intelligence published autonomously by the platform.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Clock size={28} className="c-muted" style={{ margin: '0 auto 12px' }} />
          <p className="t-body c-tertiary mono">No historical publications recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post, idx) => (
            <div key={post.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-cyan">REPORT #{posts.length - idx}</span>
                  <span className="t-caption flex items-center gap-1">
                    <Calendar size={12} /> {timeAgo(post.publishedAt, now)}
                  </span>
                </div>
                <span className="badge badge-green">
                  SIGNAL SCORE: {post.rationale?.selectedScore || 88}/100
                </span>
              </div>

              <h2 className="t-h3 c-primary" style={{ marginBottom: 8 }}>
                {post.title}
              </h2>

              <p className="t-body c-secondary" style={{ fontSize: 14, marginBottom: 16 }}>
                {post.whatHappened}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: 12 }}>
                <span className="t-caption">Domain: <strong className="c-primary">{post.domain}</strong></span>
                {post.sources && post.sources[0] && (
                  <a
                    href={post.sources[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '2px 6px' }}
                  >
                    Source <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
