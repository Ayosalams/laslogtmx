export type VerificationStatus =
  | 'unverified'
  | 'self_attested'
  | 'admin_verified'
  | 'flagged';

export type DotMcValidationStatus = 'not_submitted' | 'valid' | 'invalid_format';

export interface CompanyPublicProfile {
  id: string;
  name: string;
  company_type: 'carrier' | 'broker' | 'mixed';
  dot_number: string | null;
  mc_number: string | null;
  verification_status: VerificationStatus;
  is_laslog_verified: boolean;
  is_fraud_flagged: boolean;
  dot_mc_validation_status: DotMcValidationStatus;
  average_rating: number | null;
  rating_count: number;
}

export interface CompanyRating {
  id: string;
  load_id: string;
  rater_company_id: string;
  rated_company_id: string;
  rater_profile_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface SubmitRatingInput {
  load_id: string;
  rating: number;
  comment?: string;
}

export interface SelfAttestInput {
  dot_number: string;
  mc_number?: string;
}

export interface AdminCompanyRow {
  id: string;
  name: string;
  dot_number: string | null;
  mc_number: string | null;
  company_type: string;
  verification_status: VerificationStatus;
  is_laslog_verified: boolean;
  is_fraud_flagged: boolean;
  average_rating: number | null;
  rating_count: number;
}