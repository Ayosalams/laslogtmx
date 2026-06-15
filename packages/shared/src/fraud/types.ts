export type FraudRiskLevel = 'low' | 'medium' | 'high';

export interface SignupRiskAssessment {
  allowed: boolean;
  risk_level: FraudRiskLevel;
  reasons: string[];
  should_flag: boolean;
}

import type { BiometricStatus } from '../biometrics/types';

export interface SignupFraudContext {
  ip?: string;
  fingerprint?: string;
  biometricStatus?: BiometricStatus;
}

export interface SignupWithFraudResult {
  error: Error | null;
  needsCompany?: boolean;
  flagged?: boolean;
  riskLevel?: FraudRiskLevel;
}