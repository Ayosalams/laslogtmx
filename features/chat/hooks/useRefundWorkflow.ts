import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  REFUND_ADMIN_ESCALATION_THRESHOLD_USD,
} from '../constants';
import { RefundRequestPayload, SupportTicket } from '../types';

interface SubmitRefundParams {
  channelId: string;
  payload: RefundRequestPayload;
}

interface SubmitRefundResult {
  ticket: SupportTicket;
  systemMessage: string;
  escalated: boolean;
}

function parseAmountCents(amount: string): number | null {
  const cleaned = amount.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) return null;
  return Math.round(value * 100);
}

function formatTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function buildAutomatedResponse(ticketId: string, escalated: boolean): string {
  const shortId = formatTicketId(ticketId);
  const base =
    `Thank you for contacting laslogTMX Support. We understand billing concerns matter, and we're here to help.\n\n` +
    `As a first option, we'd like to offer account credit toward your next load — this is typically the fastest resolution and keeps your operations moving.\n\n` +
    `If you prefer a full refund to your original payment method instead, we can arrange that as well (usually 5–7 business days).\n\n` +
    `Your request has been logged as Ticket #${shortId}. A member of our team will follow up shortly.`;

  if (escalated) {
    return (
      base +
      `\n\nGiven the requested amount, this ticket has been escalated to our billing team for priority review.`
    );
  }

  return base;
}

export function useRefundWorkflow() {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const uploadScreenshot = useCallback(
    async (companyId: string, ticketId: string, fileName: string): Promise<string> => {
      setUploadingScreenshot(true);
      try {
        // Simulated upload path — production: Supabase Storage bucket `chat-attachments`
        await new Promise((r) => setTimeout(r, 600));
        return `chat-attachments/${companyId}/${ticketId}/${fileName}`;
      } finally {
        setUploadingScreenshot(false);
      }
    },
    []
  );

  const submitRefundRequest = useCallback(
    async ({ channelId, payload }: SubmitRefundParams): Promise<SubmitRefundResult> => {
      setSubmitting(true);

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid || userError) {
          throw new Error('Please sign in to submit a refund request.');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', uid)
          .single();

        if (profileError || !profile?.company_id) {
          throw new Error('Your account must be linked to a company to submit refund requests.');
        }

        const amountCents = parseAmountCents(payload.amount);
        const escalated =
          amountCents !== null &&
          amountCents > REFUND_ADMIN_ESCALATION_THRESHOLD_USD * 100;

        const { data: ticket, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            company_id: profile.company_id,
            channel_id: channelId,
            created_by: uid,
            type: 'refund',
            status: 'refund_requested',
            amount_cents: amountCents,
            reason: payload.reason.trim() || null,
            trigger_message: payload.triggerMessage.trim(),
            escalated_to_admin: escalated,
          })
          .select('*')
          .single();

        if (ticketError || !ticket) {
          throw new Error(ticketError?.message || 'Could not create support ticket.');
        }

        let screenshotPath: string | null = null;
        if (payload.screenshotFileName) {
          screenshotPath = await uploadScreenshot(
            profile.company_id,
            ticket.id,
            payload.screenshotFileName
          );

          await supabase
            .from('support_tickets')
            .update({ screenshot_path: screenshotPath })
            .eq('id', ticket.id);
        }

        const systemMessage = buildAutomatedResponse(ticket.id, escalated);

        const { error: userMessageError } = await supabase.from('messages').insert({
          channel_id: channelId,
          user_id: uid,
          content: payload.triggerMessage.trim(),
        });

        if (userMessageError) {
          console.error('user trigger message insert error', userMessageError);
        }

        const { error: messageError } = await supabase.from('messages').insert({
          channel_id: channelId,
          user_id: uid,
          content: systemMessage,
          is_system: true,
        });

        if (messageError) {
          console.error('system message insert error', messageError);
        }

        return {
          ticket: { ...ticket, screenshot_path: screenshotPath } as SupportTicket,
          systemMessage,
          escalated,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [uploadScreenshot]
  );

  return {
    submitting,
    uploadingScreenshot,
    submitRefundRequest,
  };
}