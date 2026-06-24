import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import type { BoardLoad, LoadBid, LoadContract, SubmitBidInput } from '../types';
import { useLoadBoardAccess } from './useLoadBoardAccess';
import { checkRateLimit, LOADBOARD_BID_LIMIT } from '../../../packages/shared/src/utils/rateLimiter';
import { captureException } from '../../../packages/shared/src/utils/errorLogger';

async function ensureNegotiationChannel(
  load: BoardLoad,
  bidId: string
): Promise<string | null> {
  const channelName = `Load ${load.load_number} — Negotiation`;
  const loadRef = load.id;

  const { data: existing } = await supabase
    .from('channels')
    .select('id')
    .eq('load_id', loadRef)
    .eq('is_active', true)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // load_id-only channel: cross-company negotiation per chat RLS (load_id IS NOT NULL)
  const { data: created, error } = await supabase
    .from('channels')
    .insert({
      name: channelName,
      company_id: null,
      load_id: loadRef,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !created) {
    console.error('negotiation channel error', error);
    return null;
  }

  await supabase
    .from('load_bids')
    .update({ negotiation_channel_id: created.id })
    .eq('id', bidId);

  await supabase
    .from('loads')
    .update({
      negotiation_channel_id: created.id,
      board_status: 'bidding',
    })
    .eq('id', load.id);

  return created.id;
}

export function useBidding(loadId: string | undefined) {
  const { profile } = useAuth();
  const access = useLoadBoardAccess();
  const [load, setLoad] = useState<BoardLoad | null>(null);
  const [bids, setBids] = useState<LoadBid[]>([]);
  const [contract, setContract] = useState<LoadContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPoster = load?.company_id === profile?.company_id;

  const fetchDetail = useCallback(async () => {
    if (!loadId || !access.canAccess) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [loadRes, bidsRes, contractRes] = await Promise.all([
      supabase.from('loads').select('*').eq('id', loadId).single(),
      supabase
        .from('load_bids')
        .select('*')
        .eq('load_id', loadId)
        .order('created_at', { ascending: false }),
      supabase.from('load_contracts').select('*').eq('load_id', loadId).maybeSingle(),
    ]);

    if (loadRes.error) setError(loadRes.error.message);
    setLoad((loadRes.data as BoardLoad) ?? null);
    setBids((bidsRes.data as LoadBid[]) ?? []);
    setContract((contractRes.data as LoadContract) ?? null);
    setLoading(false);
  }, [loadId, access.canAccess]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!loadId || !access.canAccess) return;

    const channel = supabase
      .channel(`load-detail:${loadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'load_bids', filter: `load_id=eq.${loadId}` },
        () => fetchDetail()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'load_contracts', filter: `load_id=eq.${loadId}` },
        () => fetchDetail()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loads', filter: `id=eq.${loadId}` },
        () => fetchDetail()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadId, access.canAccess, fetchDetail]);

  const submitBid = useCallback(
    async (input: SubmitBidInput) => {
      if (!access.canBid || !profile?.company_id || !load) {
        return { bid: null, error: new Error('Only verified carriers may submit bids.') };
      }

      if (load.company_id === profile.company_id) {
        return { bid: null, error: new Error('You cannot bid on your own load.') };
      }

      // App-level rate limiting (Load Board bidding)
      try {
        const rate = await checkRateLimit(
          `loadboard:bid:${profile.company_id}`,
          LOADBOARD_BID_LIMIT.max,
          LOADBOARD_BID_LIMIT.window
        );
        if (!rate.success) {
          const msg = 'Rate limit exceeded for bidding. Please wait a minute and try again.';
          setError(msg);
          captureException(new Error(msg), { feature: 'load-board', action: 'submitBid', companyId: profile.company_id });
          return { bid: null, error: new Error(msg) };
        }
      } catch (rateErr) {
        captureException(rateErr, { feature: 'load-board', action: 'rate-check-bid' });
      }

      setSubmitting(true);
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from('load_bids')
          .insert({
            load_id: input.load_id,
            company_id: profile.company_id,
            bidder_profile_id: profile.id,
            rate_cents: input.rate_cents,
            notes: input.notes ?? null,
            status: 'pending',
          })
          .select('*')
          .single();

        if (insertError || !data) {
          throw new Error(insertError?.message ?? 'Bid submission failed');
        }

        const channelId = await ensureNegotiationChannel(load, data.id);

        await fetchDetail();
        return { bid: data as LoadBid, channelId, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Bid failed';
        setError(message);
        captureException(err, { feature: 'load-board', action: 'submitBid' });
        return { bid: null, error: new Error(message) };
      } finally {
        setSubmitting(false);
      }
    },
    [access.canBid, profile, load, fetchDetail]
  );

  const updateBidStatus = useCallback(
    async (bidId: string, status: LoadBid['status']) => {
      if (!isPoster && status !== 'withdrawn') {
        return { error: new Error('Only the load poster may accept or reject bids.') };
      }

      const { error: updateError } = await supabase
        .from('load_bids')
        .update({ status })
        .eq('id', bidId);

      if (updateError) {
        setError(updateError.message);
        return { error: new Error(updateError.message) };
      }

      if (status === 'accepted' && load) {
        await supabase
          .from('loads')
          .update({ board_status: 'negotiating' })
          .eq('id', load.id);
      }

      await fetchDetail();
      return { error: null };
    },
    [isPoster, load, fetchDetail]
  );

  const generateContract = useCallback(
    async (bidId: string) => {
      setGenerating(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('generate_load_contract', {
        p_bid_id: bidId,
      });

      if (rpcError) {
        setError(rpcError.message);
        setGenerating(false);
        return { contractId: null, error: new Error(rpcError.message) };
      }

      await fetchDetail();
      setGenerating(false);
      return { contractId: data as string, error: null };
    },
    [fetchDetail]
  );

  const myBid = bids.find((b) => b.company_id === profile?.company_id);
  const acceptedBid = bids.find((b) => b.status === 'accepted');

  return {
    load,
    bids,
    contract,
    loading,
    submitting,
    generating,
    error,
    access,
    isPoster,
    myBid,
    acceptedBid,
    refresh: fetchDetail,
    submitBid,
    updateBidStatus,
    generateContract,
  };
}