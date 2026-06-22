"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMilitaryClock } from "../../../packages/shared/src/hooks/useMilitaryClock";
import { GLASS } from "../../../packages/shared/src/utils/glass";
import { DetentionTimerBannerWeb } from "../../detention-timer/components/DetentionTimerBannerWeb";
import { useDetentionTimerWeb } from "../../detention-timer/hooks/useDetentionTimerWeb";
import { useExpenses } from "../../expenses/hooks/useExpenses";
import { EXPENSE_CATEGORIES, BRAND } from "../constants";
import { RECEIPT_DRAFT_KEY } from "../hooks/useReceiptOcrWeb";
import type { DetentionFacility } from "../../detention-timer/types";
import {
  normalizeAmountInput,
  validateAmount,
  validateExpenseDate,
  validateMilitaryTime,
} from "../utils/validateExpenseFields";
import type { ExpenseCategory, FieldConfidence, ReceiptCaptureParams, ReceiptOcrResult } from "../types";

const CONFIDENCE_LABEL: Record<string, { text: string; color: string }> = {
  high: { text: "High confidence", color: BRAND.success },
  medium: { text: "Review suggested", color: BRAND.warning },
  low: { text: "Manual entry required", color: BRAND.danger },
};

function fieldBorder(confidence: FieldConfidence | undefined, hasError: boolean): string {
  if (hasError) return BRAND.danger;
  if (confidence === "low") return "rgba(220,38,38,0.45)";
  if (confidence === "medium") return "rgba(180,83,9,0.4)";
  return BRAND.border;
}

