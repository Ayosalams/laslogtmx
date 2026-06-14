import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { ChatListItem } from '../components/ChatListItem';
import { useChatChannels } from '../hooks/useChatChannels';

export const ChatListScreen = () => {
  const { channels, loading } = useChatChannels();

  if (loading) {
    return <Text style={styles.loading}>Loading chats...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatListItem 
            channel={item} 
            onPress={() => {/* TODO: Navigate to ChatRoomScreen */}} 
          />
        )}
        ListHeaderComponent={
          <Text style={styles.header}>Messages</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', padding: 20 },
  loading: { flex: 1, textAlign: 'center', marginTop: 100 }
});
