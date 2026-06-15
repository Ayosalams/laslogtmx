'use client';

import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { PushSubscriptionPayload } from './types';

export function usePushRegistration(userId?: string, companyId?: string | null) {
  const registerPush = useCallback(
    async (payload: PushSubscriptionPayload) => {
      if (!userId || !companyId) {
        return { error: new Error('Authentication and company required') };
      }

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          company_id: companyId,
          platform: payload.platform,
          token: payload.token,
          endpoint: payload.endpoint ?? null,
          p256dh: payload.p256dh ?? null,
          auth_key: payload.auth_key ?? null,
          device_label: payload.device_label ?? null,
        },
        { onConflict: 'user_id,platform,token' }
      );

      return { error: error ?? null };
    },
    [userId, companyId]
  );

  const unregisterPush = useCallback(
    async (platform: 'expo' | 'web', token: string) => {
      if (!userId) return { error: new Error('Not authenticated') };

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('token', token);

      return { error: error ?? null };
    },
    [userId]
  );

  return { registerPush, unregisterPush };
}