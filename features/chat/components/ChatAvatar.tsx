"use client";

import React from "react";

interface ChatAvatarProps {
  name?: string | null;
  userId?: string;
  isOwn?: boolean;
  size?: "sm" | "md";
}

function initialsFrom(name?: string | null, userId?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (userId) return userId.slice(0, 2).toUpperCase();
  return "??";
}

const sizeClass = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
};

export const ChatAvatar: React.FC<ChatAvatarProps> = ({ name, userId, isOwn, size = "md" }) => {
  const initials = initialsFrom(name, userId);

  return (
    <div
      className={`${sizeClass[size]} shrink-0 rounded-full flex items-center justify-center font-bold ${
        isOwn ? "bg-[#0F172A] text-white" : "bg-sky-100 text-[#0099cc] border border-sky-200"
      }`}
      title={name ?? "User"}
      aria-hidden
    >
      {initials}
    </div>
  );
};