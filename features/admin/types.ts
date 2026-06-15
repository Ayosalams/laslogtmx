import type { SupportTicketStatus } from '../chat/types';
import type { CbleMaterial, CbleMaterialType, CbleCategoryId } from '../cble-prep/types';
import type { Profile, Company } from '../../packages/shared/src/auth/types';

export type AdminTabId = 'tickets' | 'cble' | 'users';

export interface SupportTicketWithCompany {
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
  company_name?: string;
}

export interface NewCbleMaterialInput {
  title: string;
  description: string;
  type: CbleMaterialType;
  categoryId: CbleCategoryId;
  durationMinutes?: number;
  assetPath?: string;
  requiresFullAccess: boolean;
}

export interface AdminCbleMaterial extends CbleMaterial {
  isDraft?: boolean;
}

export interface CompanyWithUsers {
  company: Company;
  users: Profile[];
}