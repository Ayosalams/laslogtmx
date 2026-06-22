import { useMemo } from 'react';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { meetsMinimumTier } from '../../../packages/shared/src/constants/subscription';

export interface LoadBoardAccess {
  isVerified: boolean;
  isBroker: boolean;
  isCarrier: boolean;
  canAccess: boolean;
  canPost: boolean;
  canBid: boolean;
  gateMessage: string;
}

/**
 * Internal load board is visible only to laslogTMX Verified carriers and brokers.
 */
export function useLoadBoardAccess(): LoadBoardAccess {
  const { company } = useAuth();

  return useMemo(() => {
    const tier = company?.subscription_tier ?? 'starter';
    const companyType = company?.company_type ?? 'carrier';
    const isVerified = Boolean(company?.is_laslog_verified && company?.is_active);
    const hasProTier = meetsMinimumTier(tier, 'pro');

    const isBroker =
      isVerified &&
      hasProTier &&
      (companyType === 'broker' || companyType === 'mixed') &&
      meetsMinimumTier(tier, 'pro_broker');

    const isCarrier =
      isVerified &&
      hasProTier &&
      (companyType === 'carrier' || companyType === 'mixed');

    const canAccess = isVerified && hasProTier && (isBroker || isCarrier);

    let gateMessage = 'Internal load board requires a laslogTMX Verified company account.';
    if (!isVerified) {
      gateMessage =
        'Your company is not yet laslogTMX Verified. Contact laslogTMX support to enable internal load board access.';
    } else if (!hasProTier) {
      gateMessage = 'Upgrade to Pro Carrier or Pro Broker to access the internal load board.';
    }

    return {
      isVerified,
      isBroker,
      isCarrier,
      canAccess,
      canPost: isBroker,
      canBid: isCarrier,
      gateMessage,
    };
  }, [
    company?.is_laslog_verified,
    company?.is_active,
    company?.subscription_tier,
    company?.company_type,
  ]);
}