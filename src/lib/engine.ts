import type {
  AppState,
  Memory,
  Persona,
  Post,
  RawTopic,
  Rationale,
  ScoreBreakdown,
  ScoredTopic,
  ScanResult,
  Source,
  WeeklyDigest,
  Domain,
} from '../types';
import { TOPIC_POOL } from '../data/topics';

export const SCAN_INTERVAL_MS = 30_000; // demo cadence

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function tagOverlap(topicTags: string[], interests: string[]): number {
  if (!interests.length) return 0.5;
  const hits = topicTags.filter((tg) => interests.includes(tg)).length;
  return Math.min(1, 0.3 + (hits / interests.length) * 0.7);
}

function interestBoost(tags: string[], profile: Record<string, number>): number {
  if (!tags.length) return 0;
  const w = tags.map((tg) => profile[tg] ?? 0);
  const avg = w.reduce((a, b) => a + b, 0) / w.length;
  return Math.max(-15, Math.min(20, avg * 10));
}

// ---------- Discovery ----------

export function discoverTopics(persona: Persona): RawTopic[] {
  const domainMatch = TOPIC_POOL.filter((tp) => tp.domain === persona.domain);
  const crossDomain = TOPIC_POOL.filter((tp) => tp.domain !== persona.domain);
  const pool = [...domainMatch, ...pick(crossDomain, 6)];
  return pick(pool, Math.min(12, pool.length)).sort((a, b) => b.publishedAt - a.publishedAt);
}

export function getAcceptThreshold(): number {
  try {
    const saved = localStorage.getItem('navrachna_signal_score_threshold');
    return saved ? parseInt(saved, 10) : 75;
  } catch {
    return 75;
  }
}

// ---------- Scoring ----------

export function scoreTopic(topic: RawTopic, state: AppState): ScoredTopic {
  const { persona, memory, interestProfile } = state;
  if (!persona) throw new Error('no persona');

  const threshold = getAcceptThreshold();

  const domainRelevance = topic.domain === persona.domain ? 25 : 12;
  const sigScore = Math.round((topic.significance / 100) * 30);
  const novScore = Math.round((topic.novelty / 100) * 25);
  const interestMatch = Math.round(tagOverlap(topic.tags, persona.interests) * 10);
  const memoryPenalty = memory.coveredTopicIds.includes(topic.id)
    ? -40
    : Object.entries(memory.coveredTagCounts)
        .filter(([tag, c]) => topic.tags.includes(tag) && c >= 2)
        .reduce((acc, [, c]) => acc - (c - 1) * 6, 0);
  const fbBoost = interestBoost(topic.tags, interestProfile);
  const ageHr = (Date.now() - topic.publishedAt) / 3600_000;
  const recency = Math.round(Math.max(0, 1 - ageHr / 72) * 10);

  const total = Math.max(0, Math.min(100, Math.round(
    domainRelevance + sigScore + novScore + interestMatch + recency + memoryPenalty + fbBoost
  )));

  const breakdown: ScoreBreakdown = {
    relevance: domainRelevance,
    significance: sigScore,
    novelty: novScore,
    interestMatch,
    memoryPenalty: memoryPenalty + recency,
    total,
  };

  let accepted = total >= threshold;
  let rejectReason: string | null = null;

  if (!accepted) {
    if (memory.coveredTopicIds.includes(topic.id)) rejectReason = 'Already covered — duplicate detected by memory engine';
    else if (topic.significance < 40) rejectReason = 'Low significance — not impactful enough for the audience';
    else if (topic.novelty < 30) rejectReason = 'Stale news — already widely reported';
    else if (domainRelevance < 15) rejectReason = `Off-domain — not relevant to ${persona.domain}`;
    else rejectReason = `Composite score (${total}/100) below active editorial threshold (${threshold}/100)`;
  }

  return { ...topic, score: total, scoreBreakdown: breakdown, accepted, rejectReason };
}

// ---------- Post writing ----------

const STYLE_LEADS: Record<Persona['writingStyle'], string> = {
  Analytical: 'The data points to a meaningful shift.',
  Conversational: "Here's what caught my attention today.",
  'Bold & Opinionated': 'This is the story that actually matters.',
  Technical: 'The technical implications deserve a closer look.',
};

function writeSection(topic: RawTopic, persona: Persona): { what: string; why: string; next: string; insight: string } {
  const lead = STYLE_LEADS[persona.writingStyle];
  const what = `${lead} ${topic.title}. According to ${topic.source.name}, the work ${topic.tags.slice(0, 2).join(' and ')} continues to advance rapidly, with the team reporting measurable improvements over prior baselines.`;

  const why = `For practitioners in ${persona.domain}, this matters because it directly addresses a known bottleneck. The significance score (${topic.significance}/100) reflects real-world impact potential, and the novelty (${topic.novelty}/100) indicates this is fresh rather than incremental. ${persona.interests.length ? `It aligns with your focus on ${persona.interests.slice(0, 2).join(' and ')}.` : ''}`;

  const next = `If this trajectory holds, expect ${topic.tags[0]?.toLowerCase() ?? 'this area'} to see a wave of follow-up work within 3-6 months. Teams that adopt early may gain a structural advantage, though validation and safety review remain essential before production deployment.`;

  const insight = `AI Insight: This may accelerate ${topic.domain.toLowerCase().replace(/ &.*/, '')} adoption by lowering the ${topic.tags[1]?.toLowerCase() ?? 'capability'} barrier — a pattern we have seen precede market shifts in adjacent fields.`;
  return { what, why, next, insight };
}

