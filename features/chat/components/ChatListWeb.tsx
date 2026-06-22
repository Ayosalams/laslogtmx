"use client";

import React from "react";
import Link from "next/link";
import { useChatChannels } from "../hooks/useChatChannels";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";

export const ChatListWeb: React.FC = () => {
  const { channels, loading, refresh } = useChatChannels();

  return (
    <FeatureShell
      title="Messages"
      subtitle="Company-wide & load-specific chats"
      backHref="/"
      backLabel="← Home"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          className="text-sm text-[#00bfff] font-semibold hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && channels.length === 0 ? (
        <p className="text-[#64748B] py-8 text-center">Loading chats…</p>
      ) : channels.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
          <p className="font-semibold text-[#475569]">No active chats found.</p>
          <p className="text-sm text-[#94A3B8] mt-2">
            Company channels and load chats will appear here.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-[#E2E8F0] rounded-2xl divide-y divide-[#E2E8F0] overflow-hidden">
          {channels.map((channel) => (
            <li key={channel.id}>
              <Link
                href={`/chat/${channel.id}?name=${encodeURIComponent(channel.name)}`}
                className="block px-5 py-4 hover:bg-sky-50/50 transition-colors"
              >
                <p className="font-semibold text-[#0F172A]">{channel.name}</p>
                {channel.lastMessage && (
                  <p className="text-sm text-[#64748B] mt-1 truncate">{channel.lastMessage}</p>
                )}
                {channel.load_id && (
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-[#00bfff] px-2 py-0.5 rounded-full">
                    Load Chat
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </FeatureShell>
  );
};