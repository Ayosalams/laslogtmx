'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { FeatureShell } from '../../../packages/shared/components/FeatureShell';
import { DOMAIN_LABELS, SUGGESTED_PROMPTS } from '../constants';
import { useAiChat } from '../hooks/useAiChat';
import { useAiChatAccess } from '../hooks/useAiChatAccess';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import type { AiChatDomain } from '../types';

const DOMAIN_COLORS: Record<AiChatDomain, string> = {
  cble_prep: 'bg-violet-50 text-violet-700 border-violet-200',
  compliance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  load_board: 'bg-sky-50 text-sky-700 border-sky-200',
  general: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const AiChatWeb: React.FC = () => {
  const { session, isAuthenticated } = useAuth();
  const access = useAiChatAccess();
  const { messages, loading, error, lastMeta, sendMessage, clearChat } = useAiChat({
    accessToken: session?.access_token,
  });
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (access.isLocked) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const allPrompts = [
    SUGGESTED_PROMPTS.cble_prep[0],
    SUGGESTED_PROMPTS.compliance[0],
    SUGGESTED_PROMPTS.load_board[0],
  ];

  const chatDisabled = !isAuthenticated || access.isLocked || loading;

  return (
    <FeatureShell
      title="AI Assistant"
      subtitle="OKF-powered answers for CBLE Prep, Compliance, and Load Board"
      backHref="/"
      backLabel="Home"
      maxWidth="md"
    >
      {!isAuthenticated ? (
        <div className="bg-white border-2 border-[#00bfff] rounded-2xl p-5">
          <p className="font-semibold text-[#0F172A]">Sign In Required</p>
          <p className="text-sm text-[#475569] mt-2 leading-relaxed">
            The AI Assistant uses your company subscription for tier-gated OKF RAG and optional LLM
            synthesis.
          </p>
          <Link href="/auth/login" className="inline-block mt-4 text-sm font-semibold text-[#00bfff] hover:underline">
            Sign In →
          </Link>
        </div>
      ) : access.isLocked ? (
        <div className="bg-white border-2 border-[#00bfff] rounded-2xl p-5">
          <p className="font-semibold text-red-800">Pro Broker Required</p>
          <p className="text-sm text-[#475569] mt-2 leading-relaxed">
            Advanced OKF RAG and LLM synthesis are available on Pro Broker and Enterprise plans.
          </p>
          <p className="text-sm text-[#00bfff] font-medium mt-3">{access.upgradeMessage}</p>
          <Link href="/pricing" className="inline-block mt-4 text-sm font-semibold text-[#00bfff] hover:underline">
            View Plans →
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Your Access</p>
          <p className="font-semibold text-emerald-700 mt-1">{access.accessSummary}</p>
          {!access.isVerified && (
            <p className="text-sm text-emerald-600 mt-2">
              Load board AI guidance requires laslogTMX Verification.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-sky-50 text-[#00bfff] font-semibold border border-sky-100">
          Router + RAG
        </span>
        {lastMeta ? (
          <>
            <span className={`px-2 py-1 rounded-full border font-medium ${DOMAIN_COLORS[lastMeta.domain]}`}>
              {DOMAIN_LABELS[lastMeta.domain]}
            </span>
            <span className="text-[#64748B]">
              {Math.round(lastMeta.confidence * 100)}% route confidence · {lastMeta.mode}
            </span>
          </>
        ) : null}
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clearChat}
            className="ml-auto text-[#64748B] hover:text-[#00bfff] font-medium"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col min-h-[420px] max-h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-[#64748B] text-sm leading-relaxed">
                Ask about customs broker exam prep, FMCSA/MOTUS compliance, or internal load board
                matching and bidding.
              </p>
              {isAuthenticated && !access.isLocked ? (
                <div className="flex flex-col gap-2 mt-6">
                  {allPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-[#E2E8F0] hover:border-[#00bfff] text-[#475569] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#00bfff] text-white'
                    : 'bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0]'
                }`}
              >
                {msg.role === 'assistant' && msg.domain ? (
                  <span
                    className={`inline-block text-xs font-semibold mb-2 px-2 py-0.5 rounded-full border ${DOMAIN_COLORS[msg.domain]}`}
                  >
                    {DOMAIN_LABELS[msg.domain]}
                  </span>
                ) : null}
                <p>{msg.content}</p>
                {msg.sources && msg.sources.length > 0 ? (
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0]">
                    <p className="text-xs font-semibold text-[#64748B] mb-1">Sources</p>
                    <ul className="text-xs text-[#64748B] space-y-0.5">
                      {msg.sources.map((s) => (
                        <li key={s.id}>
                          {s.title} ({s.bundleId})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm text-[#64748B]">
                Routing query and retrieving OKF context…
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="px-4 text-sm text-red-600 border-t border-[#E2E8F0] py-2">{error}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="border-t border-[#E2E8F0] p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              access.isLocked
                ? 'Upgrade to Pro Broker to use AI Assistant…'
                : 'Ask about CBLE, compliance, or load board…'
            }
            className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm focus:outline-none focus:border-[#00bfff] disabled:bg-[#F8FAFC]"
            disabled={chatDisabled}
          />
          <button
            type="submit"
            disabled={chatDisabled || !input.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#00bfff] text-white font-semibold text-sm disabled:opacity-50 hover:bg-sky-500 transition-colors"
          >
            Send
          </button>
        </form>
      </div>

      <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
        Responses use laslogTMX OKF knowledge bundles. Not legal or exam advice. Pro Broker+ required
        for RAG/LLM. Configure AI_CHAT_API_KEY in .env.local for LLM synthesis (optional).
      </p>
    </FeatureShell>
  );
};