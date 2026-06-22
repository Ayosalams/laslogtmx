import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { SubmitRatingInput } from '../types';

export function useCompanyRatings() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(async (input: SubmitRatingInput) => {
    setSubmitting(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('submit_company_rating', {
      p_load_id: input.load_id,
      p_rating: input.rating,
      p_comment: input.comment ?? null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return { success: false, error: rpcError.message };
    }

    const result = data as { success?: boolean; error?: string };
    if (!result?.success) {
      const errMap: Record<string, string> = {
        load_not_complete: 'Load must be marked complete before rating.',
        contract_required: 'A contract must exist before rating.',
        not_participant: 'Only load participants can submit ratings.',
        invalid_rating: 'Rating must be between 1 and 5.',
      };
      const errMsg = errMap[result?.error ?? ''] ?? result?.error ?? 'Rating failed.';
      setError(errMsg);
      setSubmitting(false);
      return { success: false, error: errMsg };
    }

    setSubmitting(false);
    return { success: true, error: null, ratedCompanyId: (result as { rated_company_id?: string }).rated_company_id };
  }, []);

  const closeLoad = useCallback(async (loadId: string) => {
    setSubmitting(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('close_load_board_load', {
      p_load_id: loadId,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return { success: false, error: rpcError.message };
    }

    const result = data as { success?: boolean; error?: string };
    if (!result?.success) {
      const errMsg = result?.error ?? 'Failed to close load.';
      setError(errMsg);
      setSubmitting(false);
      return { success: false, error: errMsg };
    }

    setSubmitting(false);
    return { success: true, error: null };
  }, []);

  return { submitRating, closeLoad, submitting, error };
}