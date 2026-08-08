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

  // Listen for setting changes to dynamically update countdown timer
  useEffect(() => {
    const handleIntervalChange = () => {
      const newInterval = getScanIntervalSeconds();
      setTimerSeconds(newInterval);
    };
    window.addEventListener('navarachna_interval_changed', handleIntervalChange);
    window.addEventListener('storage', handleIntervalChange);
    return () => {
      window.removeEventListener('navarachna_interval_changed', handleIntervalChange);
      window.removeEventListener('storage', handleIntervalChange);
    };
  }, []);

  // Dynamic autonomous countdown timer loop based on user configuration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        const currentMax = getScanIntervalSeconds();
        if (prev <= 1 || prev > currentMax) {
          if (!scanLock.current && state.persona) {
            scanLock.current = true;
            setTimeout(() => {
              setState((latestState) => {
                if (!latestState.persona) return latestState;
                const { newState } = runScan(latestState);
                return newState;
              });
              scanLock.current = false;
            }, 50);
          }
          return currentMax;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.persona]);

  useEffect(() => {
    save(state);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Autonomous publishing loop & Live Backend Polling (Safe fallback for Vercel)
  useEffect(() => {
    if (!state.persona) return;

    const pollBackend = async () => {
      try {
        const agentId = localStorage.getItem('navarachna_agent_id');
        if (!agentId) return;

        // Fetch Live Queue from Backend if available
        const queueRes = await fetch(`/api/agent/queue?agentId=${agentId}`).catch(() => null);
        if (queueRes && queueRes.ok) {
          const queueData = await queueRes.json().catch(() => null);
          if (queueData && queueData.queue && queueData.queue.length > 0) {
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

            const mockScan: ScanResult = {
              id: 'live-scan',
              startedAt: Date.now() - 30000,
              completedAt: Date.now(),
              found: queuedTopics.length,
              rejected: 0,
              selectedTopicId: queuedTopics[0]?.id || null,
              scored: queuedTopics,
              resultingPostId: 'latest-post'
            };

            setState((s) => ({ ...s, scans: [mockScan] }));
          }
        }
      } catch (e) {
        // Standalone Vercel deployment — native client engine handles discovery automatically
      }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 5000);
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
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* ignore */ }
    const fresh: AppState = {
      ...initialState(),
      persona,
      posts: [],
      scans: [],
      nextScanAt: Date.now() + 30000,
    };
    setState(fresh);
    save(fresh);
  }, []);

  const updatePersona = useCallback((persona: Persona) => {
    setState((s) => ({ ...s, persona, posts: [], scans: [] }));
  }, []);

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
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* ignore */ }
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
    resetAll,
  };
}

export type AppController = ReturnType<typeof useAppState>;
