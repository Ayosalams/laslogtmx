import { useMemo } from 'react';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { evaluateAiChatAccess, type AiChatAccessResult } from '../access/aiChatAccess';

export type { AiChatAccessResult };

/**
 * Tier-gated AI Chat access via AuthContext company subscription fields.
 * Pro Broker+ for RAG/LLM; load_board domain also requires laslogTMX Verified.
 */
export function useAiChatAccess(): AiChatAccessResult {
  const { company } = useAuth();

  return useMemo(
    () =>
      evaluateAiChatAccess({
        subscription_tier: company?.subscription_tier,
        is_laslog_verified: company?.is_laslog_verified,
        is_active: company?.is_active,
        company_type: company?.company_type,
      }),
    [
      company?.subscription_tier,
      company?.is_laslog_verified,
      company?.is_active,
      company?.company_type,
    ]
  );
}