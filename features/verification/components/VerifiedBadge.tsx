import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { VerificationStatus } from '../types';
import {
  VERIFICATION_COLORS,
  VERIFIED_BADGE_LABEL,
  ADMIN_VERIFIED_LABEL,
  SELF_ATTESTED_LABEL,
  FRAUD_FLAG_LABEL,
  UNVERIFIED_LABEL,
} from '../constants';

interface Props {
  verificationStatus?: VerificationStatus;
  isLaslogVerified?: boolean;
  isFraudFlagged?: boolean;
  compact?: boolean;
}

function resolveBadge(
  status: VerificationStatus | undefined,
  isVerified: boolean,
  isFlagged: boolean
): { label: string; bg: string; color: string } {
  if (isFlagged || status === 'flagged') {
    return { label: FRAUD_FLAG_LABEL, bg: VERIFICATION_COLORS.flaggedBg, color: VERIFICATION_COLORS.flagged };
  }
  if (status === 'admin_verified') {
    return { label: ADMIN_VERIFIED_LABEL, bg: VERIFICATION_COLORS.adminVerifiedBg, color: VERIFICATION_COLORS.adminVerified };
  }
  if (status === 'self_attested') {
    return { label: SELF_ATTESTED_LABEL, bg: VERIFICATION_COLORS.selfAttestedBg, color: VERIFICATION_COLORS.selfAttested };
  }
  if (isVerified) {
    return { label: VERIFIED_BADGE_LABEL, bg: VERIFICATION_COLORS.verifiedBg, color: VERIFICATION_COLORS.verified };
  }
  return { label: UNVERIFIED_LABEL, bg: VERIFICATION_COLORS.unverifiedBg, color: VERIFICATION_COLORS.unverified };
}

export const VerifiedBadge: React.FC<Props> = ({
  verificationStatus,
  isLaslogVerified = false,
  isFraudFlagged = false,
  compact = false,
}) => {
  const badge = resolveBadge(verificationStatus, isLaslogVerified, isFraudFlagged);

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }, compact && styles.compact]}>
      <Text style={[styles.text, { color: badge.color }, compact && styles.textCompact]}>
        {badge.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textCompact: {
    fontSize: 9,
  },
});