import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCurrentTime } from '../../../../packages/shared/src/hooks/useCurrentTime';

export const CustomHeader: React.FC = () => {
  const currentTime = useCurrentTime();

  return (
    <View style={styles.header}>
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
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
    // iOS/Android safe top padding can be added via SafeArea in parent
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.3,
  },
  timePill: {
    backgroundColor: 'rgba(243,244,246,0.7)', // subtle gray
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    opacity: 0.75, // low opacity / subtle as required
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
    fontVariant: ['tabular-nums'],
  },
});

export default CustomHeader;
