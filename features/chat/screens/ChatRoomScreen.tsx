import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { ChatMessage } from '../types';

export const ChatRoomScreen = ({ route }: any) => {
  const { channelId, channelName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();
  }, [channelId]);

  useEffect(() => {
    const subscription = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [channelId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const { data: user } = await supabase.auth.getUser();

    const newMessage = {
      channel_id: channelId,
      user_id: user.user?.id,
      content: inputText.trim(),
    };

    await supabase.from('messages').insert(newMessage);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  messageList: { padding: 16 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#00bfff',
    borderRadius: 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '600' },
});