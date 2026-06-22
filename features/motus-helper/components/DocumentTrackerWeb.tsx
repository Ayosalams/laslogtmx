"use client";

import React, { useState } from "react";
import { useSettings } from "../../../packages/shared/src/context/SettingsContext";
import { formatMessageTime } from "../../../packages/shared/src/utils/formatTime";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { useDocumentUploadsWeb } from "../hooks/useDocumentUploadsWeb";
import { StatusBadgeWeb } from "./MotusWebShared";

const DOC_TYPES = ["MCS-150", "INSURANCE_FILING", "DOT_CLAIM", "AUTHORITY_UPDATE", "OTHER"] as const;

export const DocumentTrackerWeb: React.FC = () => {
  const { isMilitaryTime } = useSettings();
  const [selectedDot, setSelectedDot] = useState("1234567");
  const [selectedType, setSelectedType] = useState<(typeof DOC_TYPES)[number]>("MCS-150");
  const [customFile, setCustomFile] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const { submissions, isUploading, uploadDocument, removeSubmission } = useDocumentUploadsWeb(selectedDot);

  const handleUpload = async () => {
    const fileName =
      attachedFile?.name ?? (customFile.trim() || `${selectedType}_${Date.now()}.pdf`);
    try {
      await uploadDocument(selectedDot, selectedType, fileName);
      setCustomFile("");
      setAttachedFile(null);
    } catch {
      alert("Upload failed. Please try again.");
    }
  };

  return (
    <FeatureShell
      title="Document Upload & Tracking"
      subtitle="Submit and track manual filings (MCS-150, insurance, etc.)"
      backHref="/motus"
      maxWidth="lg"
    >
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-[#0F172A]">Submit New Document</h2>
        <input
          className="w-full border rounded-xl px-4 py-2.5"
          value={selectedDot}
          onChange={(e) => setSelectedDot(e.target.value)}
          placeholder="DOT Number"
        />
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                selectedType === t
                  ? "bg-[#00bfff] border-[#00bfff] text-white"
                  : "bg-white border-[#E2E8F0] text-[#475569]"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        <input
          className="w-full border rounded-xl px-4 py-2.5"
          value={customFile}
          onChange={(e) => setCustomFile(e.target.value)}
          placeholder="File name (optional)"
        />
        <label className="block">
          <span className="text-xs font-semibold text-[#64748B] uppercase">Attach file (optional)</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="mt-1 w-full text-sm"
            onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
          />
          {attachedFile && (
            <p className="text-xs text-[#64748B] mt-1">Selected: {attachedFile.name}</p>
          )}
        </label>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !selectedDot.trim()}
          className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {isUploading ? "Uploading…" : "📤 Submit Document"}
        </button>
        <p className="text-xs text-[#64748B]">
          Submissions are tracked locally in your browser. Supabase persistence coming in a future release.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-3">
          Your Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="text-[#94A3B8] text-sm">No submissions yet.</p>
        ) : (
          <div className="grid gap-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1E293B]">{sub.fileName}</p>
                    <p className="text-sm text-[#64748B]">
                      {sub.type} • DOT {sub.dotNumber}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Submitted {formatMessageTime(sub.uploadedAt, isMilitaryTime)} (military time)
                    </p>
                  </div>
                  <StatusBadgeWeb status={sub.status} />
                </div>
                {sub.trackingNumber && (
                  <p className="text-sm text-[#475569] mt-2">Tracking: {sub.trackingNumber}</p>
                )}
                <button
                  type="button"
                  onClick={() => removeSubmission(sub.id)}
                  className="text-sm text-red-600 mt-3 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </FeatureShell>
  );
};