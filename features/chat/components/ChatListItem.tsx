import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ChatChannel } from '../types';

interface Props {
  channel: ChatChannel;
  onPress: () => void;
}

export const ChatListItem = ({ channel, onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.name}>{channel.name}</Text>
      {channel.lastMessage && (
        <Text style={styles.message} numberOfLines={1}>{channel.lastMessage}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#666'
  }
});
