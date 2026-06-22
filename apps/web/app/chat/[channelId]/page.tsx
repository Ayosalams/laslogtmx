"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { ChatRoomWeb } from "../../../../../features/chat/components/ChatRoomWeb";

function ChatRoomContent() {
  const params = useParams();
  const channelId = typeof params.channelId === "string" ? params.channelId : "";
  if (!channelId) {
    return <p className="text-center text-gray-500 py-12">Invalid chat channel.</p>;
  }
  return <ChatRoomWeb channelId={channelId} />;
}

export default function ChatRoomPage() {
  return (
    <Suspense fallback={<p className="text-center text-gray-500 py-12">Loading chat…</p>}>
      <ChatRoomContent />
    </Suspense>
  );
}