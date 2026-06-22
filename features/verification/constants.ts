import type { VerificationStatus } from './types';

export const VERIFICATION_COLORS = {
  verified: '#047857',
  verifiedBg: '#D1FAE5',
  selfAttested: '#0369A1',
  selfAttestedBg: '#E0F2FE',
  adminVerified: '#047857',
  adminVerifiedBg: '#D1FAE5',
  flagged: '#991B1B',
  flaggedBg: '#FEE2E2',
  unverified: '#64748B',
  unverifiedBg: '#F1F5F9',
  star: '#F59E0B',
  starEmpty: '#CBD5E1',
  accent: '#00BFFF',
} as const;

export const VERIFIED_BADGE_LABEL = 'laslogTMX Verified';
export const ADMIN_VERIFIED_LABEL = 'Admin Verified';
export const SELF_ATTESTED_LABEL = 'DOT/MC Verified';
export const FRAUD_FLAG_LABEL = 'Fraud Flagged';
export const UNVERIFIED_LABEL = 'Unverified';

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: UNVERIFIED_LABEL,
  self_attested: SELF_ATTESTED_LABEL,
  admin_verified: ADMIN_VERIFIED_LABEL,
  flagged: FRAUD_FLAG_LABEL,
};

export const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export const FRAUD_FLAG_REASONS = [
  'suspicious_activity',
  'duplicate_dot_mc',
  'payment_fraud',
  'identity_mismatch',
  'chargeback_pattern',
  'other',
] as const;