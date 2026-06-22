import type { LoadMatchReason, NotificationSettings } from '../../../packages/shared/src/notifications/types';
import type { BoardLoad } from '../types';

export interface LoadMatchResult {
  matched: boolean;
  reasons: LoadMatchReason[];
}

function containsCity(location: string | null, city: string): boolean {
  if (!location) return false;
  return location.toLowerCase().includes(city.toLowerCase());
}

/**
 * Client-side mirror of DB load_matches_preferences for UI badges and filtering.
 */
export function matchLoadToPreferences(
  load: Pick<BoardLoad, 'origin' | 'destination' | 'rate_cents'>,
  prefs: Pick<
    NotificationSettings,
    'preferred_cities' | 'preferred_routes' | 'min_rate_cents' | 'rate_alert_enabled'
  >
): LoadMatchResult {
  const reasons: LoadMatchReason[] = [];

  for (const city of prefs.preferred_cities) {
    if (containsCity(load.origin, city) || containsCity(load.destination, city)) {
      reasons.push('city');
      break;
    }
  }

  for (const route of prefs.preferred_routes) {
    if (containsCity(load.origin, route.origin) && containsCity(load.destination, route.destination)) {
      reasons.push('route');
      break;
    }
  }

  if (
    prefs.rate_alert_enabled &&
    prefs.min_rate_cents != null &&
    (load.rate_cents ?? 0) >= prefs.min_rate_cents
  ) {
    reasons.push('rate');
  }

  return { matched: reasons.length > 0, reasons };
}

export function hasActiveMatchPreferences(
  prefs: Pick<
    NotificationSettings,
    'preferred_cities' | 'preferred_routes' | 'min_rate_cents' | 'rate_alert_enabled'
  >
): boolean {
  return (
    prefs.preferred_cities.length > 0 ||
    prefs.preferred_routes.length > 0 ||
    (prefs.rate_alert_enabled && prefs.min_rate_cents != null)
  );
}