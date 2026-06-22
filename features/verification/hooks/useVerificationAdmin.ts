import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AdminCompanyRow } from '../types';

export function useVerificationAdmin() {
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('admin_list_companies_for_verification');

    if (rpcError) {
      setError(rpcError.message);
      setCompanies([]);
    } else {
      if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in (data as object)) {
        setError(String((data as { error: string }).error));
        setCompanies([]);
      } else {
        setCompanies((Array.isArray(data) ? data : []) as AdminCompanyRow[]);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const verifyCompany = useCallback(
    async (companyId: string, verified: boolean) => {
      setUpdatingId(companyId);
      const { data, error: rpcError } = await supabase.rpc('admin_verify_company', {
        p_company_id: companyId,
        p_verified: verified,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else {
        const result = data as { success?: boolean; error?: string };
        if (!result?.success) {
          setError(result?.error ?? 'Verify failed.');
        } else {
          await fetchCompanies();
        }
      }

      setUpdatingId(null);
    },
    [fetchCompanies]
  );

  const flagCompany = useCallback(
    async (companyId: string, reason: string) => {
      setUpdatingId(companyId);
      const { data, error: rpcError } = await supabase.rpc('admin_flag_company', {
        p_company_id: companyId,
        p_reason: reason,
      });

      if (rpcError) {
        setError(rpcError.message);
      } else {
        const result = data as { success?: boolean; error?: string };
        if (!result?.success) {
          setError(result?.error ?? 'Flag failed.');
        } else {
          await fetchCompanies();
        }
      }

      setUpdatingId(null);
    },
    [fetchCompanies]
  );

  return {
    companies,
    loading,
    updatingId,
    error,
    refresh: fetchCompanies,
    verifyCompany,
    flagCompany,
  };
}