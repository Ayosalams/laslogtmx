import { useState, useCallback, useEffect } from 'react';
import { MotusSubmission } from '../types';

/**
 * useDocumentUploads
 * Document upload + tracking for manual FMCSA submissions (MCS-150, insurance, claims, etc.).
 * Currently uses in-memory state (demo). In production:
 *   - Upload to Supabase Storage bucket `motus-documents`
 *   - Persist metadata in `motus_submissions` table with RLS by company/user
 *   - Use expo-document-picker + expo-file-system for real file selection
 * Timestamps are ISO; format with military time in UI via shared formatMessageTime.
 */
export function useDocumentUploads(initialDot?: string) {
  const [submissions, setSubmissions] = useState<MotusSubmission[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Demo persistence - in real app replace with Supabase + AsyncStorage cache
  const STORAGE_KEY = 'laslogtmx_motus_submissions';

  // Load from "storage" on mount (simulated)
  useEffect(() => {
    // In real RN: AsyncStorage.getItem(STORAGE_KEY).then...
    // For demo we start empty or seed one example
    const demoSeed: MotusSubmission[] = initialDot
      ? [
          {
            id: 'demo-001',
            dotNumber: initialDot,
            type: 'MCS-150',
            fileName: 'MCS-150_Update_2026.pdf',
            uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
            status: 'Under Review',
            trackingNumber: 'MOT-28491',
            notes: 'Submitted via MOTUS portal',
          },
        ]
      : [];
    setSubmissions(demoSeed);
  }, [initialDot]);

  const uploadDocument = useCallback(
    async (
      dotNumber: string,
      type: MotusSubmission['type'],
      fileName: string = 'document.pdf'
    ): Promise<MotusSubmission> => {
      setIsUploading(true);

      // Simulate file selection + upload delay
      await new Promise((r) => setTimeout(r, 780));

      const newSubmission: MotusSubmission = {
        id: `sub-${Date.now()}`,
        dotNumber,
        type,
        fileName,
        uploadedAt: new Date().toISOString(),
        status: 'Pending',
        trackingNumber: `MOT-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: 'Manual submission - awaiting FMCSA processing',
      };

      setSubmissions((prev) => [newSubmission, ...prev]);
      setIsUploading(false);

      // TODO: persist to AsyncStorage + Supabase here
      return newSubmission;
    },
    []
  );

  const updateStatus = useCallback((id: string, newStatus: MotusSubmission['status'], notes?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: newStatus,
              notes: notes || s.notes,
            }
          : s
      )
    );
  }, []);

  const removeSubmission = useCallback((id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    submissions,
    isUploading,
    uploadDocument,
    updateStatus,
    removeSubmission,
  };
}