export const ReceiptCorrectionWeb: React.FC = () => {
  const router = useRouter();
  const currentTime = useMilitaryClock();
  const { createExpense, saving, error } = useExpenses();
  const { detentionNotePrefix } = useDetentionTimerWeb();

  const [params, setParams] = useState<ReceiptCaptureParams | null>(null);
  const [detentionContext, setDetentionContext] = useState<{
    loadNumber?: string;
    loadId?: string | null;
    facility?: DetentionFacility;
  } | undefined>();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseTime, setExpenseTime] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RECEIPT_DRAFT_KEY);
      if (!raw) {
        setReady(true);
        return;
      }
      const draft = JSON.parse(raw) as {
        imageUrl?: string | null;
        ocrResult?: ReceiptOcrResult | null;
        manual?: boolean;
        detentionContext?: {
          loadNumber?: string;
          loadId?: string | null;
          facility?: DetentionFacility;
        };
        detentionClaim?: boolean;
      };
      const p: ReceiptCaptureParams = {
        imageUri: draft.imageUrl ?? undefined,
        ocrResult: draft.ocrResult ?? undefined,
        manual: draft.manual === true,
        detentionClaim: draft.detentionClaim === true,
        detentionContext:
          draft.detentionContext?.loadNumber != null
            ? {
                loadNumber: draft.detentionContext.loadNumber,
                loadId: draft.detentionContext.loadId,
                facility: draft.detentionContext.facility,
              }
            : undefined,
      };
      setParams(p);
      setDetentionContext(draft.detentionContext);
      if (p.ocrResult) {
        setAmount(p.ocrResult.amount ?? "");
        setMerchant(p.ocrResult.merchant ?? "");
        setCategory(p.ocrResult.category ?? "other");
        setExpenseDate(p.ocrResult.expenseDate ?? "");
        setExpenseTime(p.ocrResult.expenseTime ?? "");
      }
      setReady(true);
    } catch {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const prefixes: string[] = [];
    if (detentionContext?.loadNumber) {
      prefixes.push(
        `Load ${detentionContext.loadNumber} • ${detentionContext.facility ?? "pickup"} detention`
      );
    } else if (detentionNotePrefix) {
      prefixes.push(detentionNotePrefix);
    }
    if (prefixes.length > 0 && !notes) {
      setNotes(prefixes.join(" • "));
    }
  }, [detentionContext, detentionNotePrefix, notes]);

  const ocrResult = params?.ocrResult;
  const isManual = params?.manual === true;
  const isDetentionClaim = params?.detentionClaim === true;
  const fieldConfidence = ocrResult?.fieldConfidence;
  const confidence = ocrResult?.confidence ?? "low";
  const confidenceMeta = CONFIDENCE_LABEL[confidence] ?? CONFIDENCE_LABEL.low;

  const amountValidation = useMemo(
    () => validateAmount(amount, category, ocrResult?.amount),
    [amount, category, ocrResult?.amount]
  );
  const dateValidation = useMemo(() => validateExpenseDate(expenseDate), [expenseDate]);
  const timeValidation = useMemo(() => validateMilitaryTime(expenseTime), [expenseTime]);

  const validationError = useMemo(() => {
    if (!merchant.trim()) return "Merchant is required";
    if (!amountValidation.valid) return amountValidation.error;
    if (!dateValidation.valid) return dateValidation.error;
    if (!timeValidation.valid) return timeValidation.error;
    if (!confirmed) return "Confirm the details before saving";
    return null;
  }, [merchant, amountValidation, dateValidation, timeValidation, confirmed]);

  const handleSave = async () => {
    setTouched({ amount: true, merchant: true, date: true, time: true });
    if (validationError) {
      alert(validationError);
      return;
    }

    const result = await createExpense({
      amount: parseFloat(amountValidation.normalized ?? amount),
      merchant: merchant.trim(),
      category,
      expense_date: expenseDate,
      expense_time: timeValidation.normalized ?? expenseTime,
      receipt_image_uri: params?.imageUri,
      notes: notes.trim() || undefined,
      ocr_raw_text: ocrResult?.rawText,
      user_confirmed: true,
      load_id: detentionContext?.loadId ?? undefined,
      load_number: detentionContext?.loadNumber,
    });

    if (result) {
      sessionStorage.removeItem(RECEIPT_DRAFT_KEY);
      alert(`Expense saved: $${parseFloat(amount).toFixed(2)} at ${merchant}`);
      router.push("/expenses");
    }
  };

  if (!ready) {
    return <p className="text-center text-[#64748B] py-12">Loading…</p>;
  }

  if (!params || (!ocrResult && !isManual)) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <p className="font-semibold text-[#0F172A]">Missing receipt data</p>
        <Link href="/receipts" className="inline-block bg-[#00bfff] text-white font-semibold px-6 py-3 rounded-xl">
          Scan a Receipt
        </Link>
      </div>
    );
  }

  const categorySuggestions = ocrResult?.categorySuggestions ?? [];
  const amountCandidates = ocrResult?.amountCandidates ?? [];

  return (
    <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <Link href="/expenses" className="text-[#00bfff] font-semibold text-sm hover:underline">
          ← Expenses
        </Link>
        <h1 className="font-bold text-[#0F172A]">{isManual ? "Manual Entry" : "Review & Confirm"}</h1>
        <span className="text-xs font-semibold tabular-nums text-[#00bfff] bg-sky-50 px-2 py-1 rounded-full">
          {currentTime}
        </span>
      </div>

      <DetentionTimerBannerWeb compact />

      {isDetentionClaim && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-bold text-[#B45309] text-sm">Detention Claim</p>
          <p className="text-xs text-[#92400E] mt-1">
            Pre-filled from active timer. Confirm billable time and amount before saving.
          </p>
        </div>
      )}

      <div className={`${GLASS.card} p-4`}>
        <div className={GLASS.highlight} aria-hidden />
        <p className="font-bold text-[#0F172A]">{isManual ? "Manual Expense Entry" : "Mandatory Correction"}</p>
        <p className="text-sm text-[#64748B] mt-1">
          {isManual
            ? "Enter expense details manually. All timestamps use military time (HH:MM)."
            : "Verify every field before saving. OCR may misread amounts, dates, or merchant names."}
        </p>
        {!isManual && (
          <p className="text-xs font-bold mt-2" style={{ color: confidenceMeta.color }}>
            {confidenceMeta.text}
          </p>
        )}
      </div>

      {params.imageUri && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={params.imageUri} alt="Receipt" className="w-full h-40 object-cover rounded-2xl bg-gray-100" />
      )}

      <label className="block">
        <span className="text-xs font-semibold uppercase text-[#64748B]">Amount (USD)</span>
        <input
          className="mt-1 w-full border rounded-xl px-4 py-2.5"
          style={{ borderColor: fieldBorder(fieldConfidence?.amount, touched.amount && !amountValidation.valid) }}
          value={amount}
          onChange={(e) => setAmount(normalizeAmountInput(e.target.value))}
          onBlur={() => {
            setTouched((t) => ({ ...t, amount: true }));
            if (amountValidation.normalized) setAmount(amountValidation.normalized);
          }}
          inputMode="decimal"
        />
        {touched.amount && amountValidation.error && (
          <p className="text-xs text-red-600 mt-1">{amountValidation.error}</p>
        )}
        {amountCandidates.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {amountCandidates.slice(0, 4).map((c) => (
              <button
                key={`${c.label}-${c.amount}`}
                type="button"
                onClick={() => setAmount(c.amount)}
                className={`text-xs border rounded-lg px-2 py-1 ${
                  amount === c.amount ? "border-[#00bfff] bg-sky-50" : "border-gray-200"
                }`}
              >
                {c.label}: ${c.amount}
              </button>
            ))}
          </div>
        )}
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-[#64748B]">Merchant</span>
        <input
          className="mt-1 w-full border rounded-xl px-4 py-2.5"
          style={{ borderColor: fieldBorder(fieldConfidence?.merchant, touched.merchant && !merchant.trim()) }}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, merchant: true }))}
        />
      </label>

      <div>
        <span className="text-xs font-semibold uppercase text-[#64748B]">Category</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                category === cat.value
                  ? "bg-sky-50 border-[#00bfff] text-[#0099cc] font-bold"
                  : "border-gray-200 text-[#64748B]"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        {categorySuggestions.length > 0 && (
          <p className="text-xs text-[#64748B] mt-2">
            OCR suggests: {categorySuggestions.slice(0, 2).map((s) => s.category).join(", ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-[#64748B]">Date</span>
          <input
            className="mt-1 w-full border rounded-xl px-4 py-2.5"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, date: true }))}
            placeholder="YYYY-MM-DD"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-[#64748B]">Time (24h)</span>
          <input
            className="mt-1 w-full border rounded-xl px-4 py-2.5"
            value={expenseTime}
            onChange={(e) => setExpenseTime(e.target.value)}
            onBlur={() => {
              setTouched((t) => ({ ...t, time: true }));
              if (timeValidation.normalized) setExpenseTime(timeValidation.normalized);
            }}
            placeholder="HH:MM"
            maxLength={5}
          />
          <p className="text-[11px] text-[#64748B] mt-1">Stored as military time</p>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-[#64748B]">Notes (optional)</span>
        <textarea
          className="mt-1 w-full border rounded-xl px-4 py-2.5 min-h-[72px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Load #, trip details…"
        />
      </label>

      <label className={`flex items-start gap-3 ${GLASS.card} p-4 cursor-pointer`}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 w-4 h-4 accent-[#00bfff]"
        />
        <span className="text-sm text-[#0F172A] leading-relaxed">
          I have reviewed and corrected all fields. This expense is accurate.
        </span>
      </label>

      {error && <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#00bfff] text-white font-bold py-4 rounded-xl disabled:opacity-55"
      >
        {saving ? "Saving…" : "Save Expense"}
      </button>
    </div>
  );
};