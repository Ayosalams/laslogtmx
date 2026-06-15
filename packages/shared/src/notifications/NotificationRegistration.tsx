'use client';

import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNotificationSettings } from './useNotificationSettings';
import { usePushRegistration } from './usePushRegistration';

interface NotificationRegistrationProps {
  registerDevice?: () => Promise<{
    platform: 'expo' | 'web';
    token: string;
    endpoint?: string;
    p256dh?: string;
    auth_key?: string;
    device_label?: string;
  } | null>;
}

/**
 * Silently registers push token when user is authenticated with a company
 * and push notifications are enabled in their settings.
 * Platform-specific registerDevice is injected by mobile/web entry points.
 */
export function NotificationRegistration({ registerDevice }: NotificationRegistrationProps) {
  const { user, profile, hasCompany, loading } = useAuth();
  const { settings, loading: settingsLoading } = useNotificationSettings(
    user?.id,
    profile?.company_id
  );
  const { registerPush } = usePushRegistration(user?.id, profile?.company_id);

  useEffect(() => {
    if (
      loading ||
      settingsLoading ||
      !hasCompany ||
      !user?.id ||
      !profile?.company_id ||
      !registerDevice ||
      settings?.push_enabled === false
    ) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const payload = await registerDevice();
      if (cancelled || !payload) return;

      await registerPush({
        platform: payload.platform,
        token: payload.token,
        endpoint: payload.endpoint,
        p256dh: payload.p256dh,
        auth_key: payload.auth_key,
        device_label: payload.device_label,
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    settingsLoading,
    hasCompany,
    user?.id,
    profile?.company_id,
    settings?.push_enabled,
    registerDevice,
    registerPush,
  ]);

  return null;
}