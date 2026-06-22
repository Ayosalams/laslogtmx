import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DetentionClaimDraft, DetentionElapsed, DetentionFacility, DetentionSession } from '../types';
import {
  STORAGE_KEY,
  DEFAULT_FREE_MINUTES,
  buildDetentionClaimDraft,
  computeElapsed,
} from '../utils/detentionUtils';

export function useDetentionTimer() {
  const [session, setSession] = useState<DetentionSession | null>(null);
  const [elapsed, setElapsed] = useState<DetentionElapsed | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshElapsed = useCallback((active: DetentionSession | null) => {
    setElapsed(active ? computeElapsed(active) : null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        const parsed = raw ? (JSON.parse(raw) as DetentionSession) : null;
        setSession(parsed);
        refreshElapsed(parsed);
      } catch {
        if (mounted) {
          setSession(null);
          setElapsed(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshElapsed]);

  useEffect(() => {
    if (!session) return;
    const tick = () => refreshElapsed(session);
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [session, refreshElapsed]);

  const persist = useCallback(
    async (next: DetentionSession | null) => {
      if (next) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
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
      await persist(next);
      return { error: null };
    },
    [persist]
  );

  const stopTimer = useCallback(async () => {
    await persist(null);
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