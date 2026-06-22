import { useCallback, useEffect, useState } from 'react';
import type { DetentionClaimDraft, DetentionElapsed, DetentionFacility, DetentionSession } from '../types';
import {
  STORAGE_KEY,
  DEFAULT_FREE_MINUTES,
  buildDetentionClaimDraft,
  computeElapsed,
} from '../utils/detentionUtils';

function readSession(): DetentionSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DetentionSession) : null;
  } catch {
    return null;
  }
}

function writeSession(next: DetentionSession | null): void {
  if (typeof window === 'undefined') return;
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useDetentionTimerWeb() {
  const [session, setSession] = useState<DetentionSession | null>(null);
  const [elapsed, setElapsed] = useState<DetentionElapsed | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshElapsed = useCallback((active: DetentionSession | null) => {
    setElapsed(active ? computeElapsed(active) : null);
  }, []);

  useEffect(() => {
    const parsed = readSession();
    setSession(parsed);
    refreshElapsed(parsed);
    setLoading(false);
  }, [refreshElapsed]);

  useEffect(() => {
    if (!session) return;
    const tick = () => refreshElapsed(session);
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [session, refreshElapsed]);

  const persist = useCallback(
    (next: DetentionSession | null) => {
      writeSession(next);
      setSession(next);
      refreshElapsed(next);
    },
    [refreshElapsed]
  );

  const startTimer = useCallback(
    async (params: {
      loadNumber: string;
      loadId?: string | null;
      facility?: DetentionFacility;
      freeMinutes?: number;
    }) => {
      const trimmed = params.loadNumber.trim();
      if (!trimmed) return { error: 'Load number is required' };

      const next: DetentionSession = {
        loadId: params.loadId ?? null,
        loadNumber: trimmed,
        facility: params.facility ?? 'pickup',
        startedAt: new Date().toISOString(),
        freeMinutes: params.freeMinutes ?? DEFAULT_FREE_MINUTES,
      };
      persist(next);
      return { error: null };
    },
    [persist]
  );

  const stopTimer = useCallback(async () => {
    persist(null);
  }, [persist]);

  const buildClaimDraft = useCallback((): DetentionClaimDraft | null => {
    if (!session || !elapsed) return null;
    return buildDetentionClaimDraft(session, elapsed);
  }, [session, elapsed]);

  const detentionNotePrefix = session
    ? `Load ${session.loadNumber} • ${session.facility} detention`
    : null;

  return {
    session,
    elapsed,
    loading,
    isActive: !!session,
    startTimer,
    stopTimer,
    buildClaimDraft,
    detentionNotePrefix,
  };
}