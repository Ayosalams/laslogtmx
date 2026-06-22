import { useEffect, useRef } from 'react';
import type { BoardLoad, LoadBid, LoadContract } from '../../load-board/types';
import type { DetentionSession } from '../types';

interface StartTimerFn {
  (params: {
    loadNumber: string;
    loadId?: string | null;
    facility?: 'pickup' | 'delivery';
    freeMinutes?: number;
  }): Promise<{ error: string | null }>;
}

interface AutoDetentionParams {
  load: BoardLoad | null | undefined;
  contract: LoadContract | null | undefined;
  myBid: LoadBid | undefined;
  carrierCompanyId: string | null | undefined;
  isActive: boolean;
  session: DetentionSession | null;
  startTimer: StartTimerFn;
  enabled?: boolean;
}

/**
 * Auto-starts detention timer when the carrier is assigned to a load
 * (accepted bid or generated contract). Only fires once per load visit.
 */
export function useAutoDetentionOnAssignment({
  load,
  contract,
  myBid,
  carrierCompanyId,
  isActive,
  session,
  startTimer,
  enabled = true,
}: AutoDetentionParams): void {
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !load || !carrierCompanyId) return;

    const isCarrierAssigned =
      contract?.carrier_company_id === carrierCompanyId ||
      (myBid?.status === 'accepted' && myBid.company_id === carrierCompanyId);

    const assignmentActive =
      !!contract ||
      myBid?.status === 'accepted' ||
      ['negotiating', 'awarded'].includes(load.board_status);

    if (!isCarrierAssigned || !assignmentActive) return;
    if (session?.loadId === load.id) return;
    if (isActive && session?.loadId && session.loadId !== load.id) return;
    if (attemptedRef.current === load.id) return;

    attemptedRef.current = load.id;
    void startTimer({
      loadNumber: load.load_number,
      loadId: load.id,
      facility: 'pickup',
    });
  }, [
    enabled,
    load,
    contract,
    myBid,
    carrierCompanyId,
    isActive,
    session?.loadId,
    startTimer,
  ]);
}