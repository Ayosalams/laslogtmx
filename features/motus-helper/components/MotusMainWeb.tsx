"use client";

import React from "react";
import Link from "next/link";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { StatusBadgeWeb } from "./MotusWebShared";

const menuItems = [
  {
    href: "/motus/status",
    title: "FMCSA Status Checker",
    subtitle: "Check DOT authority & OOS status using public data",
    icon: "🔍",
  },
  {
    href: "/motus/dot-claim",
    title: "Guided DOT Linking / Claim",
    subtitle: "Step-by-step process to claim or link your DOT number",
    icon: "🔗",
  },
  {
    href: "/motus/troubleshooting",
    title: "Common Error Troubleshooting",
    subtitle: "Solutions for frequent MOTUS / FMCSA errors",
    icon: "🛠️",
  },
  {
    href: "/motus/documents",
    title: "Document Upload & Tracking",
    subtitle: "Submit and track manual filings (MCS-150, insurance, etc.)",
    icon: "📄",
  },
];

export const MotusMainWeb: React.FC = () => (
  <FeatureShell
    title="MOTUS Helper"
    subtitle="FMCSA Compliance Assistant"
    backHref="/"
    backLabel="← Home"
  >
    <p className="text-sm text-[#475569] leading-relaxed">
      High-priority tool to resolve current FMCSA MOTUS linking, authority, and submission issues.
    </p>

    <div className="grid gap-3">
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 hover:border-[#00bfff] transition-colors"
        >
          <span className="text-2xl">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1E293B]">{item.title}</p>
            <p className="text-sm text-[#64748B] mt-0.5">{item.subtitle}</p>
          </div>
          <span className="text-[#94A3B8] text-xl">→</span>
        </Link>
      ))}
    </div>

    <div className="flex flex-col items-center gap-2 pt-4 opacity-80">
      <StatusBadgeWeb status="Active" />
      <p className="text-xs text-[#64748B] text-center">
        Data sourced from public FMCSA systems where available.
      </p>
    </div>
  </FeatureShell>
);