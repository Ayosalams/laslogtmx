import {
  CBLE_MIN_TIER,
  getTierLabel,
  meetsMinimumTier,
  type SubscriptionTier,
} from '../../../packages/shared/src/constants/subscription';
import type { AiChatDomain } from '../types';

/** Minimum tier for advanced OKF RAG + LLM synthesis */
export const AI_CHAT_MIN_TIER = CBLE_MIN_TIER;

export interface AiChatCompanyContext {
  subscription_tier?: SubscriptionTier | string | null;
  is_laslog_verified?: boolean;
  is_active?: boolean;
  company_type?: 'carrier' | 'broker' | 'mixed';
}

export interface AiChatAccessResult {
  tier: SubscriptionTier;
  tierLabel: string;
  hasAdvancedAccess: boolean;
  canUseLlm: boolean;
  isLocked: boolean;
  isVerified: boolean;
  upgradeMessage: string;
  accessSummary: string;
  canAccessDomain: (domain: AiChatDomain) => boolean;
  domainGateMessage: (domain: AiChatDomain) => string;
}

function resolveLoadBoardVerified(ctx: AiChatCompanyContext): boolean {
  return Boolean(ctx.is_laslog_verified && ctx.is_active);
}

/**
 * Pure tier/access evaluation for OKF AI Chat.
 * Pro Broker+ unlocks RAG/LLM; load_board domain additionally requires laslogTMX Verified.
 */
export function evaluateAiChatAccess(ctx: AiChatCompanyContext): AiChatAccessResult {
  const tier = (ctx.subscription_tier ?? 'starter') as SubscriptionTier;
  const tierLabel = getTierLabel(tier);
  const hasAdvancedAccess = meetsMinimumTier(tier, AI_CHAT_MIN_TIER);
  const isVerified = resolveLoadBoardVerified(ctx);

  const canAccessDomain = (domain: AiChatDomain): boolean => {
    if (!hasAdvancedAccess) return false;
    if (domain === 'load_board') {
      return isVerified && meetsMinimumTier(tier, 'pro');
    }
    return true;
  };

  const domainGateMessage = (domain: AiChatDomain): string => {
    if (!hasAdvancedAccess) {
      return 'AI Assistant with OKF RAG and LLM synthesis requires Pro Broker or Enterprise.';
    }
    if (domain === 'load_board' && !isVerified) {
      return 'Load board AI guidance requires a laslogTMX Verified company account.';
    }
    if (domain === 'cble_prep') {
      return 'CBLE Prep AI answers require Pro Broker or Enterprise.';
    }
    return 'Upgrade to Pro Broker or Enterprise to use the AI Assistant.';
  };

  const upgradeMessage = hasAdvancedAccess
    ? isVerified
      ? 'Full AI Assistant access (RAG + optional LLM synthesis).'
      : 'Compliance and CBLE AI unlocked. Load board guidance requires laslogTMX Verification.'
    : 'AI Assistant with OKF RAG and LLM synthesis is available on Pro Broker and Enterprise plans.';

  const accessSummary = hasAdvancedAccess
    ? isVerified
      ? `Full AI access (${tierLabel})`
      : `Partial AI access (${tierLabel} — load board domain requires Verification)`
    : `No AI access (${tierLabel})`;

  return {
    tier,
    tierLabel,
    hasAdvancedAccess,
    canUseLlm: hasAdvancedAccess,
    isLocked: !hasAdvancedAccess,
    isVerified,
    upgradeMessage,
    accessSummary,
    canAccessDomain,
    domainGateMessage,
  };
}

export function checkDomainAccess(
  domain: AiChatDomain,
  ctx: AiChatCompanyContext
): { allowed: boolean; message: string } {
  const access = evaluateAiChatAccess(ctx);
  const allowed = access.canAccessDomain(domain);
  return {
    allowed,
    message: allowed ? '' : access.domainGateMessage(domain),
  };
}