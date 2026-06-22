"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMilitaryClock } from "../../../packages/shared/src/hooks/useMilitaryClock";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { DetentionTimerBannerWeb } from "../../detention-timer/components/DetentionTimerBannerWeb";
import { useDetentionTimerWeb } from "../../detention-timer/hooks/useDetentionTimerWeb";
import { EXPENSE_CATEGORIES, BRAND } from "../../receipt-ocr/constants";
import { buildManualOcrDefaults } from "../../receipt-ocr/utils/parseReceiptText";
import { buildDetentionClaimOcrDefaults } from "../../detention-timer/utils/detentionUtils";
import { RECEIPT_DRAFT_KEY } from "../../receipt-ocr/hooks/useReceiptOcrWeb";
import { useExpenses } from "../hooks/useExpenses";
import type { Expense } from "../types";

function getCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function formatExpenseDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatMilitaryTime(timeStr: string): string {
  const match = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return timeStr;
  return `${Number(match[1]).toString().padStart(2, "0")}:${match[2]}`;
}

function ExpenseRow({ item }: { item: Expense }) {
  const timeLabel = item.expense_time ? formatMilitaryTime(item.expense_time) : null;

  return (
    <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0F172A] truncate">{item.merchant}</p>
        <p className="text-xs text-[#64748B] mt-1">
          {getCategoryLabel(item.category)} • {formatExpenseDate(item.expense_date)}
          {timeLabel ? ` • ${timeLabel}` : ""}
          {item.load_number ? ` • Load ${item.load_number}` : ""}
        </p>
      </div>
      <p className="font-bold text-[#0099cc] ml-3 shrink-0">${Number(item.amount).toFixed(2)}</p>
    </div>
  );
}

export const ExpenseListWeb: React.FC = () => {
  const router = useRouter();
  const currentTime = useMilitaryClock();
  const { expenses, loading, refresh, error, companyId } = useExpenses();
  const { session: detentionSession, buildClaimDraft } = useDetentionTimerWeb();

  const buildDetentionDraft = useCallback(() => {
    if (!detentionSession) return undefined;
    return {
      loadNumber: detentionSession.loadNumber,
      loadId: detentionSession.loadId,
      facility: detentionSession.facility,
    };
  }, [detentionSession]);

  const startScan = useCallback(() => {
    const detentionContext = buildDetentionDraft();
    sessionStorage.setItem(
      RECEIPT_DRAFT_KEY,
      JSON.stringify({ imageUrl: null, ocrResult: null, manual: false, detentionContext })
    );
    router.push("/receipts");
  }, [router, buildDetentionDraft]);

  const startManualEntry = useCallback(() => {
    const detentionContext = buildDetentionDraft();
    sessionStorage.setItem(
      RECEIPT_DRAFT_KEY,
      JSON.stringify({
        imageUrl: null,
        ocrResult: buildManualOcrDefaults(),
        manual: true,
        detentionContext,
      })
    );
    router.push("/receipts/correct");
  }, [router, buildDetentionDraft]);

  const startDetentionScan = useCallback(() => {
    startScan();
  }, [startScan]);

  const startDetentionClaim = useCallback(() => {
    const claim = buildClaimDraft();
    if (!claim) {
      startManualEntry();
      return;
    }
    sessionStorage.setItem(
      RECEIPT_DRAFT_KEY,
      JSON.stringify({
        imageUrl: null,
        ocrResult: buildDetentionClaimOcrDefaults(claim),
        manual: true,
        detentionContext: {
          loadNumber: claim.loadNumber,
          loadId: claim.loadId,
          facility: claim.facility,
        },
        detentionClaim: true,
      })
    );
    router.push("/receipts/correct");
  }, [buildClaimDraft, router, startManualEntry]);

  return (
    <FeatureShell
      title="Expenses"
      subtitle="Receipt OCR • manual entry • detention linking"
      backHref="/"
      backLabel="← Home"
      maxWidth="lg"
    >
      <div className="flex justify-end -mt-2">
        <span
          className="text-xs font-semibold tabular-nums px-3 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,191,255,0.12)", color: BRAND.accentDark }}
        >
          {currentTime}
        </span>
      </div>

      <DetentionTimerBannerWeb
        onScanExpense={startDetentionScan}
        onGenerateClaim={detentionSession ? startDetentionClaim : undefined}
      />

      <button
        type="button"
        onClick={startScan}
        className="w-full flex items-center gap-3 bg-white border rounded-2xl p-4 mb-3 text-left hover:bg-sky-50/30 transition-colors"
        style={{ borderColor: "rgba(0,191,255,0.3)" }}
      >
        <span className="text-2xl">📷</span>
        <div className="flex-1">
          <p className="font-bold text-[#0F172A]">Scan Receipt</p>
          <p className="text-xs text-[#64748B] mt-0.5">Capture → OCR → Review → Save</p>
        </div>
        <span className="text-[#00bfff] font-semibold">→</span>
      </button>

      <button
        type="button"
        onClick={startManualEntry}
        className="w-full flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">✏️</span>
        <div className="flex-1">
          <p className="font-semibold text-[#0F172A]">Manual Entry</p>
          <p className="text-xs text-[#64748B] mt-0.5">No receipt — enter amount and details directly</p>
        </div>
        <span className="text-[#00bfff] font-semibold">→</span>
      </button>

      {!companyId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
          <p className="text-sm text-amber-900">Select a company to track expenses.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#1E293B]">Recent Expenses</p>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-xs font-semibold text-[#00bfff] hover:underline disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading && expenses.length === 0 ? (
        <div className="flex justify-center py-16">
          <span className="text-[#64748B]">Loading expenses…</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-semibold text-[#64748B]">No expenses yet</p>
          <p className="text-sm text-[#64748B] mt-2 max-w-sm mx-auto leading-relaxed">
            Scan a receipt or use manual entry to log fuel, tolls, detention, and more.
          </p>
          <Link
            href="/receipts"
            className="inline-block mt-4 text-sm font-semibold text-[#00bfff] hover:underline"
          >
            Go to Receipt OCR →
          </Link>
        </div>
      ) : (
        expenses.map((item) => <ExpenseRow key={item.id} item={item} />)
      )}
    </FeatureShell>
  );
};