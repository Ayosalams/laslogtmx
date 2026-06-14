import { useState, useEffect } from 'react';

export interface ChatChannel {
  id: string;
  name: string;
  lastMessage?: string;
}

export const useChatChannels = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch channels from Supabase or your backend
    const fetchChannels = async () => {
      setLoading(true);
      // Mock data
      setChannels([
        { id: '1', name: 'General Chat', lastMessage: 'Hello there!' },
        { id: '2', name: 'Dispatch', lastMessage: 'Route updated.' },
      ]);
      setLoading(false);
    };

    fetchChannels();
  }, []);

  return { channels, loading };
};
