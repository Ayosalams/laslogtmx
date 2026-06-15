import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { SupportTicketStatus } from '../../chat/types';
import type { SupportTicketWithCompany } from '../types';

function mapTicketRow(row: Record<string, unknown>): SupportTicketWithCompany {
  const company = row.companies as { name?: string } | null;
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    channel_id: row.channel_id as string | null | undefined,
    created_by: row.created_by as string,
    type: row.type as SupportTicketWithCompany['type'],
    status: row.status as SupportTicketStatus,
    amount_cents: row.amount_cents as number | null | undefined,
    reason: row.reason as string | null | undefined,
    screenshot_path: row.screenshot_path as string | null | undefined,
    trigger_message: row.trigger_message as string | null | undefined,
    escalated_to_admin: row.escalated_to_admin as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    company_name: company?.name,
  };
}

export function useSupportTicketQueue(companyId: string | null | undefined) {
  const [tickets, setTickets] = useState<SupportTicketWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!companyId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*, companies(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setTickets([]);
    } else {
      setTickets((data ?? []).map((row) => mapTicketRow(row as Record<string, unknown>)));
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = useCallback(
    async (ticketId: string, status: SupportTicketStatus) => {
      setUpdatingId(ticketId);
      setError(null);

      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
        );
      }

      setUpdatingId(null);
    },
    []
  );

  return {
    tickets,
    loading,
    error,
    updatingId,
    refresh: fetchTickets,
    updateTicketStatus,
  };
}