"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

export interface TypingUser {
  userId: string;
  displayName?: string;
}

export interface ReadReceipt {
  userId: string;
  messageId: string;
  readAt: string;
}

interface UseChatPresenceOptions {
  channelId: string;
  currentUserId?: string;
  currentUserName?: string | null;
}

export function useChatPresence({ channelId, currentUserId, currentUserName }: UseChatPresenceOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceipt>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !currentUserId) return;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          displayName: currentUserName ?? undefined,
          isTyping,
        },
      });
    },
    [currentUserId, currentUserName]
  );

  const markMessageRead = useCallback(
    (messageId: string) => {
      if (!channelRef.current || !currentUserId || !messageId || messageId.startsWith("temp-")) return;

      const readAt = new Date().toISOString();
      setReadReceipts((prev) => ({
        ...prev,
        [currentUserId]: { userId: currentUserId, messageId, readAt },
      }));

      channelRef.current.send({
        type: "broadcast",
        event: "read",
        payload: { userId: currentUserId, messageId, readAt },
      });
    },
    [currentUserId]
  );

  const handleInputActivity = useCallback(() => {
    if (!currentUserId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      broadcastTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      broadcastTyping(false);
    }, 2000);
  }, [broadcastTyping, currentUserId]);

  useEffect(() => {
    if (!channelId || !currentUserId) return;

    const channel = supabase.channel(`chat-presence:${channelId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const data = payload as { userId: string; displayName?: string; isTyping: boolean };
        if (!data?.userId || data.userId === currentUserId) return;

        setTypingUsers((prev) => {
          const without = prev.filter((u) => u.userId !== data.userId);
          return data.isTyping
            ? [...without, { userId: data.userId, displayName: data.displayName }]
            : without;
        });
      })
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const data = payload as ReadReceipt;
        if (!data?.userId || !data.messageId) return;
        setReadReceipts((prev) => ({
          ...prev,
          [data.userId]: data,
        }));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) broadcastTyping(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelId, currentUserId, broadcastTyping]);

  const getReadStatusForOwnMessage = useCallback(
    (messageId: string): "sent" | "read" => {
      if (!currentUserId) return "sent";
      const othersRead = Object.entries(readReceipts).some(
        ([uid, receipt]) => uid !== currentUserId && receipt.messageId === messageId
      );
      return othersRead ? "read" : "sent";
    },
    [currentUserId, readReceipts]
  );

  return {
    typingUsers,
    readReceipts,
    handleInputActivity,
    markMessageRead,
    getReadStatusForOwnMessage,
  };
}