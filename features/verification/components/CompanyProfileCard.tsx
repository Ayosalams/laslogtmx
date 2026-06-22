import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CompanyPublicProfile } from '../types';
import { VERIFICATION_COLORS } from '../constants';
import { VerifiedBadge } from './VerifiedBadge';
import { CompanyRatingStars } from './CompanyRatingStars';

interface Props {
  profile: CompanyPublicProfile;
  showDotMc?: boolean;
}

export const CompanyProfileCard: React.FC<Props> = ({ profile, showDotMc = true }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.type}>{profile.company_type}</Text>
        </View>
        <VerifiedBadge
          verificationStatus={profile.verification_status}
          isLaslogVerified={profile.is_laslog_verified}
          isFraudFlagged={profile.is_fraud_flagged}
        />
      </View>

      <CompanyRatingStars
        averageRating={profile.average_rating}
        ratingCount={profile.rating_count}
        size="md"
      />

      {showDotMc && (profile.dot_number || profile.mc_number) && (
        <View style={styles.dotRow}>
          {profile.dot_number && <Text style={styles.dotText}>DOT {profile.dot_number}</Text>}
          {profile.mc_number && <Text style={styles.dotText}>MC {profile.mc_number}</Text>}
        </View>
      )}

      {profile.is_fraud_flagged && (
        <Text style={styles.fraudWarning}>
          This company has been flagged for review. Proceed with caution.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: VERIFICATION_COLORS.accent,
  },
  type: {
    fontSize: 11,
    fontWeight: '600',
    color: VERIFICATION_COLORS.unverified,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dotText: {
    fontSize: 12,
    color: VERIFICATION_COLORS.unverified,
    fontVariant: ['tabular-nums'],
  },
  fraudWarning: {
    fontSize: 12,
    color: VERIFICATION_COLORS.flagged,
    fontWeight: '600',
  },
});