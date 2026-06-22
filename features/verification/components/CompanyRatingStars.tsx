import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VERIFICATION_COLORS } from '../constants';
import { formatAverageRating } from '../utils/formatRating';

interface Props {
  averageRating: number | null;
  ratingCount: number;
  size?: 'sm' | 'md';
}

export const CompanyRatingStars: React.FC<Props> = ({
  averageRating,
  ratingCount,
  size = 'sm',
}) => {
  if (!ratingCount || averageRating == null) {
    return <Text style={[styles.noRating, size === 'md' && styles.noRatingMd]}>No ratings yet</Text>;
  }

  const rounded = Math.round(averageRating);
  const stars = Array.from({ length: 5 }, (_, i) => i < rounded);

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {stars.map((filled, i) => (
          <Text
            key={i}
            style={[
              styles.star,
              size === 'md' && styles.starMd,
              { color: filled ? VERIFICATION_COLORS.star : VERIFICATION_COLORS.starEmpty },
            ]}
          >
            ★
          </Text>
        ))}
      </View>
      <Text style={[styles.label, size === 'md' && styles.labelMd]}>
        {formatAverageRating(averageRating, ratingCount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 12,
  },
  starMd: {
    fontSize: 16,
  },
  label: {
    fontSize: 11,
    color: VERIFICATION_COLORS.unverified,
  },
  labelMd: {
    fontSize: 13,
  },
  noRating: {
    fontSize: 11,
    color: VERIFICATION_COLORS.unverified,
    fontStyle: 'italic',
  },
  noRatingMd: {
    fontSize: 13,
  },
});