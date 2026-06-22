"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../packages/shared/src/auth/AuthContext";
import { useSettings } from "../../../packages/shared/src/context/SettingsContext";
import { formatMessageTime } from "../../../packages/shared/src/utils/formatTime";
import { ChatAvatar } from "./ChatAvatar";
import { useChatPresence } from "../hooks/useChatPresence";
import { useRefundWorkflow } from "../hooks/useRefundWorkflow";
import { detectRefundIntent } from "../utils/detectRefundIntent";
import type { ChatMessage } from "../types";
import { useChatCounterparty } from "../../verification/hooks/useChatCounterparty";
import { CompanyProfileStripWeb } from "../../verification/components/CompanyProfileStripWeb";

interface SenderProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ChatRoomWebProps {
  channelId: string;
}

export const ChatRoomWeb: React.FC<ChatRoomWebProps> = ({ channelId }) => {
  const searchParams = useSearchParams();
  const channelName = searchParams.get("name") ?? "Chat";
  const { isMilitaryTime } = useSettings();
  const { verifyHighRiskAction, profile } = useAuth();
  const { submitting, uploadingScreenshot, submitRefundRequest } = useRefundWorkflow();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, SenderProfile>>({});
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refundOpen, setRefundOpen] = useState(false);
  const [pendingRefundMessage, setPendingRefundMessage] = useState("");
  const [refundHintVisible, setRefundHintVisible] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedProfileIds = useRef(new Set<string>());
  const { counterparty } = useChatCounterparty(channelId);

  const {
    typingUsers,
    handleInputActivity,
    markMessageRead,
    getReadStatusForOwnMessage,
  } = useChatPresence({
    channelId,
    currentUserId,
    currentUserName: profile?.full_name,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id));
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) console.error("fetch messages error", error);
    setMessages((data as ChatMessage[]) || []);
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!channelId) return;

    const sub = supabase
      .channel(`chat-room-web:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            const exists = prev.some(
              (m) =>
                m.id === newMsg.id ||
                (m.content === newMsg.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)
            );
            return exists ? prev : [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!messages.length || !currentUserId) return;
    const lastOther = [...messages].reverse().find(
      (m) => !m.is_system && m.user_id !== currentUserId && !m.id.startsWith("temp-")
    );
    if (lastOther) markMessageRead(lastOther.id);
  }, [messages, currentUserId, markMessageRead]);

  useEffect(() => {
    const userIds = [...new Set(messages.map((m) => m.user_id).filter(Boolean))];
    const missing = userIds.filter(
      (id) => id !== currentUserId && !fetchedProfileIds.current.has(id)
    );
    if (!missing.length) return;

    missing.forEach((id) => fetchedProfileIds.current.add(id));

    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", missing)
      .then(({ data }) => {
        if (!data?.length) return;
        setSenderProfiles((prev) => {
          const next = { ...prev };
          for (const row of data as SenderProfile[]) {
            next[row.id] = row;
          }
          return next;
        });
      });
  }, [messages, currentUserId]);

  const openRefundSheet = (triggerMessage: string) => {
    setPendingRefundMessage(triggerMessage);
    setRefundOpen(true);
    setRefundHintVisible(false);
  };

  const handleRefundSubmit = async () => {
    if (!channelId || !refundAmount.trim()) return;

    const biometric = await verifyHighRiskAction("refund");
    if (!biometric.verified) {
      setStatusMsg(biometric.error ?? "Verification required before submitting a refund.");
      return;
    }

    try {
      const result = await submitRefundRequest({
        channelId,
        payload: {
          amount: refundAmount,
          reason: refundReason,
          triggerMessage: pendingRefundMessage,
        },
      });

      setRefundOpen(false);
      setPendingRefundMessage("");
      setRefundAmount("");
      setRefundReason("");
      setInputText("");
      setStatusMsg(
        result.escalated
          ? "Refund request submitted and escalated to billing."
          : "Refund request submitted. Check support messages above."
      );
    } catch (e: unknown) {
      setStatusMsg(e instanceof Error ? e.message : "Submission failed.");
    }
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !channelId || sending) return;

    if (detectRefundIntent(trimmed)) {
      openRefundSheet(trimmed);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      setStatusMsg("Please sign in to send messages.");
      return;
    }

    setSending(true);
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      channel_id: channelId,
      user_id: uid,
      content: trimmed,
      created_at: new Date().toISOString(),
      reported: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText("");

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: uid,
      content: trimmed,
    });

    setSending(false);

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(trimmed);
      setStatusMsg(error.message || "Could not send message.");
    }
  };

  const reportMessage = async (message: ChatMessage) => {
    if (message.reported) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;

    await supabase.from("message_reports").insert({
      message_id: message.id,
      reporter_user_id: uid,
      reason: "Reported from chat",
    });
    await supabase.from("messages").update({ reported: true }).eq("id", message.id);
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, reported: true } : m)));
    setStatusMsg("Message reported. Thank you.");
  };

  if (loading) {
    return <p className="text-center text-[#64748B] py-12">Loading messages…</p>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto mt-4">
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-t-2xl px-4 py-3">
        <Link href="/chat" className="text-[#00bfff] font-semibold text-sm hover:underline">
          ← Chats
        </Link>
        <div className="text-center flex-1 px-4">
          <p className="font-bold text-[#0F172A] truncate">{channelName}</p>
          <p className="text-[11px] text-[#64748B]">Company + Load chat • Military time</p>
        </div>
        <div className="w-14" />
      </div>

      {counterparty && (
        <div className="bg-white border-x border-[#E2E8F0] px-4 py-2">
          <CompanyProfileStripWeb profile={counterparty} label="Trading with" />
        </div>
      )}

      {statusMsg && (
        <p className="text-sm bg-sky-50 border border-sky-100 text-[#0F172A] px-4 py-2">{statusMsg}</p>
      )}

      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] border-x border-[#E2E8F0] px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-[#64748B] py-16">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const isSystem = message.is_system === true;
            const isOwn = !isSystem && currentUserId ? message.user_id === currentUserId : false;
            const timestamp = formatMessageTime(message.created_at, isMilitaryTime);

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="max-w-[92%] bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-[11px] font-bold text-[#1E40AF] uppercase tracking-wide">laslogTMX Support</p>
                    <p className="text-sm text-[#1E293B] mt-1 leading-relaxed">{message.content}</p>
                    <p className="text-[10px] text-[#64748B] mt-2 text-right">{timestamp}</p>
                  </div>
                </div>
              );
            }

            const senderProfile = senderProfiles[message.user_id];
            const displayName = message.sender_name ?? senderProfile?.full_name ?? undefined;
            const readStatus = isOwn ? getReadStatusForOwnMessage(message.id) : null;

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {!isOwn && (
                  <ChatAvatar name={displayName} userId={message.user_id} size="sm" />
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    message.reported
                      ? "bg-red-50 opacity-70"
                      : isOwn
                        ? "bg-[#0F172A] text-white"
                        : "bg-white border border-[#E2E8F0] text-[#1E293B]"
                  }`}
                >
                  {!isOwn && displayName && (
                    <p className="text-xs font-semibold text-[#64748B] mb-0.5">{displayName}</p>
                  )}
                  <p className={`text-[15px] leading-snug ${message.reported ? "line-through" : ""}`}>
                    {message.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1 justify-between">
                    <span className={`text-[11px] ${isOwn ? "text-white/80" : "text-[#64748B]"}`}>
                      {timestamp}
                      {isOwn && readStatus && (
                        <span className="ml-1.5" title={readStatus === "read" ? "Read" : "Sent"}>
                          {readStatus === "read" ? "✓✓" : "✓"}
                        </span>
                      )}
                    </span>
                    {message.reported && (
                      <span className="text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">REPORTED</span>
                    )}
                    {!isOwn && !message.reported && (
                      <button
                        type="button"
                        onClick={() => reportMessage(message)}
                        className="text-red-500 text-xs hover:underline"
                        title="Report message"
                      >
                        Report
                      </button>
                    )}
                  </div>
                </div>
                {isOwn && (
                  <ChatAvatar
                    name={profile?.full_name}
                    userId={currentUserId}
                    isOwn
                    size="sm"
                  />
                )}
              </div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#64748B] pl-1">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-[#00bfff] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-[#00bfff] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-[#00bfff] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            {typingUsers.length === 1
              ? `${typingUsers[0].displayName ?? "Someone"} is typing…`
              : `${typingUsers.length} people are typing…`}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {refundHintVisible && !refundOpen && (
        <button
          type="button"
          onClick={() => openRefundSheet(inputText.trim())}
          className="bg-blue-50 border-t border-blue-200 text-sm text-[#1E40AF] font-medium py-2.5 text-center hover:bg-blue-100"
        >
          Billing concern detected — tap to open refund form
        </button>
      )}

      {refundOpen && (
        <div className="bg-white border border-[#E2E8F0] p-4 space-y-3">
          <p className="font-bold text-[#0F172A]">Refund Request</p>
          {pendingRefundMessage && (
            <p className="text-sm text-[#64748B] bg-gray-50 rounded-lg p-3">{pendingRefundMessage}</p>
          )}
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Amount (USD)"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Reason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRefundOpen(false)}
              className="flex-1 border rounded-xl py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRefundSubmit}
              disabled={submitting || uploadingScreenshot}
              className="flex-1 bg-[#00bfff] text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-white border border-[#E2E8F0] rounded-b-2xl p-3 items-end">
        <textarea
          className="flex-1 border border-[#CBD5E1] rounded-2xl px-4 py-2.5 text-[15px] resize-none max-h-28"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setRefundHintVisible(detectRefundIntent(e.target.value));
            handleInputActivity();
          }}
          placeholder="Type a message…"
          rows={1}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!inputText.trim() || sending}
          className="bg-[#00bfff] text-white font-semibold px-5 py-2.5 rounded-2xl disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
};