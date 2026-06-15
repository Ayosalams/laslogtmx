import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ChatMessageBubble } from '../components/ChatMessageBubble';
import { RefundRequestSheet } from '../components/RefundRequestSheet';
import { useRefundWorkflow } from '../hooks/useRefundWorkflow';
import { ChatMessage } from '../types';
import { detectRefundIntent } from '../utils/detectRefundIntent';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';

export const ChatRoomScreen = ({ route, navigation }: any) => {
  const { channelId, channelName } = route?.params || {};
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refundSheetVisible, setRefundSheetVisible] = useState(false);
  const [pendingRefundMessage, setPendingRefundMessage] = useState('');
  const [refundHintVisible, setRefundHintVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { submitting, uploadingScreenshot, submitRefundRequest } = useRefundWorkflow();
  const { verifyHighRiskAction } = useAuth();

  // Load current user once
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id);
    };
    loadUser();
  }, []);

  // Fetch history
  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) console.error('fetch messages error', error);
    setMessages((data as ChatMessage[]) || []);
    setLoading(false);
  }, [channelId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Full realtime: listen for INSERTs (and future UPDATE for reported)
  useEffect(() => {
    if (!channelId) return;

    const sub = supabase
      .channel(`chat-room:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Dedup optimistic or duplicate inserts
            const exists = prev.some(
              (m) =>
                m.id === newMsg.id ||
                (m.content === newMsg.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)
            );
            if (exists) return prev;
            const next = [...prev, newMsg];
            // scroll after state
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    setRefundHintVisible(detectRefundIntent(text));
  };

  const openRefundSheet = (triggerMessage: string) => {
    setPendingRefundMessage(triggerMessage);
    setRefundSheetVisible(true);
    setRefundHintVisible(false);
  };

  const handleRefundSubmit = async (
    amount: string,
    reason: string,
    screenshotFileName?: string
  ) => {
    if (!channelId) return;

    try {
      const biometric = await verifyHighRiskAction('refund');
      if (!biometric.verified) {
        Alert.alert(
          'Verification Required',
          biometric.error ?? 'Biometric verification failed. Refund not submitted.'
        );
        return;
      }

      const result = await submitRefundRequest({
        channelId,
        payload: {
          amount,
          reason,
          screenshotFileName,
          triggerMessage: pendingRefundMessage,
        },
      });

      setRefundSheetVisible(false);
      setPendingRefundMessage('');
      setInputText('');

      const confirmation = result.escalated
        ? 'Your refund request has been submitted and escalated to our billing team.'
        : 'Your refund request has been submitted. Check the support message above for next steps.';

      Alert.alert('Request Submitted', confirmation);
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message || 'Please try again later.');
    }
  };

  const handleRefundDismiss = () => {
    setRefundSheetVisible(false);
    setPendingRefundMessage('');
  };

  // Optimistic send + server insert. Realtime will also deliver the real record.
  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !channelId || sending) return;

    if (detectRefundIntent(trimmed)) {
      openRefundSheet(trimmed);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      Alert.alert('Not signed in', 'Please sign in to send messages.');
      return;
    }

    setSending(true);

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      channel_id: channelId,
      user_id: uid,
      content: trimmed,
      created_at: new Date().toISOString(),
      reported: false,
    };

    // Optimistic UI
    setMessages((prev) => [...prev, optimistic]);
    setInputText('');
    // Scroll immediately
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 30);

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: uid,
      content: trimmed,
    });

    setSending(false);

    if (error) {
      // Rollback optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(trimmed);
      Alert.alert('Send failed', error.message || 'Could not send message. Please try again.');
    }
    // On success the realtime INSERT listener will append the canonical record (deduped)
  };

  const reportMessage = async (message: ChatMessage) => {
    if (message.reported) return;

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;

    const reason = 'Reported from chat';

    try {
      await supabase.from('message_reports').insert({
        message_id: message.id,
        reporter_user_id: uid,
        reason,
      });

      await supabase.from('messages').update({ reported: true }).eq('id', message.id);

      // Local update (realtime UPDATE will also fire)
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, reported: true } : m))
      );

      Alert.alert('Message Reported', 'Thank you. This message has been flagged for review.');
    } catch (e: any) {
      Alert.alert('Report failed', e?.message || 'Please try again later.');
    }
  };

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Simple header bar (works with or without react-navigation header) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {channelName || 'Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>Company + Load chat • Military time timestamps</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessageBubble
            message={item}
            currentUserId={currentUserId}
            onReport={reportMessage}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      {refundHintVisible && !refundSheetVisible && (
        <TouchableOpacity
          style={styles.refundHint}
          onPress={() => openRefundSheet(inputText.trim())}
        >
          <Text style={styles.refundHintText}>
            Billing concern detected — tap here or press Send to open the refund form
          </Text>
        </TouchableOpacity>
      )}

      <RefundRequestSheet
        visible={refundSheetVisible}
        triggerMessage={pendingRefundMessage}
        submitting={submitting}
        uploadingScreenshot={uploadingScreenshot}
        onSubmit={handleRefundSubmit}
        onDismiss={handleRefundDismiss}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  backText: {
    fontSize: 22,
    color: '#1E40AF',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
  refundHint: {
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refundHintText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
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
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 68,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});