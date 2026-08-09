import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, Persona, WeeklyDigest, Post, ScoredTopic, ScanResult } from '../types';
import { applyFeedback, generateDigest, initialState, runScan, publishNextFromQueue, SCAN_INTERVAL } from '../lib/engine';

const STORAGE_KEY = 'personaai-state-v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.memory) return initialState();
    return {
      ...initialState(),
      ...parsed,
      approvedQueue: Array.isArray(parsed.approvedQueue) ? parsed.approvedQueue : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      scans: Array.isArray(parsed.scans) ? parsed.scans : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    };
  } catch {
    return initialState();
  }
}

function save(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function getScanIntervalSeconds(): number {
  try {
    const saved = localStorage.getItem('navrachna_scan_interval_min');
    if (saved) {
      const min = parseFloat(saved);
      return Math.max(10, Math.round(min * 60));
    }
  } catch { /* ignore */ }
  return 30;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);
  const [scanning, setScanning] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Use a ref for the CURRENT state so timer callbacks always read latest state
  const stateRef = useRef<AppState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [timerSeconds, setTimerSeconds] = useState(getScanIntervalSeconds);
  const timerMaxRef = useRef(getScanIntervalSeconds());

  // Track timer max so the interval callback can read it without stale closure
  useEffect(() => {
    timerMaxRef.current = getScanIntervalSeconds();
  });

  const scanLock = useRef(false);

  // ── Listen for settings changes ──
  useEffect(() => {
    const handler = () => {
      const newMax = getScanIntervalSeconds();
      timerMaxRef.current = newMax;
      setTimerSeconds(newMax);
    };
    window.addEventListener('navrachna_interval_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('navrachna_interval_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // ── Persist to localStorage whenever state changes ──
  useEffect(() => {
    save(state);
  }, [state]);

  // ── Clock ──
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Main autonomous timer ──
  // Every N seconds:
  //   • Run a full discovery scan → updates Topics Scanned / Approved / Rejected counters
  //   • runScan already publishes the top candidate and puts the rest in approvedQueue
  //   • If queue was empty AND no candidates pass threshold → runScan still runs but produces no post
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const max = timerMaxRef.current;
        const next = prev <= 1 ? max : prev - 1;

        if (prev <= 1 && !scanLock.current) {
          const current = stateRef.current;
          if (!current.persona) return max;

          scanLock.current = true;
          // Always run a real scan on the timer tick — this updates all counters
          const { newState } = runScan(current);
          stateRef.current = newState;
          setState(newState);
          scanLock.current = false;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // ← empty deps: reads live data via stateRef

  // ── On persona load: if feed is empty, run ONE initial scan to populate queue ──
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!state.persona) return;
    if (initializedRef.current) return;
    if (state.posts.length > 0 || (state.approvedQueue || []).length > 0) {
      initializedRef.current = true;
      return;
    }
    initializedRef.current = true;
    // Run a real scan once to populate approvedQueue, then publish the top item
    const { newState } = runScan(state);
    setState(newState);
    save(newState);
  }, [state.persona]);

  // ── Safe merge of backend queue items (does NOT wipe posts/queue) ──
  useEffect(() => {
    if (!state.persona) return;

    const pollBackend = async () => {
      try {
        const agentId = localStorage.getItem('navrachna_agent_id');
        if (!agentId) return;

        const queueRes = await fetch(`/api/agent/queue?agentId=${agentId}`).catch(() => null);
        if (!queueRes || !queueRes.ok) return;

        const queueData = await queueRes.json().catch(() => null);
        if (!queueData?.queue?.length) return;

        const queuedTopics: ScoredTopic[] = queueData.queue.map((q: any) => ({
          id: q.id || `q-${Math.random()}`,
          title: q.title,
          source: { name: q.source || 'Live Feed', url: 'https://arxiv.org' },
          domain: stateRef.current.persona!.domain,
          tags: [stateRef.current.persona!.domain, 'Approved Queue'],
          significance: q.priorityScore || 85,
          novelty: q.editorialScore || 80,
          publishedAt: q.discoveredAt ? new Date(q.discoveredAt).getTime() : Date.now(),
          score: q.priorityScore || 85,
          scoreBreakdown: { relevance: 92, significance: q.priorityScore || 85, novelty: q.editorialScore || 80, interestMatch: 85, memoryPenalty: 0, total: q.priorityScore || 85 },
          accepted: true,
          rejectReason: null,
        }));

        setState((s) => {
          const existingIds = new Set((s.approvedQueue || []).map((item) => item.id));
          const newItems = queuedTopics.filter(
            (item) => !existingIds.has(item.id) && !s.memory.coveredTopicIds.includes(item.id)
          );
          if (newItems.length === 0) return s;
          return {
            ...s,
            approvedQueue: [...(s.approvedQueue || []), ...newItems].sort((a, b) => b.score - a.score),
          };
        });
      } catch { /* ignore */ }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 5000);
    return () => clearInterval(interval);
  }, [state.persona]);

  // ── Callbacks ──

  const createPersona = useCallback((persona: Persona) => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
    initializedRef.current = false;
    const baseState: AppState = { ...initialState(), persona, posts: [], scans: [], approvedQueue: [], nextScanAt: Date.now() + 30000 };
    // Populate queue immediately via runScan
    const { newState } = runScan(baseState);
    initializedRef.current = true;
    stateRef.current = newState;
    setState(newState);
    save(newState);
  }, []);

  const updatePersona = useCallback((persona: Persona) => {
    initializedRef.current = false;
    setState((s) => {
      const baseState: AppState = { ...s, persona, posts: [], scans: [], approvedQueue: [] };
      const { newState } = runScan(baseState);
      initializedRef.current = true;
      stateRef.current = newState;
      save(newState);
      return newState;
    });
  }, []);

  // Manual "Publish Next" — dequeues from approvedQueue only, no scan
  const publishNext = useCallback(() => {
    if (scanLock.current) return;
    const current = stateRef.current;
    if (!current.persona) return;

    const queue = current.approvedQueue || [];
    const validQueue = queue.filter(
      (item) =>
        !current.memory.coveredTopicIds.includes(item.id) &&
        !current.posts.some(
          (p) => p.topicId === item.id ||
            p.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        )
    );

    if (validQueue.length === 0) return; // nothing to publish

    scanLock.current = true;
    setScanning(true);
    const { newState } = publishNextFromQueue(current);
    stateRef.current = newState;
    setState(newState);
    save(newState);
    setScanning(false);
    scanLock.current = false;
  }, []);

  const triggerScanNow = useCallback(() => {
    if (scanLock.current) return;
    const current = stateRef.current;
    if (!current.persona) return;
    scanLock.current = true;
    setScanning(true);
    const { newState } = runScan(current);
    stateRef.current = newState;
    setState(newState);
    save(newState);
    setScanning(false);
    scanLock.current = false;
  }, []);

  const giveFeedback = useCallback((postId: string, feedback: 'liked' | 'disliked' | 'more') => {
    setState((s) => applyFeedback(s, postId, feedback));
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setState((s) => {
      const exists = s.bookmarks.includes(postId);
      return { ...s, bookmarks: exists ? s.bookmarks.filter((id) => id !== postId) : [...s.bookmarks, postId] };
    });
  }, []);

  const buildDigest = useCallback(() => {
    setState((s) => ({ ...s, digest: generateDigest(s), lastDigestAt: Date.now() }));
  }, []);

  const resetAll = useCallback(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
    setState(initialState());
    window.location.href = window.location.origin + window.location.pathname;
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
    publishNext,
    resetAll,
  };
}

export type AppController = ReturnType<typeof useAppState>;
