import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { ChatChannel } from '../types';

export const useChatChannels = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const companyId = user.user_metadata?.company_id;

    let query = supabase
      .from('channels')
      .select('*')
      .eq('is_active', true);

    if (companyId) {
      // Company channels OR any load-specific chats
      query = query.or(`company_id.eq.${companyId},load_id.is.not.null`);
    } else {
      // Fallback: load-specific only if no company metadata
      query = query.not('load_id', 'is', null);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
    }

    setChannels((data as ChatChannel[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChannels();

    // Realtime updates for channel list (new loads, company updates, active toggles)
    const realtimeChannel = supabase
      .channel('chat-channels')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        (payload) => {
          // Simple refresh strategy for list (can be optimized with upsert later)
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchChannels]);

  return { channels, loading, refresh: fetchChannels };
};