import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 
  | 'Active' | 'Out of Service' | 'Inactive' | 'Pending' | 'Not Found' | 'Unknown'
  | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Additional Info';

interface StatusBadgeProps {
  status: Status;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStyle = () => {
    switch (status) {
      case 'Active':
      case 'Approved':
        return styles.success;
      case 'Out of Service':
      case 'Rejected':
        return styles.danger;
      case 'Pending':
      case 'Under Review':
      case 'Needs Additional Info':
        return styles.warning;
      default:
        return styles.neutral;
    }
  };

  const containerStyle = [
    styles.badge,
    size === 'small' && styles.small,
    getStyle(),
  ];

  return (
    <View style={containerStyle}>
      <Text style={[styles.text, size === 'small' && styles.smallText]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
  danger: {
    backgroundColor: '#FEE2E2',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  neutral: {
    backgroundColor: '#F1F5F9',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  smallText: {
    fontSize: 10,
  },
});
