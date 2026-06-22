"use client";

import React, { useState } from "react";
import type { FlowStep, TroubleshootingItem } from "../types";

const STEPS: { key: FlowStep; label: string }[] = [
  { key: "enter-dot", label: "DOT #" },
  { key: "verify-status", label: "Verify" },
  { key: "claim-account", label: "Claim" },
  { key: "upload-docs", label: "Docs" },
  { key: "confirmation", label: "Done" },
];

type Status =
  | "Active"
  | "Out of Service"
  | "Inactive"
  | "Pending"
  | "Not Found"
  | "Unknown"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Needs Additional Info";

export function StatusBadgeWeb({ status }: { status: Status }) {
  const color =
    status === "Active" || status === "Approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Out of Service" || status === "Rejected"
        ? "bg-red-100 text-red-800"
        : status === "Pending" || status === "Under Review" || status === "Needs Additional Info"
          ? "bg-amber-100 text-amber-800"
          : "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}>
      {status}
    </span>
  );
}

export function ErrorSolutionCardWeb({ item }: { item: TroubleshootingItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left bg-white border border-[#E2E8F0] rounded-xl p-4 hover:border-[#00bfff] transition-colors"
    >
      <p className="text-[11px] font-semibold text-[#64748B] uppercase">{item.category}</p>
      <p className="font-bold text-[#1E293B] mt-1">{item.title}</p>
      <p className="text-sm text-[#475569] mt-1 leading-relaxed">{item.description}</p>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm font-semibold text-[#1E40AF] mb-2">Recommended Solutions:</p>
          <ul className="space-y-1.5">
            {item.solutions.map((sol) => (
              <li key={sol} className="text-sm text-[#334155] flex gap-2">
                <span className="text-[#00bfff]">•</span>
                <span>{sol}</span>
              </li>
            ))}
          </ul>
          {item.commonFixTime && (
            <p className="text-xs italic text-[#64748B] mt-3">Typical resolution: {item.commonFixTime}</p>
          )}
        </div>
      )}

      <p className="text-xs text-[#00bfff] font-medium mt-3">
        {expanded ? "Hide solutions ▲" : "Tap to view solutions ▼"}
      </p>
    </button>
  );
}

export function StepIndicatorWeb({ current }: { current: FlowStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center py-3 gap-1">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                isActive
                  ? "bg-[#00bfff] border-[#00bfff] text-white"
                  : isComplete
                    ? "bg-sky-100 border-[#00bfff] text-[#00bfff]"
                    : "bg-white border-[#CBD5E1] text-[#64748B]"
              }`}
            >
              {index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${isComplete ? "bg-[#00bfff]" : "bg-[#E2E8F0]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}