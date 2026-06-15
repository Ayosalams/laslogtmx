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
import { useSupportTicketQueue } from '../hooks/useSupportTicketQueue';
import { SupportTicketRow } from './SupportTicketRow';
import { ADMIN_BRAND } from '../constants';

export const SupportTicketsPanel: React.FC = () => {
  const { company } = useAuth();
  const { tickets, loading, error, updatingId, refresh, updateTicketStatus } =
    useSupportTicketQueue(company?.id);

  if (loading && tickets.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ADMIN_BRAND.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Support Tickets & Refunds</Text>
      <Text style={styles.subheading}>
        Review refund requests and billing disputes for {company?.name ?? 'your company'}.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SupportTicketRow
            ticket={item}
            updating={updatingId === item.id}
            onAction={updateTicketStatus}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={ADMIN_BRAND.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tickets in queue</Text>
            <Text style={styles.emptyBody}>
              Refund requests from chat will appear here with status, amount, and actions.
            </Text>
          </View>
        }
        contentContainerStyle={tickets.length === 0 ? styles.emptyList : undefined}
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
    padding: 24,
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
  error: {
    fontSize: 13,
    color: ADMIN_BRAND.danger,
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    padding: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});