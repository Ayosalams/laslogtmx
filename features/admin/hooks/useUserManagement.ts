import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Company, Profile } from '../../../packages/shared/src/auth/types';

export function useUserManagement(companyId: string | null | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId) {
      setCompany(null);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [companyResult, usersResult] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('role', { ascending: true }),
    ]);

    if (companyResult.error) {
      setError(companyResult.error.message);
      setCompany(null);
    } else {
      setCompany(companyResult.data as Company);
    }

    if (usersResult.error) {
      setError(usersResult.error.message);
      setUsers([]);
    } else {
      setUsers((usersResult.data ?? []) as Profile[]);
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    company,
    users,
    loading,
    error,
    refresh: fetchData,
  };
}