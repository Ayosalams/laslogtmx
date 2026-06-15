/**
 * Subscription tier definitions for laslogTMX.
 * Higher rank = more features. CBLE Prep requires pro_broker or above.
 */

export const SUBSCRIPTION_TIERS = {
  starter: { id: 'starter', label: 'Starter', rank: 0 },
  pro: { id: 'pro', label: 'Pro Carrier', rank: 1 },
  pro_broker: { id: 'pro_broker', label: 'Pro Broker', rank: 2 },
  enterprise: { id: 'enterprise', label: 'Enterprise', rank: 3 },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type BillingInterval = 'monthly' | 'yearly';

/** Minimum tier required for CBLE Prep access */
export const CBLE_MIN_TIER: SubscriptionTier = 'pro_broker';

/** Dollar value of CBLE Prep included free on annual Pro Broker plans */
export const CBLE_INCLUDED_VALUE = 299;

export function getTierRank(tier: SubscriptionTier | string | null | undefined): number {
  if (!tier || !(tier in SUBSCRIPTION_TIERS)) return 0;
  return SUBSCRIPTION_TIERS[tier as SubscriptionTier].rank;
}

export function getTierLabel(tier: SubscriptionTier | string | null | undefined): string {
  if (!tier || !(tier in SUBSCRIPTION_TIERS)) return SUBSCRIPTION_TIERS.starter.label;
  return SUBSCRIPTION_TIERS[tier as SubscriptionTier].label;
}

export function meetsMinimumTier(
  current: SubscriptionTier | string | null | undefined,
  minimum: SubscriptionTier
): boolean {
  return getTierRank(current) >= getTierRank(minimum);
}