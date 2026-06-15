import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CBLE_DISCLAIMER_FULL, CBLE_PRONUNCIATION_NOTE } from '../constants';

interface Props {
  compact?: boolean;
  showPronunciation?: boolean;
}

export const CbleDisclaimerBanner: React.FC<Props> = ({
  compact = false,
  showPronunciation = false,
}) => (
  <View style={[styles.banner, compact && styles.bannerCompact]}>
    <Text style={styles.label}>DISCLAIMER</Text>
    <Text style={[styles.text, compact && styles.textCompact]}>
      {compact ? 'Internal training only — not official CBLE/CBP material.' : CBLE_DISCLAIMER_FULL}
    </Text>
    {showPronunciation && (
      <Text style={styles.pronunciation}>{CBLE_PRONUNCIATION_NOTE}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bannerCompact: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#92400E',
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F',
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  pronunciation: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
    color: '#92400E',
    fontStyle: 'italic',
  },
});