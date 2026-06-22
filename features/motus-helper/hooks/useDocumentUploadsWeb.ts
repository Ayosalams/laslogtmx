import { useState, useCallback, useEffect } from "react";
import type { MotusSubmission } from "../types";

const STORAGE_KEY = "laslogtmx_motus_submissions";

function loadSubmissions(dot?: string): MotusSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MotusSubmission[];
  } catch {
    /* ignore */
  }
  return dot
    ? [
        {
          id: "demo-001",
          dotNumber: dot,
          type: "MCS-150",
          fileName: "MCS-150_Update_2026.pdf",
          uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          status: "Under Review",
          trackingNumber: "MOT-28491",
          notes: "Submitted via MOTUS portal",
        },
      ]
    : [];
}

function persistSubmissions(items: MotusSubmission[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useDocumentUploadsWeb(initialDot?: string) {
  const [submissions, setSubmissions] = useState<MotusSubmission[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setSubmissions(loadSubmissions(initialDot));
  }, [initialDot]);

  const uploadDocument = useCallback(
    async (
      dotNumber: string,
      type: MotusSubmission["type"],
      fileName: string = "document.pdf"
    ): Promise<MotusSubmission> => {
      setIsUploading(true);
      await new Promise((r) => setTimeout(r, 650));

      const newSubmission: MotusSubmission = {
        id: `sub-${Date.now()}`,
        dotNumber,
        type,
        fileName,
        uploadedAt: new Date().toISOString(),
        status: "Pending",
        trackingNumber: `MOT-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: "Manual submission — awaiting FMCSA processing",
      };

      setSubmissions((prev) => {
        const next = [newSubmission, ...prev];
        persistSubmissions(next);
        return next;
      });
      setIsUploading(false);
      return newSubmission;
    },
    []
  );

  const removeSubmission = useCallback((id: string) => {
    setSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSubmissions(next);
      return next;
    });
  }, []);

  return {
    submissions,
    isUploading,
    uploadDocument,
    removeSubmission,
  };
}