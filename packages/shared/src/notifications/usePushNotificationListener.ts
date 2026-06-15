'use client';

import { useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { NotificationRecord } from './types';

export type LocalNotificationHandler = (
  title: string,
  body: string,
  data?: Record<string, unknown>
) => void;

/**
 * Subscribes to new in-app notifications and surfaces them as local push alerts
 * when the app is open and push is enabled for the user.
 */
export function usePushNotificationListener(
  userId?: string,
  pushEnabled?: boolean,
  onLocalNotification?: LocalNotificationHandler
) {
  useEffect(() => {
    if (!userId || pushEnabled === false || !onLocalNotification) {
      return;
    }

    const channel = supabase
      .channel(`push-listener:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as NotificationRecord;
          onLocalNotification(record.title, record.body, record.data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pushEnabled, onLocalNotification]);
}