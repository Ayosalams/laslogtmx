import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { validateDotMcFormat } from '../utils/validateDotMc';
import type { SelfAttestInput } from '../types';

export function useCompanyVerification() {
  const { company, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selfAttest = useCallback(
    async (input: SelfAttestInput) => {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const validation = validateDotMcFormat(input.dot_number, input.mc_number);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid DOT/MC format.');
        setSubmitting(false);
        return { success: false, error: validation.error };
      }

      const { data, error: rpcError } = await supabase.rpc('self_attest_dot_mc', {
        p_dot_number: input.dot_number,
        p_mc_number: input.mc_number ?? null,
      });

      if (rpcError) {
        setError(rpcError.message);
        setSubmitting(false);
        return { success: false, error: rpcError.message };
      }

      const result = data as { success?: boolean; error?: string };
      if (!result?.success) {
        const errMsg =
          result?.error === 'duplicate_dot'
            ? 'This DOT number is already registered to another company.'
            : result?.error ?? 'Verification failed.';
        setError(errMsg);
        setSubmitting(false);
        return { success: false, error: errMsg };
      }

      await refreshProfile();
      setMessage('DOT/MC verified. Your company is now laslogTMX Verified.');
      setSubmitting(false);
      return { success: true, error: null };
    },
    [refreshProfile]
  );

  return {
    company,
    verificationStatus: company?.verification_status ?? 'unverified',
    isFraudFlagged: Boolean(company?.is_fraud_flagged),
    isVerified: Boolean(company?.is_laslog_verified && !company?.is_fraud_flagged),
    selfAttest,
    submitting,
    error,
    message,
    clearMessage: () => setMessage(null),
  };
}