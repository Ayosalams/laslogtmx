import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { getTierLabel } from '../../../packages/shared/src/constants/subscription';
import { useUserManagement } from '../hooks/useUserManagement';
import { CompanyUserRow } from './CompanyUserRow';
import { ADMIN_BRAND } from '../constants';

export const UserManagementPanel: React.FC = () => {
  const { company: authCompany } = useAuth();
  const { company, users, loading, error, refresh } = useUserManagement(authCompany?.id);

  const displayCompany = company ?? authCompany;

  if (loading && users.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ADMIN_BRAND.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>User Management</Text>
      <Text style={styles.subheading}>View company details and team members.</Text>

      {displayCompany ? (
        <View style={styles.companyCard}>
          <Text style={styles.companyName}>{displayCompany.name}</Text>
          <View style={styles.companyMeta}>
            {displayCompany.dot_number ? (
              <Text style={styles.metaItem}>DOT {displayCompany.dot_number}</Text>
            ) : null}
            {displayCompany.mc_number ? (
              <Text style={styles.metaItem}>MC {displayCompany.mc_number}</Text>
            ) : null}
          </View>
          <View style={styles.companyStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Plan</Text>
              <Text style={styles.statValue}>
                {getTierLabel(displayCompany.subscription_tier)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Billing</Text>
              <Text style={styles.statValue}>
                {displayCompany.billing_interval === 'yearly' ? 'Annual' : 'Monthly'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Users</Text>
              <Text style={styles.statValue}>{users.length}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Team Members</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CompanyUserRow user={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={ADMIN_BRAND.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found for this company.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 16,
  },
  companyCard: {
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_BRAND.accent,
    marginBottom: 6,
  },
  companyMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    fontWeight: '500',
  },
  companyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: ADMIN_BRAND.background,
    borderRadius: 10,
    padding: 10,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ADMIN_BRAND.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 10,
  },
  error: {
    fontSize: 13,
    color: ADMIN_BRAND.danger,
    marginBottom: 12,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
  },
});