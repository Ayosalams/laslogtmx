import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAdminAccess } from '../hooks/useAdminAccess';
import { ADMIN_BRAND } from '../constants';

interface Props {
  children: React.ReactNode;
  /** Web fallback — when true, renders children wrapper as div via fragment passthrough */
  webFallback?: React.ReactNode;
}

export const AdminGuard: React.FC<Props> = ({ children, webFallback }) => {
  const { isAdmin, loading } = useAdminAccess();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ADMIN_BRAND.accent} />
        <Text style={styles.loadingText}>Verifying access…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    if (webFallback) return <>{webFallback}</>;
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedBody}>
          The Admin Dashboard is only available to users with the admin role.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: ADMIN_BRAND.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: ADMIN_BRAND.textSecondary,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_BRAND.danger,
    marginBottom: 8,
  },
  deniedBody: {
    fontSize: 14,
    color: ADMIN_BRAND.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});