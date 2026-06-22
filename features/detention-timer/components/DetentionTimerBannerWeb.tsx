"use client";

import React, { useState } from "react";
import { useMilitaryClock } from "../../../packages/shared/src/hooks/useMilitaryClock";
import { GLASS } from "../../../packages/shared/src/utils/glass";
import { BRAND } from "../../receipt-ocr/constants";
import { useDetentionTimerWeb } from "../hooks/useDetentionTimerWeb";
import { formatDuration, facilityLabel } from "../utils/detentionUtils";
import type { DetentionFacility } from "../types";

interface Props {
  compact?: boolean;
  onScanExpense?: () => void;
  onGenerateClaim?: () => void;
  presetLoadNumber?: string;
  presetLoadId?: string | null;
}

export const DetentionTimerBannerWeb: React.FC<Props> = ({
  compact,
  onScanExpense,
  onGenerateClaim,
  presetLoadNumber,
  presetLoadId,
}) => {
  const currentTime = useMilitaryClock();
  const { session, elapsed, loading, isActive, startTimer, stopTimer } = useDetentionTimerWeb();
  const [loadNumber, setLoadNumber] = useState(presetLoadNumber ?? "");
  const [facility, setFacility] = useState<DetentionFacility>("pickup");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`${GLASS.card} p-4 flex justify-center`}>
        <span className="text-sm text-[#64748B]">Loading timer…</span>
      </div>
    );
  }

  if (isActive && session && elapsed) {
    return (
      <div className={`${GLASS.cardActive} p-4 border mb-3`} style={{ borderColor: "rgba(0,191,255,0.35)" }}>
        <div className={GLASS.highlight} aria-hidden />
        <div className="flex justify-between items-center">
          <p className="font-bold text-[#0F172A] text-sm">Detention Timer</p>
          <p className="font-bold text-[#0099cc] text-sm">Load {session.loadNumber}</p>
        </div>
        <p className="text-xs text-[#64748B] mt-1">
          {facilityLabel(session.facility)} • Started {elapsed.startedAtMilitary} • Now {currentTime}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase text-[#64748B]">Elapsed</p>
            <p className="text-base font-bold tabular-nums text-[#0F172A] mt-1">
              {formatDuration(elapsed.totalMinutes)}
            </p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase text-[#64748B]">Billable</p>
            <p
              className={`text-base font-bold tabular-nums mt-1 ${
                elapsed.isBillable ? "text-[#B45309]" : "text-[#0F172A]"
              }`}
            >
              {formatDuration(elapsed.billableMinutes)}
            </p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase text-[#64748B]">Free Left</p>
            <p className="text-base font-bold tabular-nums text-[#0F172A] mt-1">
              {formatDuration(elapsed.freeMinutesRemaining)}
            </p>
          </div>
        </div>
        {!elapsed.isBillable && (
          <p className="text-[11px] text-[#64748B] mt-2">
            {elapsed.freeMinutesRemaining > 0
              ? `${elapsed.freeMinutesRemaining} min free time remaining`
              : "Free time exhausted — billable time accruing"}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 gap-2">
          {onGenerateClaim ? (
            <button
              type="button"
              onClick={onGenerateClaim}
              className="text-sm font-bold text-[#B45309] hover:underline"
            >
              Generate claim →
            </button>
          ) : onScanExpense ? (
            <button
              type="button"
              onClick={onScanExpense}
              className="text-sm font-semibold text-[#00bfff] hover:underline"
            >
              Scan detention expense →
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={stopTimer}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] hover:bg-gray-100"
          >
            End Timer
          </button>
        </div>
      </div>
    );
  }

  if (compact) return null;

  return (
    <div className={`${GLASS.card} p-4 mb-3`}>
      <div className={GLASS.highlight} aria-hidden />
      <div className="flex justify-between items-center">
        <p className="font-bold text-[#0F172A] text-sm">Detention Timer</p>
        <span
          className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(0,191,255,0.12)", color: BRAND.accentDark }}
        >
          {currentTime}
        </span>
      </div>
      <p className="text-xs text-[#64748B] mt-1 mb-3">
        Track wait time at pickup or delivery for expense attribution.
      </p>
      <input
        className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm mb-3"
        value={loadNumber}
        onChange={(e) => setLoadNumber(e.target.value)}
        placeholder="Load #"
      />
      <div className="flex gap-2 mb-3">
        {(["pickup", "delivery"] as DetentionFacility[]).map((f) => {
          const selected = facility === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFacility(f)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold border ${
                selected
                  ? "border-[#00bfff] bg-sky-50 text-[#0099cc]"
                  : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
              }`}
            >
              {facilityLabel(f)}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        type="button"
        disabled={starting}
        onClick={async () => {
          setStarting(true);
          setError(null);
          const result = await startTimer({
            loadNumber: loadNumber || presetLoadNumber || "",
            loadId: presetLoadId,
            facility,
          });
          if (result.error) setError(result.error);
          setStarting(false);
        }}
        className="w-full bg-[#00bfff] text-white font-bold py-3 rounded-xl disabled:opacity-60"
      >
        {starting ? "Starting…" : "Start Detention Timer"}
      </button>
    </div>
  );
};