import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, Persona, WeeklyDigest, Post, ScoredTopic, ScanResult } from '../types';
import { applyFeedback, generateDigest, initialState, runScan, SCAN_INTERVAL } from '../lib/engine';

const STORAGE_KEY = 'personaai-state-v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.memory) return initialState();
    return { ...initialState(), ...parsed };
  } catch {
    return initialState();
  }
}

function save(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);
  const [scanning, setScanning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const scanLock = useRef(false);
  const getScanIntervalSeconds = () => {
    const saved = localStorage.getItem('navarachna_scan_interval_min');
    if (saved) {
      const min = parseFloat(saved);
      return Math.max(10, Math.round(min * 60));
    }
    return 30; // default 30 seconds
  };

  const [timerSeconds, setTimerSeconds] = useState(getScanIntervalSeconds());

  // Dynamic autonomous countdown timer loop based on user configuration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          return getScanIntervalSeconds();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    save(state);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Autonomous publishing loop & Live Backend Polling
  useEffect(() => {
    if (!state.persona) return;

    const pollBackend = async () => {
      try {
        const agentId = localStorage.getItem('navarachna_agent_id');
        if (!agentId) {
          // Initialize agent on backend
          const initRes = await fetch('/api/agent/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ persona: state.persona })
          });
          const initData = await initRes.json();
          if (initData.agentId) {
            localStorage.setItem('navarachna_agent_id', initData.agentId);
          }
          return;
        }

        // Fetch Live Queue from Backend
        const queueRes = await fetch(`/api/agent/queue?agentId=${agentId}`);
        if (queueRes.ok) {
          const queueData = await queueRes.json();
          if (queueData.queue) {
            const queuedTopics: ScoredTopic[] = queueData.queue.map((q: any) => ({
              id: q.id || `q-${Math.random()}`,
              title: q.title,
              source: { name: q.source || 'Live Feed', url: 'https://arxiv.org' },
              domain: state.persona!.domain,
              tags: [state.persona!.domain, 'Approved Queue'],
              significance: q.priorityScore || 85,
              novelty: q.editorialScore || 80,
              publishedAt: q.discoveredAt ? new Date(q.discoveredAt).getTime() : Date.now(),
              score: q.priorityScore || 85,
              scoreBreakdown: {
                relevance: 92,
                significance: q.priorityScore || 85,
                novelty: q.editorialScore || 80,
                interestMatch: 85,
                memoryPenalty: 0,
                total: q.priorityScore || 85
              },
              accepted: true,
              rejectReason: null
            }));

            // Fetch Rejected Topics from Backend
            const decRes = await fetch(`/api/agent/decisions?agentId=${agentId}`);
            let rejectedTopics: ScoredTopic[] = [];
            if (decRes.ok) {
              const decData = await decRes.json();
              if (decData.rejectedTopics) {
                rejectedTopics = decData.rejectedTopics.map((r: any) => ({
                  id: `r-${Math.random()}`,
                  title: r.title,
                  source: { name: r.source || 'Scanned Source', url: '#' },
                  domain: state.persona!.domain,
                  tags: [state.persona!.domain, 'Rejected'],
                  significance: r.score || 40,
                  novelty: 30,
                  publishedAt: r.timestamp ? new Date(r.timestamp).getTime() : Date.now(),
                  score: r.score || 40,
                  scoreBreakdown: { relevance: 40, significance: 30, novelty: 30, interestMatch: 30, memoryPenalty: -20, total: r.score || 40 },
                  accepted: false,
                  rejectReason: r.reason || 'Below editorial quality threshold'
                }));
              }
            }

            const mockScan: ScanResult = {
              id: 'live-scan',
              startedAt: Date.now() - 30000,
              completedAt: Date.now(),
              found: queuedTopics.length + rejectedTopics.length,
              rejected: rejectedTopics.length,
              selectedTopicId: queuedTopics[0]?.id || null,
              scored: [...queuedTopics, ...rejectedTopics],
              resultingPostId: 'latest-post'
            };

            setState((s) => ({ ...s, scans: [mockScan] }));
          }
        }

        // Fetch Live Feed from Backend
        const feedRes = await fetch(`/api/agent/feed?agentId=${agentId}`);
        if (feedRes.status === 404) {
          localStorage.removeItem('navarachna_agent_id');
          return;
        }

        if (feedRes.ok) {
          const feedData = await feedRes.json();
          if (feedData.posts && feedData.posts.length > 0) {
            const apiPosts: Post[] = feedData.posts.map((p: any) => ({
              id: p.id,
              topicId: p.id,
              title: p.topicTitle || 'Autonomous Intelligence Update',
              domain: state.persona?.domain || 'Robotics',
              tags: [state.persona?.domain || 'Robotics', 'Live Feed', 'Autonomous'],
              whatHappened: p.text,
              whyItMatters: 'Strategic alignment with continuous discovery and editorial evaluation.',
              whatCouldHappenNext: 'Ongoing autonomous scanning will evaluate further candidate topics.',
              aiInsight: 'AI Insight: Real-time intelligence processing from live Web RSS/arXiv sources.',
              rationale: {
                whySelected: p.rationale || 'High composite score in continuous 30s discovery scan.',
                whyRelevantNow: 'Freshly published and evaluated.',
                selectedScore: 88,
                candidatesConsidered: 8,
                rejectedCount: 7
              },
              sources: (p.sources || ['https://arxiv.org']).map((url: string) => ({ name: 'Live Web Source', url })),
              publishedAt: p.createdAt ? new Date(p.createdAt).getTime() : Date.now(),
              feedback: null
            }));

            setState((s) => ({ ...s, posts: apiPosts }));
          }
        }
      } catch (e) {
        console.error('Backend poll error:', e);
      }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 3000);
    return () => clearInterval(interval);
  }, [state.persona]);

  const doScan = useCallback(() => {
    if (scanLock.current) return;
    if (!state.persona) return;
    scanLock.current = true;
    setScanning(true);
    const { newState } = runScan(state);
    setState(newState);
    setScanning(false);
    scanLock.current = false;
  }, [state]);

  const createPersona = useCallback((persona: Persona) => {
    localStorage.removeItem('navarachna_agent_id');
    setState((s) => ({ ...s, persona, posts: [], scans: [], nextScanAt: Date.now() + 6000 }));
  }, []);

  const updatePersona = useCallback((persona: Persona) => {
    if (state.persona && state.persona.domain !== persona.domain) {
      localStorage.removeItem('navarachna_agent_id');
    }
    setState((s) => ({ ...s, persona, posts: [] }));
  }, [state.persona]);

  const giveFeedback = useCallback((postId: string, feedback: 'liked' | 'disliked' | 'more') => {
    setState((s) => applyFeedback(s, postId, feedback));
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setState((s) => ({
      ...s,
      bookmarks: s.bookmarks.includes(postId)
        ? s.bookmarks.filter((id) => id !== postId)
        : [...s.bookmarks, postId],
    }));
  }, []);

  const buildDigest = useCallback(() => {
    setState((s) => {
      const digest = generateDigest(s);
      return { ...s, digest, lastDigestAt: Date.now() };
    });
  }, []);

  const triggerScanNow = useCallback(() => {
    if (!scanLock.current && state.persona) {
      scanLock.current = true;
      setScanning(true);
      const { newState } = runScan(state);
      setState(newState);
      setScanning(false);
      scanLock.current = false;
    }
  }, [state]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('navarachna_agent_id');
    setState(initialState());
    window.location.reload();
  }, []);

  const maxSec = getScanIntervalSeconds();
  const nextScanIn = timerSeconds * 1000;
  const scanProgress = (maxSec - timerSeconds) / maxSec;

  return {
    state,
    scanning,
    now,
    nextScanIn,
    scanProgress,
    createPersona,
    updatePersona,
    giveFeedback,
    toggleBookmark,
    buildDigest,
    triggerScanNow,
    resetAll,
  };
}

export type AppController = ReturnType<typeof useAppState>;
