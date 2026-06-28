import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { resolveAppUrl } from '../../../packages/shared/src/constants';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { DOMAIN_LABELS, SUGGESTED_PROMPTS } from '../constants';
import { useAiChat } from '../hooks/useAiChat';
import { useAiChatAccess } from '../hooks/useAiChatAccess';
import type { AiChatDomain } from '../types';

const DOMAIN_COLORS: Record<AiChatDomain, { bg: string; text: string; border: string }> = {
  cble_prep: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  compliance: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  load_board: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  general: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

export const AiChatScreen: React.FC = () => {
  const currentTime = useCurrentTime();
  const { session, isAuthenticated } = useAuth();
  const access = useAiChatAccess();
  const { messages, loading, error, lastMeta, sendMessage, clearChat } = useAiChat({
    apiBaseUrl: resolveAppUrl(),
    accessToken: session?.access_token,
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const allPrompts = [
    SUGGESTED_PROMPTS.cble_prep[0],
    SUGGESTED_PROMPTS.compliance[0],
    SUGGESTED_PROMPTS.load_board[0],
  ];

  const chatDisabled = !isAuthenticated || access.isLocked || loading;

  const handleSend = async () => {
    if (chatDisabled || !input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>OKF Router + RAG for CBLE, Compliance, Load Board</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        {!isAuthenticated ? (
          <View style={styles.gateCard}>
            <Text style={styles.gateTitle}>Sign In Required</Text>
            <Text style={styles.gateBody}>
              The AI Assistant uses your company subscription for tier-gated OKF RAG and optional LLM
              synthesis.
            </Text>
          </View>
        ) : access.isLocked ? (
          <View style={styles.gateCard}>
            <Text style={styles.gateTitle}>Pro Broker Required</Text>
            <Text style={styles.gateBody}>
              Advanced OKF RAG and LLM synthesis are available on Pro Broker and Enterprise plans.
            </Text>
            <Text style={styles.gateMeta}>{access.upgradeMessage}</Text>
          </View>
        ) : (
          <View style={styles.accessCard}>
            <Text style={styles.accessLabel}>Your Access</Text>
            <Text style={styles.accessValue}>{access.accessSummary}</Text>
            {!access.isVerified && (
              <Text style={styles.accessHint}>
                Load board AI guidance requires laslogTMX Verification.
              </Text>
            )}
          </View>
        )}

        {lastMeta ? (
          <View style={styles.metaRow}>
            <View style={[styles.domainBadge, { backgroundColor: DOMAIN_COLORS[lastMeta.domain].bg, borderColor: DOMAIN_COLORS[lastMeta.domain].border }]}>
              <Text style={[styles.domainBadgeText, { color: DOMAIN_COLORS[lastMeta.domain].text }]}>
                {DOMAIN_LABELS[lastMeta.domain]}
              </Text>
            </View>
            <Text style={styles.metaText}>
              {Math.round(lastMeta.confidence * 100)}% · {lastMeta.mode}
            </Text>
            {messages.length > 0 ? (
              <TouchableOpacity onPress={clearChat}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Ask about customs broker exam prep, FMCSA/MOTUS compliance, or internal load board
                matching and bidding.
              </Text>
              {isAuthenticated && !access.isLocked
                ? allPrompts.map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      style={styles.promptChip}
                      onPress={() => sendMessage(prompt)}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))
                : null}
            </View>
          ) : null}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageRow, msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                {msg.role === 'assistant' && msg.domain ? (
                  <View
                    style={[
                      styles.domainBadge,
                      {
                        backgroundColor: DOMAIN_COLORS[msg.domain].bg,
                        borderColor: DOMAIN_COLORS[msg.domain].border,
                        alignSelf: 'flex-start',
                        marginBottom: 6,
                      },
                    ]}
                  >
                    <Text style={[styles.domainBadgeText, { color: DOMAIN_COLORS[msg.domain].text }]}>
                      {DOMAIN_LABELS[msg.domain]}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                  {msg.content}
                </Text>
                {msg.sources && msg.sources.length > 0 ? (
                  <View style={styles.sourcesBlock}>
                    <Text style={styles.sourcesTitle}>Sources</Text>
                    {msg.sources.map((s) => (
                      <Text key={s.id} style={styles.sourceItem}>
                        {s.title} ({s.bundleId})
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#00BFFF" size="small" />
              <Text style={styles.loadingText}>Routing query and retrieving OKF context…</Text>
            </View>
          ) : null}
        </ScrollView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, chatDisabled && styles.inputDisabled]}
            value={input}
            onChangeText={setInput}
            placeholder={
              access.isLocked
                ? 'Upgrade to Pro Broker to use AI Assistant…'
                : 'Ask about CBLE, compliance, or load board…'
            }
            placeholderTextColor="#94A3B8"
            editable={!chatDisabled}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (chatDisabled || !input.trim()) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={chatDisabled || !input.trim()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          OKF knowledge bundles only. Not legal or exam advice. Pro Broker+ required for RAG/LLM.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  gateCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  gateTitle: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  gateBody: { fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 20 },
  gateMeta: { fontSize: 13, color: '#00BFFF', fontWeight: '600', marginTop: 10 },
  accessCard: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  accessLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accessValue: { fontSize: 14, fontWeight: '600', color: '#047857', marginTop: 4 },
  accessHint: { fontSize: 12, color: '#059669', marginTop: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  domainBadgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 11, color: '#64748B', flex: 1 },
  clearText: { fontSize: 12, color: '#00BFFF', fontWeight: '600' },
  chatArea: { flex: 1, marginTop: 8 },
  chatContent: { paddingHorizontal: 16, paddingBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  promptChip: {
    width: '100%',
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  promptText: { fontSize: 13, color: '#475569' },
  messageRow: { marginBottom: 12 },
  messageRowUser: { alignItems: 'flex-end' },
  messageRowAssistant: { alignItems: 'flex-start' },
  bubble: { maxWidth: '90%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#00BFFF' },
  bubbleAssistant: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  bubbleText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  sourcesBlock: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  sourcesTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  sourceItem: { fontSize: 11, color: '#64748B' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: '#64748B' },
  errorText: { fontSize: 13, color: '#DC2626', paddingHorizontal: 16, paddingBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  inputDisabled: { backgroundColor: '#F8FAFC' },
  sendBtn: {
    backgroundColor: '#00BFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disclaimer: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    lineHeight: 14,
  },
});