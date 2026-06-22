"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMilitaryClock } from "../../../packages/shared/src/hooks/useMilitaryClock";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { DetentionTimerBannerWeb } from "../../detention-timer/components/DetentionTimerBannerWeb";
import { useDetentionTimerWeb } from "../../detention-timer/hooks/useDetentionTimerWeb";
import { BRAND } from "../constants";
import { RECEIPT_DRAFT_KEY, useReceiptOcrWeb } from "../hooks/useReceiptOcrWeb";

export const ReceiptCaptureWeb: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const currentTime = useMilitaryClock();
  const { processFile, isProcessing, error, lastEngine } = useReceiptOcrWeb();
  const { session: detentionSession } = useDetentionTimerWeb();

  const buildDetentionContext = () => {
    if (!detentionSession) return undefined;
    return {
      loadNumber: detentionSession.loadNumber,
      loadId: detentionSession.loadId,
      facility: detentionSession.facility,
    };
  };

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const runOcrAndNavigate = useCallback(async () => {
    if (!selectedFile || !previewUrl) return;
    try {
      const ocrResult = await processFile(selectedFile);
      sessionStorage.setItem(
        RECEIPT_DRAFT_KEY,
        JSON.stringify({
          imageUrl: previewUrl,
          ocrResult,
          manual: false,
          detentionContext: buildDetentionContext(),
        })
      );
      router.push("/receipts/correct");
    } catch {
      alert("Scan failed. Try a clearer photo or enter details manually.");
    }
  }, [selectedFile, previewUrl, processFile, router]);

  const goManual = () => {
    sessionStorage.setItem(
      RECEIPT_DRAFT_KEY,
      JSON.stringify({
        imageUrl: null,
        ocrResult: null,
        manual: true,
        detentionContext: buildDetentionContext(),
      })
    );
    router.push("/receipts/correct");
  };

  return (
    <FeatureShell
      title="Scan Receipt"
      subtitle="Upload a receipt image for OCR — review is mandatory before save"
      backHref="/expenses"
      backLabel="← Expenses"
      maxWidth="md"
    >
      <DetentionTimerBannerWeb />

      <div className="flex justify-end">
        <span
          className="text-xs font-semibold tabular-nums px-3 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,191,255,0.12)", color: BRAND.accentDark }}
        >
          {currentTime}
        </span>
      </div>

      {!previewUrl ? (
        <div
          className="border-2 border-dashed border-[#00bfff] rounded-2xl p-10 text-center bg-white cursor-pointer hover:bg-sky-50/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <p className="text-4xl mb-3">📷</p>
          <p className="font-bold text-[#0F172A]">Upload Receipt Photo</p>
          <p className="text-sm text-[#64748B] mt-2">
            JPG, PNG, or PDF — align total line clearly, avoid glare
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0F172A] rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Receipt preview" className="w-full max-h-96 object-contain" />
            {isProcessing && (
              <div className="bg-black/50 text-white text-center py-4 text-sm font-semibold">
                Reading receipt…
                {lastEngine === "fallback" && (
                  <span className="block text-xs font-normal mt-1 opacity-80">
                    Using fallback extraction — review carefully
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              disabled={isProcessing}
              className="flex-1 border border-[#E2E8F0] rounded-xl py-3 font-semibold text-[#0F172A]"
            >
              Choose Different
            </button>
            <button
              type="button"
              onClick={runOcrAndNavigate}
              disabled={isProcessing}
              className="flex-1 bg-[#00bfff] text-white rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {isProcessing ? "Processing…" : "Continue to Review"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={goManual}
        className="w-full text-sm text-[#00bfff] font-semibold hover:underline py-2"
      >
        Enter expense manually (no receipt)
      </button>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          {error}
        </p>
      )}
    </FeatureShell>
  );
};