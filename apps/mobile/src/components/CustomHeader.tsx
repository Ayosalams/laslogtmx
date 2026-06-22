import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrentTime } from '../../../../packages/shared/src/hooks/useCurrentTime';
import { getGlassCardStyle, MOBILE_GLASS_HIGHLIGHT } from '../../../../packages/shared/src/utils/glass';

export const CustomHeader: React.FC = () => {
  const currentTime = useCurrentTime();
  const glassHeader = getGlassCardStyle();

  return (
    <View style={[styles.header, glassHeader]}>
      <View style={MOBILE_GLASS_HIGHLIGHT} />
      <Text style={styles.title}>laslogTMX</Text>
      <View style={styles.timePill}>
        <Text style={styles.timeText}>{currentTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    // glass styles injected via util (subtle + performant)
    borderBottomWidth: 0,
    // iOS/Android safe top padding can be added via SafeArea in parent
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.3,
  },
  timePill: {
    backgroundColor: 'rgba(224,242,254,0.7)', // light electric blue tint per brand
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    opacity: 0.75, // low opacity / subtle as required
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00BFFF',
    fontVariant: ['tabular-nums'],
  },
});

export default CustomHeader;
