"use client";

import React, { useState } from "react";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { useFmcsaStatus } from "../hooks/useFmcsaStatus";
import { StatusBadgeWeb } from "./MotusWebShared";

export const StatusCheckerWeb: React.FC = () => {
  const [dotInput, setDotInput] = useState("");
  const { status, isChecking, error, checkDot, clear } = useFmcsaStatus();
  const [localError, setLocalError] = useState<string | null>(null);

  const onCheck = async () => {
    if (!dotInput.trim()) {
      setLocalError("Enter a DOT number to check.");
      return;
    }
    setLocalError(null);
    try {
      await checkDot(dotInput);
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Status check failed.");
    }
  };

  return (
    <FeatureShell
      title="FMCSA Status Checker"
      subtitle="Enter a DOT number to check status using public FMCSA SAFER data"
      backHref="/motus"
      maxWidth="md"
    >
      {(localError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {localError ?? error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 border border-[#CBD5E1] rounded-xl px-4 py-3"
          value={dotInput}
          onChange={(e) => setDotInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="DOT Number (e.g. 1234567)"
          inputMode="numeric"
          onKeyDown={(e) => e.key === "Enter" && onCheck()}
        />
        <button
          type="button"
          onClick={onCheck}
          disabled={isChecking}
          className="bg-[#00bfff] text-white font-semibold px-6 rounded-xl disabled:opacity-60"
        >
          {isChecking ? "…" : "Check"}
        </button>
      </div>

      {status && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
          <p className="text-sm text-[#64748B]">DOT {status.dotNumber}</p>
          <p className="text-xl font-bold text-[#0F172A]">{status.legalName || "Carrier Name Not Available"}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadgeWeb status={status.status as "Active"} />
            {status.authorityStatus && (
              <StatusBadgeWeb status={status.authorityStatus as "Active"} />
            )}
          </div>
          {status.outOfService && (
            <p className="text-red-600 font-semibold text-sm">⚠️ This carrier is currently Out of Service</p>
          )}
          <p className="text-sm text-[#475569]">
            Power Units: {status.powerUnits ?? "N/A"} • Drivers: {status.drivers ?? "N/A"}
          </p>
          <p className="text-sm text-[#475569]">Source: {status.source}</p>
          {status.lastUpdated && (
            <p className="text-sm text-[#475569]">
              Last updated: {new Date(status.lastUpdated).toLocaleDateString()}
            </p>
          )}
          <button type="button" onClick={clear} className="text-sm text-red-600 font-medium hover:underline">
            Clear Results
          </button>
        </div>
      )}

      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs text-[#475569] leading-relaxed">
        <p className="font-semibold text-[#0F172A] mb-1">Demo DOT numbers</p>
        <p>1234567 — Active carrier • 9876543 — Out of Service • 5555555 — Pending</p>
        <p className="mt-2 text-amber-900">
          Uses simulated SAFER data for demonstration. Always verify on safer.fmcsa.dot.gov before making decisions.
        </p>
      </div>
    </FeatureShell>
  );
};