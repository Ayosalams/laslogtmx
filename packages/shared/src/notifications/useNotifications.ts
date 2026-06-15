'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { NotificationRecord } from './types';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const records = data as NotificationRecord[];
      setNotifications(records);
      setUnreadCount(records.filter((n) => !n.read_at).length);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
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
          setNotifications((prev) => [record, ...prev].slice(0, 50));
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    return { error };
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return { error: new Error('Not authenticated') };

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
      setUnreadCount(0);
    }

    return { error };
  }, [userId]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}