import { useMemo } from 'react';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { useNotificationSettings } from '../../../packages/shared/src/notifications/useNotificationSettings';
import { hasActiveMatchPreferences } from '../utils/matchLoadPreferences';

/**
 * Load-match-specific wrapper over notification settings.
 * Respects company isolation via useNotificationSettings RLS.
 */
export function useLoadMatchPreferences() {
  const { user, profile } = useAuth();
  const notificationSettings = useNotificationSettings(user?.id, profile?.company_id);

  const hasPreferences = useMemo(() => {
    if (!notificationSettings.settings) return false;
    return hasActiveMatchPreferences(notificationSettings.settings);
  }, [notificationSettings.settings]);

  const loadMatchEnabled = notificationSettings.settings?.enabled_types.load_match ?? true;

  return {
    ...notificationSettings,
    hasPreferences,
    loadMatchEnabled,
  };
}