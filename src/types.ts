export type Domain =
  | 'AI Security'
  | 'Machine Learning'
  | 'Robotics'
  | 'AI Products'
  | 'AI Research'
  | 'AI Ethics & Policy';

export type WritingStyle = 'Analytical' | 'Conversational' | 'Bold & Opinionated' | 'Technical';

export interface Persona {
  name: string;
  domain: Domain;
  writingStyle: WritingStyle;
  interests: string[];
  avatarHue: number;
  createdAt: number;
}

export interface Source {
  name: string;
  url: string;
}

export interface RawTopic {
  id: string;
  title: string;
  source: Source;
  domain: Domain;
  tags: string[];
  significance: number;
  novelty: number;
  publishedAt: number;
}

export interface ScoredTopic extends RawTopic {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  accepted: boolean;
  rejectReason: string | null;
}

export interface ScoreBreakdown {
    relevance: number;
    significance: number;
    novelty: number;
    interestMatch: number;
    memoryPenalty: number;
    total: number;
}

export interface Post {
  id: string;
  topicId: string;
  title: string;
  domain: Domain;
  tags: string[];
  whatHappened: string;
  whyItMatters: string;
  whatCouldHappenNext: string;
  aiInsight: string;
  rationale: Rationale;
  sources: Source[];
  publishedAt: number;
  feedback: 'liked' | 'disliked' | 'more' | null;
}

export interface Rationale {
  whySelected: string;
  whyRelevantNow: string;
  selectedScore: number;
  candidatesConsidered: number;
  rejectedCount: number;
}

export interface ScanResult {
  id: string;
  startedAt: number;
  completedAt: number;
  found: number;
  rejected: number;
  selectedTopicId: string | null;
  scored: ScoredTopic[];
  resultingPostId: string | null;
}

export interface Memory {
  coveredTopicIds: string[];
  coveredTagCounts: Record<string, number>;
  avoidedTopicIds: string[];
  feedbackWeights: Record<string, number>;
}

export type AppState = {
  persona: Persona | null;
  posts: Post[];
  scans: ScanResult[];
  approvedQueue: ScoredTopic[];
  memory: Memory;
  lastScanAt: number | null;
  nextScanAt: number;
  interestProfile: Record<string, number>;
  digest: WeeklyDigest | null;
  lastDigestAt: number | null;
  bookmarks: string[];
};

export interface WeeklyDigest {
  generatedAt: number;
  topStories: { title: string; domain: Domain; summary: string }[];
  biggestTrend: string;
  bestOpenSource: string;
  topResearch: string;
  weekSummary: string;
  postsThisWeek: number;
}
