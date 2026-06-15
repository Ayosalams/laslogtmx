import React from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { ChatListItem } from '../components/ChatListItem';
import { useChatChannels } from '../hooks/useChatChannels';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';

interface ChatListScreenProps {
  navigation?: any;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const { channels, loading, refresh } = useChatChannels();
  const currentTime = useCurrentTime(); // respects military time setting via SettingsContext

  const handleOpenChannel = (channel: { id: string; name: string }) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('ChatRoom', {
        channelId: channel.id,
        channelName: channel.name,
      });
    } else {
      // Fallback for non-nav usage (demo state switcher etc.)
      console.log('Navigate to ChatRoom with', channel);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem
            channel={item}
            onPress={() => handleOpenChannel(item)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Messages</Text>
              <View style={styles.timePill}>
                <Text style={styles.timeText}>{currentTime}</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Company-wide &amp; load-specific chats</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#1E40AF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No active chats found.</Text>
            <Text style={styles.emptyHint}>Company channels and load chats will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  timePill: {
    backgroundColor: 'rgba(241,245,249,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    opacity: 0.9,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  emptyHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});