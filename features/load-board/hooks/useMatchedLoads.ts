import { useMemo } from 'react';
import type { LoadMatchReason } from '../../../packages/shared/src/notifications/types';
import type { BoardLoad } from '../types';
import { matchLoadToPreferences } from '../utils/matchLoadPreferences';
import { useLoadMatchPreferences } from './useLoadMatchPreferences';

export type LoadMatchMap = Record<string, LoadMatchReason[]>;

/**
 * Scores board loads against the current user's smart match preferences.
 */
export function useMatchedLoads(loads: BoardLoad[]) {
  const { settings, loadMatchEnabled, hasPreferences } = useLoadMatchPreferences();

  const matchMap = useMemo<LoadMatchMap>(() => {
    if (!settings || !loadMatchEnabled || !hasPreferences) return {};

    const map: LoadMatchMap = {};
    for (const load of loads) {
      const result = matchLoadToPreferences(load, settings);
      if (result.matched) {
        map[load.id] = result.reasons;
      }
    }
    return map;
  }, [loads, settings, loadMatchEnabled, hasPreferences]);

  const matchedLoads = useMemo(
    () => loads.filter((l) => (matchMap[l.id]?.length ?? 0) > 0),
    [loads, matchMap]
  );

  return {
    matchMap,
    matchedLoads,
    matchCount: matchedLoads.length,
    hasPreferences,
    loadMatchEnabled,
  };
}