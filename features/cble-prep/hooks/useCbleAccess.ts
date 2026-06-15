import { useMemo } from 'react';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import {
  CBLE_MIN_TIER,
  CBLE_INCLUDED_VALUE,
  getTierLabel,
  meetsMinimumTier,
  type BillingInterval,
  type SubscriptionTier,
} from '../../../packages/shared/src/constants/subscription';

export type CbleAccessLevel = 'locked' | 'preview' | 'full';

export interface CbleAccessState {
  tier: SubscriptionTier;
  tierLabel: string;
  billingInterval: BillingInterval;
  hasAccess: boolean;
  hasFullAccess: boolean;
  hasPreviewAccess: boolean;
  accessLevel: CbleAccessLevel;
  isLocked: boolean;
  includedValue: number;
  upgradeMessage: string;
  accessSummary: string;
}

/**
 * Tier-gated CBLE Prep access via AuthContext company subscription fields.
 * Pro Broker+ required; yearly billing unlocks the full library.
 */
export function useCbleAccess(): CbleAccessState {
  const { company } = useAuth();

  return useMemo(() => {
    const tier = (company?.subscription_tier ?? 'starter') as SubscriptionTier;
    const billingInterval = (company?.billing_interval ?? 'monthly') as BillingInterval;
    const tierLabel = getTierLabel(tier);

    const hasTierAccess = meetsMinimumTier(tier, CBLE_MIN_TIER);
    const hasFullAccess = hasTierAccess && billingInterval === 'yearly';
    const hasPreviewAccess = hasTierAccess && billingInterval === 'monthly';

    let accessLevel: CbleAccessLevel = 'locked';
    if (hasFullAccess) accessLevel = 'full';
    else if (hasPreviewAccess) accessLevel = 'preview';

    const upgradeMessage = hasTierAccess
      ? 'Upgrade to an annual Pro Broker plan for full CBLE Prep library access.'
      : 'CBLE Prep is available on Pro Broker and Enterprise plans.';

    const accessSummary = hasFullAccess
      ? `Full CBLE access (${tierLabel}, annual)`
      : hasPreviewAccess
        ? `Preview access (${tierLabel}, monthly — upgrade to annual for full library)`
        : `No CBLE access (${tierLabel})`;

    return {
      tier,
      tierLabel,
      billingInterval,
      hasAccess: hasTierAccess,
      hasFullAccess,
      hasPreviewAccess,
      accessLevel,
      isLocked: !hasTierAccess,
      includedValue: CBLE_INCLUDED_VALUE,
      upgradeMessage,
      accessSummary,
    };
  }, [company?.subscription_tier, company?.billing_interval]);
}

/** Whether a specific material is playable/viewable given current access */
export function canAccessMaterial(
  materialRequiresFullAccess: boolean,
  access: Pick<CbleAccessState, 'hasFullAccess' | 'hasPreviewAccess' | 'isLocked'>
): boolean {
  if (access.isLocked) return false;
  if (!materialRequiresFullAccess) return true;
  return access.hasFullAccess;
}