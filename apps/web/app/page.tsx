import React from "react";
import Link from "next/link";

const features = [
  { href: "/chat", title: "Team Chat", desc: "Company-wide & load-specific messaging with realtime updates", icon: "💬" },
  { href: "/ai-chat", title: "AI Assistant", desc: "OKF-powered RAG for CBLE Prep, compliance, and load board", icon: "🤖" },
  { href: "/motus", title: "MOTUS Helper", desc: "FMCSA status checks, DOT claiming, troubleshooting & docs", icon: "🛡️" },
  { href: "/expenses", title: "Expenses", desc: "Expense list, receipt OCR entry, manual entry, and detention linking", icon: "💰" },
  { href: "/receipts", title: "Receipt OCR", desc: "Upload receipts, OCR extraction, mandatory correction screen", icon: "🧾" },
  { href: "/cble", title: "CBLE Prep", desc: "Tier-gated customs broker exam training library", icon: "📚" },
  { href: "/load-board", title: "Internal Load Board", desc: "Post loads, bid, negotiate, and preview contracts", icon: "🚛" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 mt-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Welcome to laslogTMX</h1>
        <p className="text-[#64748B] mt-2">
          Transport Management Xperience — military time in the header, electric blue accents throughout.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#00bfff] transition-colors group"
          >
            <span className="text-2xl">{f.icon}</span>
            <p className="font-bold text-[#0F172A] mt-3 group-hover:text-[#00bfff]">{f.title}</p>
            <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/settings"
          className="text-[#00bfff] font-semibold bg-sky-50 px-4 py-2 rounded-xl hover:bg-sky-100 transition-colors"
        >
          Settings
        </Link>
        <Link href="/auth/login" className="text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300">
          Login
        </Link>
      </div>
    </div>
  );
}
