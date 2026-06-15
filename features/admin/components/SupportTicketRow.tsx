import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { ADMIN_BRAND, TICKET_ACTIONS, TICKET_STATUS_LABELS } from '../constants';
import type { SupportTicketWithCompany } from '../types';
import type { SupportTicketStatus } from '../../chat/types';

interface Props {
  ticket: SupportTicketWithCompany;
  updating: boolean;
  onAction: (ticketId: string, status: SupportTicketStatus) => void;
}

function formatAmount(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function shortTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export const SupportTicketRow: React.FC<Props> = ({ ticket, updating, onAction }) => {
  const { isMilitaryTime } = useSettings();
  const timeLabel = formatMessageTime(ticket.created_at, isMilitaryTime);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.ticketId}>#{shortTicketId(ticket.id)}</Text>
          {ticket.escalated_to_admin && (
            <View style={styles.escalatedBadge}>
              <Text style={styles.escalatedText}>Escalated</Text>
            </View>
          )}
        </View>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.company}>{ticket.company_name ?? 'Company'}</Text>
        <Text style={styles.amount}>{formatAmount(ticket.amount_cents)}</Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{TICKET_STATUS_LABELS[ticket.status]}</Text>
      </View>

      {ticket.reason ? <Text style={styles.reason}>{ticket.reason}</Text> : null}

      <View style={styles.actions}>
        {updating ? (
          <ActivityIndicator size="small" color={ADMIN_BRAND.accent} />
        ) : (
          TICKET_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.status}
              style={[
                styles.actionBtn,
                action.variant === 'primary' && styles.actionPrimary,
                action.variant === 'danger' && styles.actionDanger,
                ticket.status === action.status && styles.actionDisabled,
              ]}
              disabled={ticket.status === action.status}
              onPress={() => onAction(ticket.id, action.status)}
            >
              <Text
                style={[
                  styles.actionText,
                  action.variant === 'primary' && styles.actionTextPrimary,
                  action.variant === 'danger' && styles.actionTextDanger,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
  },
  escalatedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  escalatedText: {
    fontSize: 10,
    fontWeight: '700',
    color: ADMIN_BRAND.warning,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  company: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_BRAND.accent,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
  },
  reason: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
    backgroundColor: ADMIN_BRAND.background,
  },
  actionPrimary: {
    backgroundColor: '#E0E7FF',
    borderColor: '#C7D2FE',
  },
  actionDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: ADMIN_BRAND.textSecondary,
  },
  actionTextPrimary: {
    color: ADMIN_BRAND.accent,
  },
  actionTextDanger: {
    color: ADMIN_BRAND.danger,
  },
});