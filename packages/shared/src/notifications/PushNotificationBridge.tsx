'use client';

import { useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNotificationSettings } from './useNotificationSettings';
import { usePushNotificationListener, LocalNotificationHandler } from './usePushNotificationListener';

interface PushNotificationBridgeProps {
  onLocalNotification: LocalNotificationHandler;
}

/**
 * Bridges Supabase realtime notification inserts to platform-local alerts
 * (Expo local notifications on mobile, browser Notification API on web).
 */
export function PushNotificationBridge({ onLocalNotification }: PushNotificationBridgeProps) {
  const { user, profile, hasCompany, loading } = useAuth();
  const { settings, loading: settingsLoading } = useNotificationSettings(
    user?.id,
    profile?.company_id
  );

  const handler = useCallback<LocalNotificationHandler>(
    (title, body, data) => {
      if (settings?.push_enabled !== false) {
        onLocalNotification(title, body, data);
      }
    },
    [onLocalNotification, settings?.push_enabled]
  );

  const ready = !loading && !settingsLoading && hasCompany && !!user?.id;

  usePushNotificationListener(
    ready ? user?.id : undefined,
    settings?.push_enabled ?? true,
    ready ? handler : undefined
  );

  return null;
}