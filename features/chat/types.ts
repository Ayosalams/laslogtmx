export interface ChatChannel {
  id: string;
  name: string;
  company_id?: string | null;
  load_id?: string | null;
  is_active: boolean;
  lastMessage?: string;
  updated_at?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reported?: boolean;
  is_system?: boolean;
  // Optional denormalized sender info (can be enriched client or via join)
  sender_name?: string;
}

export type SupportTicketStatus =
  | 'refund_requested'
  | 'credit_offered'
  | 'full_refund_pending'
  | 'in_review'
  | 'resolved'
  | 'denied';

export interface SupportTicket {
  id: string;
  company_id: string;
  channel_id?: string | null;
  created_by: string;
  type: 'refund' | 'billing' | 'general';
  status: SupportTicketStatus;
  amount_cents?: number | null;
  reason?: string | null;
  screenshot_path?: string | null;
  trigger_message?: string | null;
  escalated_to_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefundRequestPayload {
  amount: string;
  reason: string;
  screenshotFileName?: string;
  triggerMessage: string;
}

export interface MessageReport {
  id: string;
  message_id: string;
  reporter_user_id: string;
  reason?: string;
  created_at: string;
}

// Navigation params for ChatRoom
export interface ChatRoomParams {
  channelId: string;
  channelName: string;
}
