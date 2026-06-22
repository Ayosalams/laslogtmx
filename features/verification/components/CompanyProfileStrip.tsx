import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CompanyPublicProfile } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { CompanyRatingStars } from './CompanyRatingStars';

interface Props {
  profile: CompanyPublicProfile | null;
  label?: string;
}

/** Compact broker/carrier trust strip for load board cards. */
export const CompanyProfileStrip: React.FC<Props> = ({ profile, label = 'Posted by' }) => {
  if (!profile) return null;

  return (
    <View style={styles.strip}>
      <Text style={styles.label}>
        {label} <Text style={styles.name}>{profile.name}</Text>
      </Text>
      <View style={styles.badges}>
        <VerifiedBadge
          verificationStatus={profile.verification_status}
          isLaslogVerified={profile.is_laslog_verified}
          isFraudFlagged={profile.is_fraud_flagged}
          compact
        />
        <CompanyRatingStars
          averageRating={profile.average_rating}
          ratingCount={profile.rating_count}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    marginTop: 8,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
  },
  name: {
    fontWeight: '600',
    color: '#0F172A',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});