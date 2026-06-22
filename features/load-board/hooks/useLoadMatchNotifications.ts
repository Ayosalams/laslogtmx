'use client';

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import type { NotificationRecord } from '../../../packages/shared/src/notifications/types';
import type { LocalNotificationHandler } from '../../../packages/shared/src/notifications/usePushNotificationListener';
import { useLoadMatchPreferences } from './useLoadMatchPreferences';

export interface LoadMatchAlert {
  id: string;
  title: string;
  body: string;
  loadId?: string;
  loadRef?: string;
  matchReason?: string;
  source?: string;
  createdAt: string;
}

function toLoadMatchAlert(record: NotificationRecord): LoadMatchAlert {
  const data = record.data ?? {};
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    loadId: typeof data.load_id === 'string' ? data.load_id : undefined,
    loadRef: typeof data.load_ref === 'string' ? data.load_ref : undefined,
    matchReason: typeof data.match_reason === 'string' ? data.match_reason : undefined,
    source: typeof data.source === 'string' ? data.source : undefined,
    createdAt: record.created_at,
  };
}

/**
 * Real-time listener for load_match notifications.
 * Surfaces in-app alerts and optional local push when preferences are active.
 */
export function useLoadMatchNotifications(onAlert?: LocalNotificationHandler) {
  const { user } = useAuth();
  const { settings, loadMatchEnabled, hasPreferences } = useLoadMatchPreferences();
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const handleInsert = useCallback((record: NotificationRecord) => {
    if (record.type !== 'load_match') return;
    const alert = toLoadMatchAlert(record);
    onAlertRef.current?.(alert.title, alert.body, {
      load_id: alert.loadId,
      load_ref: alert.loadRef,
      match_reason: alert.matchReason,
      source: alert.source,
    });
  }, []);

  useEffect(() => {
    if (!user?.id || !loadMatchEnabled || !hasPreferences) return;

    const channel = supabase
      .channel(`load-match:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          handleInsert(payload.new as NotificationRecord);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadMatchEnabled, hasPreferences, handleInsert]);

  return {
    enabled: loadMatchEnabled && hasPreferences,
    pushEnabled: settings?.push_enabled ?? true,
    settings,
  };
}