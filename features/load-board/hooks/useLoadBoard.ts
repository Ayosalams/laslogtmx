import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import type { BoardLoad, PostLoadInput } from '../types';
import { useLoadBoardAccess } from './useLoadBoardAccess';
import { checkRateLimit, LOADBOARD_POST_LIMIT } from '../../../packages/shared/src/utils/rateLimiter';
import { captureException } from '../../../packages/shared/src/utils/errorLogger';

function generateLoadNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IB-${Date.now().toString(36).toUpperCase().slice(-4)}${suffix}`;
}

export function useLoadBoard() {
  const { profile, company } = useAuth();
  const access = useLoadBoardAccess();
  const [loads, setLoads] = useState<BoardLoad[]>([]);
  const [myPostedLoads, setMyPostedLoads] = useState<BoardLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoads = useCallback(async () => {
    if (!access.canAccess || !profile?.company_id) {
      setLoads([]);
      setMyPostedLoads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const openQuery = supabase
      .from('loads')
      .select('*')
      .eq('is_internal_board', true)
      .in('board_status', ['open', 'bidding', 'negotiating'])
      .neq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    const myQuery = supabase
      .from('loads')
      .select('*')
      .eq('is_internal_board', true)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    const [openRes, myRes] = await Promise.all([openQuery, myQuery]);

    if (openRes.error) setError(openRes.error.message);
    if (myRes.error) setError(myRes.error.message);

    setLoads((openRes.data as BoardLoad[]) ?? []);
    setMyPostedLoads((myRes.data as BoardLoad[]) ?? []);
    setLoading(false);
  }, [access.canAccess, profile?.company_id]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  useEffect(() => {
    if (!access.canAccess) return;

    const channel = supabase
      .channel('load-board-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loads' },
        () => fetchLoads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [access.canAccess, fetchLoads]);

  const postLoad = useCallback(
    async (input: PostLoadInput) => {
      if (!access.canPost || !profile?.company_id) {
        return { load: null, error: new Error('Only verified brokers may post loads.') };
      }

      // App-level rate limiting (Load Board posting)
      try {
        const rate = await checkRateLimit(
          `loadboard:post:${profile.company_id}`,
          LOADBOARD_POST_LIMIT.max,
          LOADBOARD_POST_LIMIT.window
        );
        if (!rate.success) {
          const msg = 'Rate limit exceeded for posting loads. Please wait a minute and try again.';
          setError(msg);
          captureException(new Error(msg), { feature: 'load-board', action: 'postLoad', companyId: profile.company_id });
          return { load: null, error: new Error(msg) };
        }
      } catch (rateErr) {
        captureException(rateErr, { feature: 'load-board', action: 'rate-check' });
        // continue (fail-open for UX in fallback)
      }

      setPosting(true);
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from('loads')
          .insert({
            company_id: profile.company_id,
            load_number: input.load_number || generateLoadNumber(),
            status: 'pending',
            board_status: 'open',
            is_internal_board: true,
            is_laslog_verified: true,
            origin: input.origin,
            destination: input.destination,
            equipment: input.equipment,
            rate_cents: input.rate_cents,
            commodity: input.commodity ?? null,
            weight_lbs: input.weight_lbs ?? null,
            pickup_date: input.pickup_date,
            delivery_date: input.delivery_date,
            notes: input.notes ?? null,
            created_by: profile.id,
          })
          .select('*')
          .single();

        if (insertError || !data) {
          throw new Error(insertError?.message ?? 'Failed to post load');
        }

        await fetchLoads();
        return { load: data as BoardLoad, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Post failed';
        setError(message);
        captureException(err, { feature: 'load-board', action: 'postLoad' });
        return { load: null, error: new Error(message) };
      } finally {
        setPosting(false);
      }
    },
    [access.canPost, profile, fetchLoads]
  );

  return {
    loads,
    myPostedLoads,
    loading,
    posting,
    error,
    access,
    companyName: company?.name ?? 'Your Company',
    refresh: fetchLoads,
    postLoad,
  };
}