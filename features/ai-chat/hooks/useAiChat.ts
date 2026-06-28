'use client';

import { useCallback, useState } from 'react';
import type { AiChatMessage, AiChatResponse } from '../types';

function newId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface UseAiChatOptions {
  /** Base URL for API (web: '' for relative; mobile: resolveAppUrl()) */
  apiBaseUrl?: string;
  /** Supabase session access token for server-side tier validation */
  accessToken?: string | null;
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const { apiBaseUrl = '', accessToken } = options;
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<Pick<AiChatResponse, 'domain' | 'confidence' | 'mode'> | null>(
    null
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: AiChatMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const base = apiBaseUrl.replace(/\/$/, '');
        const res = await fetch(`${base}/api/ai-chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message: trimmed }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }

        const data = (await res.json()) as AiChatResponse;

        const assistantMsg: AiChatMessage = {
          id: newId(),
          role: 'assistant',
          content: data.answer,
          createdAt: new Date().toISOString(),
          domain: data.domain,
          sources: data.sources,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setLastMeta({ domain: data.domain, confidence: data.confidence, mode: data.mode });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to get response';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, apiBaseUrl, accessToken]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastMeta(null);
  }, []);

  return { messages, loading, error, lastMeta, sendMessage, clearChat };
}