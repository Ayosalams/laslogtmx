import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNotifications } from '../../../packages/shared/src/notifications/useNotifications';
import { NOTIFICATION_TYPE_LABELS } from '../../../packages/shared/src/notifications/constants';
import { NotificationType } from '../../../packages/shared/src/notifications/types';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';

interface Props {
  userId?: string;
}

export const NotificationInbox: React.FC<Props> = ({ userId }) => {
  const { isMilitaryTime } = useSettings();
  const { notifications, loading, unreadCount, markAsRead, markAllRead } =
    useNotifications(userId);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1E40AF" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyText}>
          Alerts for load matches, chat, MOTUS, and CBLE will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inboxHeader}>
        <Text style={styles.inboxTitle}>
          Inbox {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isUnread = !item.read_at;
          const typeLabel =
            NOTIFICATION_TYPE_LABELS[item.type as NotificationType] ?? item.type;

          return (
            <TouchableOpacity
              style={[styles.item, isUnread && styles.itemUnread]}
              onPress={() => {
                if (isUnread) void markAsRead(item.id);
              }}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.typeBadge}>{typeLabel}</Text>
                <Text style={styles.time}>
                  {formatMessageTime(item.created_at, isMilitaryTime)}
                </Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody} numberOfLines={2}>
                {item.body}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  centered: { padding: 24, alignItems: 'center' },
  emptyBox: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: 4 },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inboxTitle: { fontSize: 14, fontWeight: '600', color: '#475569' },
  markAll: { fontSize: 13, color: '#1E40AF', fontWeight: '500' },
  item: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  time: { fontSize: 11, color: '#94A3B8' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  itemBody: { fontSize: 13, color: '#64748B', marginTop: 2 },
});