import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { CompanyPublicProfile } from '../types';

function parseProfile(data: unknown): CompanyPublicProfile | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  if (row.error) return null;
  return {
    id: String(row.id),
    name: String(row.name ?? 'Unknown'),
    company_type: (row.company_type as CompanyPublicProfile['company_type']) ?? 'carrier',
    dot_number: (row.dot_number as string) ?? null,
    mc_number: (row.mc_number as string) ?? null,
    verification_status: (row.verification_status as CompanyPublicProfile['verification_status']) ?? 'unverified',
    is_laslog_verified: Boolean(row.is_laslog_verified),
    is_fraud_flagged: Boolean(row.is_fraud_flagged),
    dot_mc_validation_status:
      (row.dot_mc_validation_status as CompanyPublicProfile['dot_mc_validation_status']) ?? 'not_submitted',
    average_rating: row.average_rating != null ? Number(row.average_rating) : null,
    rating_count: Number(row.rating_count ?? 0),
  };
}

export function useCompanyProfile(companyId: string | null | undefined) {
  const [profile, setProfile] = useState<CompanyPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!companyId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('get_company_public_profile', {
      p_company_id: companyId,
    });

    if (rpcError) {
      setError(rpcError.message);
      setProfile(null);
    } else {
      setProfile(parseProfile(data));
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile };
}

/** Batch-fetch profiles for load board list cards. */
export function useCompanyProfiles(companyIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, CompanyPublicProfile>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    const unique = [...new Set(companyIds.filter(Boolean))];
    if (unique.length === 0) {
      setProfiles({});
      return;
    }

    setLoading(true);
    const results = await Promise.all(
      unique.map(async (id) => {
        const { data } = await supabase.rpc('get_company_public_profile', { p_company_id: id });
        return { id, profile: parseProfile(data) };
      })
    );

    const map: Record<string, CompanyPublicProfile> = {};
    for (const { id, profile } of results) {
      if (profile) map[id] = profile;
    }
    setProfiles(map);
    setLoading(false);
  }, [companyIds.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { profiles, loading, refresh: fetchAll };
}