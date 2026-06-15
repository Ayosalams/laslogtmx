import type { SupportTicketStatus } from '../chat/types';
import type { AdminTabId } from './types';

/** Shared admin dashboard brand tokens (light theme + electric blue) */
export const ADMIN_BRAND = {
  accent: '#1E40AF',
  accentBright: '#00bfff',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  success: '#047857',
  warning: '#B45309',
  danger: '#991B1B',
} as const;

export const ADMIN_TABS: { id: AdminTabId; label: string }[] = [
  { id: 'tickets', label: 'Support & Refunds' },
  { id: 'cble', label: 'CBLE Content' },
  { id: 'users', label: 'Users' },
];

export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  refund_requested: 'Refund Requested',
  credit_offered: 'Credit Offered',
  full_refund_pending: 'Full Refund Pending',
  in_review: 'In Review',
  resolved: 'Resolved',
  denied: 'Denied',
};

export const TICKET_ACTIONS: {
  label: string;
  status: SupportTicketStatus;
  variant: 'primary' | 'secondary' | 'danger';
}[] = [
  { label: 'Offer Credit', status: 'credit_offered', variant: 'primary' },
  { label: 'Full Refund', status: 'full_refund_pending', variant: 'primary' },
  { label: 'Mark In Review', status: 'in_review', variant: 'secondary' },
  { label: 'Resolve', status: 'resolved', variant: 'secondary' },
  { label: 'Deny', status: 'denied', variant: 'danger' },
];