export type BoardLoadStatus =
  | 'draft'
  | 'open'
  | 'bidding'
  | 'negotiating'
  | 'awarded'
  | 'closed'
  | 'cancelled';

export type BidStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn';

export type ContractStatus = 'draft' | 'pending_signatures' | 'signed' | 'void';

export interface BoardLoad {
  id: string;
  company_id: string;
  load_number: string;
  status: string;
  board_status: BoardLoadStatus;
  is_internal_board: boolean;
  is_laslog_verified: boolean;
  origin: string | null;
  destination: string | null;
  equipment: string | null;
  rate_cents: number | null;
  weight_lbs: number | null;
  commodity: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  notes: string | null;
  negotiation_channel_id: string | null;
  created_at: string;
  updated_at: string;
  broker_name?: string;
  bid_count?: number;
}

export interface LoadBid {
  id: string;
  load_id: string;
  company_id: string;
  bidder_profile_id: string;
  rate_cents: number;
  notes: string | null;
  status: BidStatus;
  negotiation_channel_id: string | null;
  created_at: string;
  updated_at: string;
  bidder_name?: string;
  carrier_name?: string;
}

export interface LoadContract {
  id: string;
  load_id: string;
  bid_id: string;
  broker_company_id: string;
  carrier_company_id: string;
  contract_number: string;
  agreed_rate_cents: number;
  contract_body: string;
  pdf_storage_path: string | null;
  status: ContractStatus;
  broker_signed_at: string | null;
  carrier_signed_at: string | null;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface PostLoadInput {
  load_number: string;
  origin: string;
  destination: string;
  equipment: string;
  rate_cents: number;
  commodity?: string;
  weight_lbs?: number;
  pickup_date: string;
  delivery_date: string;
  notes?: string;
}

export interface SubmitBidInput {
  load_id: string;
  rate_cents: number;
  notes?: string;
}

export interface LoadDetailParams {
  loadId: string;
}