import { supabase } from '../../../../lib/supabase';
import { FRAUD_BLOCK_MESSAGE } from './constants';
import {
  SignupFraudContext,
  SignupRiskAssessment,
  SignupWithFraudResult,
} from './types';

function parseRiskAssessment(data: unknown): SignupRiskAssessment {
  const raw = (data ?? {}) as Partial<SignupRiskAssessment>;
  return {
    allowed: raw.allowed !== false,
    risk_level: raw.risk_level ?? 'low',
    reasons: Array.isArray(raw.reasons) ? raw.reasons : [],
    should_flag: raw.should_flag === true,
  };
}

export async function assessSignupRisk(
  email: string,
  context: SignupFraudContext = {}
): Promise<{ assessment: SignupRiskAssessment | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('assess_signup_risk', {
    p_email: email.trim().toLowerCase(),
    p_ip: context.ip ?? null,
    p_fingerprint: context.fingerprint ?? null,
    p_biometric_status: context.biometricStatus ?? null,
  });

  if (error) {
    return { assessment: null, error };
  }

  return { assessment: parseRiskAssessment(data), error: null };
}

export async function recordSignupFraud(
  email: string,
  context: SignupFraudContext,
  assessment: SignupRiskAssessment
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc('record_signup_fraud', {
    p_email: email.trim().toLowerCase(),
    p_ip: context.ip ?? null,
    p_fingerprint: context.fingerprint ?? null,
    p_risk_level: assessment.risk_level,
    p_reasons: assessment.reasons,
    p_biometric_status: context.biometricStatus ?? null,
  });

  return { error: error ?? null };
}

export async function signUpWithFraudCheck(
  email: string,
  password: string,
  fullName?: string,
  context: SignupFraudContext = {}
): Promise<SignupWithFraudResult> {
  const { assessment, error: riskError } = await assessSignupRisk(email, context);

  if (riskError) {
    return { error: riskError };
  }

  if (!assessment?.allowed) {
    return { error: new Error(FRAUD_BLOCK_MESSAGE) };
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  });

  if (error) {
    return { error };
  }

  const { error: recordError } = await recordSignupFraud(email, context, assessment);

  if (recordError) {
    console.warn('Failed to record signup fraud signals:', recordError.message);
  }

  return {
    error: null,
    needsCompany: true,
    flagged: assessment.should_flag,
    riskLevel: assessment.risk_level,
  };
}