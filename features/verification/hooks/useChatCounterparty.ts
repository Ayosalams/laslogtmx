import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
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

/** Resolve counterparty company profile for load negotiation chats. */
export function useChatCounterparty(channelId: string | undefined) {
  const { profile } = useAuth();
  const [counterparty, setCounterparty] = useState<CompanyPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCounterparty = useCallback(async () => {
    if (!channelId || !profile?.company_id) {
      setCounterparty(null);
      return;
    }

    setLoading(true);

    const { data: channel } = await supabase
      .from('channels')
      .select('load_id')
      .eq('id', channelId)
      .maybeSingle();

    if (!channel?.load_id) {
      setCounterparty(null);
      setLoading(false);
      return;
    }

    const { data: load } = await supabase
      .from('loads')
      .select('company_id')
      .eq('id', channel.load_id)
      .maybeSingle();

    const { data: contract } = await supabase
      .from('load_contracts')
      .select('carrier_company_id')
      .eq('load_id', channel.load_id)
      .maybeSingle();

    const { data: bids } = await supabase
      .from('load_bids')
      .select('company_id')
      .eq('load_id', channel.load_id)
      .in('status', ['pending', 'countered', 'accepted'])
      .limit(1);

    let counterpartyId: string | null = null;
    const myCompany = profile.company_id;
    const brokerId = load?.company_id;

    if (brokerId && brokerId !== myCompany) {
      counterpartyId = brokerId;
    } else if (contract?.carrier_company_id && contract.carrier_company_id !== myCompany) {
      counterpartyId = contract.carrier_company_id;
    } else if (bids?.[0]?.company_id && bids[0].company_id !== myCompany) {
      counterpartyId = bids[0].company_id;
    } else if (brokerId) {
      counterpartyId = brokerId;
    }

    if (!counterpartyId) {
      setCounterparty(null);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase.rpc('get_company_public_profile', {
      p_company_id: counterpartyId,
    });

    setCounterparty(parseProfile(profileData));
    setLoading(false);
  }, [channelId, profile?.company_id]);

  useEffect(() => {
    fetchCounterparty();
  }, [fetchCounterparty]);

  return { counterparty, loading, refresh: fetchCounterparty };
}