function buildRationale(topic: RawTopic, scored: ScoredTopic[], persona: Persona): Rationale {
  const rejectedCount = scored.filter((s) => !s.accepted).length;
  return {
    selectedScore: scored.find((s) => s.id === topic.id)?.score ?? 0,
    candidatesConsidered: scored.length,
    rejectedCount,
    whySelected: `Highest composite score in this scan (${scored.find((s) => s.id === topic.id)?.score}/100). Strong relevance to ${persona.domain} with high significance and novelty. Not present in memory — no duplicate risk.`,
    whyRelevantNow: `Published within the last 48 hours and gaining traction. ${persona.name} prioritizes timing so readers see analysis while the story is still developing.`,
  };
}

// ---------- Full scan ----------

export function runScan(state: AppState): { result: ScanResult; post: Post | null; newState: AppState } {
  if (!state.persona) throw new Error('no persona');

  const startedAt = Date.now();
  const discovered = discoverTopics(state.persona);
  const scored = discovered.map((tp) => scoreTopic(tp, state));
  const accepted = scored.filter((s) => s.accepted).sort((a, b) => b.score - a.score);
  const best = accepted[0] ?? null;

  let post: Post | null = null;
  let memory: Memory = state.memory;
  let posts = state.posts;
  let interestProfile = state.interestProfile;

  if (best) {
    const { what, why, next, insight } = writeSection(best, state.persona);
    const rationale = buildRationale(best, scored, state.persona);
    post = {
      id: uid('post'),
      topicId: best.id,
      title: best.title,
      domain: best.domain,
      tags: best.tags,
      whatHappened: what,
      whyItMatters: why,
      whatCouldHappenNext: next,
      aiInsight: insight,
      rationale,
      sources: [best.source],
      publishedAt: Date.now(),
      feedback: null,
    };
    posts = [post, ...state.posts];
    const tagCounts = { ...memory.coveredTagCounts };
    for (const tg of best.tags) tagCounts[tg] = (tagCounts[tg] ?? 0) + 1;
    memory = {
      ...memory,
      coveredTopicIds: [...memory.coveredTopicIds, best.id],
      coveredTagCounts: tagCounts,
    };
  }

  const completedAt = Date.now();
  const result: ScanResult = {
    id: uid('scan'),
    startedAt,
    completedAt,
    found: discovered.length,
    rejected: scored.filter((s) => !s.accepted).length,
    selectedTopicId: best?.id ?? null,
    scored,
    resultingPostId: post?.id ?? null,
  };

  return {
    result,
    post,
    newState: {
      ...state,
      posts,
      memory,
      interestProfile,
      scans: [result, ...state.scans],
      lastScanAt: completedAt,
      nextScanAt: completedAt + SCAN_INTERVAL_MS,
    },
  };
}

export const SCAN_INTERVAL = SCAN_INTERVAL_MS;

// ---------- Feedback learning ----------

export function applyFeedback(state: AppState, postId: string, feedback: 'liked' | 'disliked' | 'more'): AppState {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return state;
  const delta = feedback === 'disliked' ? -2 : feedback === 'liked' ? 1.5 : 2.5;
  const profile = { ...state.interestProfile };
  for (const tg of post.tags) profile[tg] = (profile[tg] ?? 0) + delta;

  const avoided = feedback === 'disliked' ? [...new Set([...state.memory.avoidedTopicIds, post.topicId])] : state.memory.avoidedTopicIds;

  return {
    ...state,
    interestProfile: profile,
    memory: { ...state.memory, avoidedTopicIds: avoided },
    posts: state.posts.map((p) => (p.id === postId ? { ...p, feedback } : p)),
  };
}

// ---------- Weekly digest ----------

export function generateDigest(state: AppState): WeeklyDigest {
  const weekAgo = Date.now() - 7 * 86400_000;
  const weekPosts = state.posts.filter((p) => p.publishedAt >= weekAgo);
  const tagCounts: Record<string, number> = {};
  for (const p of weekPosts) for (const tg of p.tags) tagCounts[tg] = (tagCounts[tg] ?? 0) + 1;
  const trend = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'steady model refinement';

  const topStories = weekPosts.slice(0, 5).map((p) => ({
    title: p.title,
    domain: p.domain,
    summary: p.whyItMatters.slice(0, 120),
  }));

  return {
    generatedAt: Date.now(),
    topStories: topStories.length ? topStories : [
      { title: 'No posts yet this week', domain: state.persona?.domain ?? 'AI Research', summary: 'The analyst is initializing. The first digest will populate after autonomous publishing begins.' },
    ],
    biggestTrend: `The week's dominant theme was ${trend}, with multiple stories reinforcing the same trajectory.`,
    bestOpenSource: 'Agent framework with native long-running task orchestration — the most starred new repo in the AI tooling category.',
    topResearch: 'Updated scaling laws suggesting a compute-optimal frontier at 10x current model size.',
    weekSummary: `${weekPosts.length} ${weekPosts.length === 1 ? 'story' : 'stories'} published. The analyst rejected ${state.scans.reduce((a, s) => a + s.rejected, 0)} candidates across ${state.scans.length} ${state.scans.length === 1 ? 'scan' : 'scans'}, demonstrating editorial selectivity.`,
    postsThisWeek: weekPosts.length,
  };
}

export function initialState(): AppState {
  return {
    persona: null,
    posts: [],
    scans: [],
    memory: { coveredTopicIds: [], coveredTagCounts: {}, avoidedTopicIds: [], feedbackWeights: {} },
    lastScanAt: null,
    nextScanAt: Date.now() + 8000,
    interestProfile: {},
    digest: null,
    lastDigestAt: null,
    bookmarks: [],
  };
}
