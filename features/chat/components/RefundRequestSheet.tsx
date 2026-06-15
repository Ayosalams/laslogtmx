import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { REFUND_ADMIN_ESCALATION_THRESHOLD_USD } from '../constants';

interface RefundRequestSheetProps {
  visible: boolean;
  triggerMessage: string;
  submitting: boolean;
  uploadingScreenshot: boolean;
  onSubmit: (amount: string, reason: string, screenshotFileName?: string) => void;
  onDismiss: () => void;
}

export const RefundRequestSheet: React.FC<RefundRequestSheetProps> = ({
  visible,
  triggerMessage,
  submitting,
  uploadingScreenshot,
  onSubmit,
  onDismiss,
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState<string | undefined>();

  const handleAttachScreenshot = () => {
    const name = `refund_screenshot_${Date.now()}.png`;
    setScreenshotFileName(name);
  };

  const handleSubmit = () => {
    if (!amount.trim()) return;
    onSubmit(amount, reason, screenshotFileName);
  };

  const handleDismiss = () => {
    setAmount('');
    setReason('');
    setScreenshotFileName(undefined);
    onDismiss();
  };

  const busy = submitting || uploadingScreenshot;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Refund Request</Text>
            <Text style={styles.subtitle}>
              We detected a billing concern in your message. Please complete the form below so our
              team can assist you promptly.
            </Text>

            {triggerMessage ? (
              <View style={styles.triggerBox}>
                <Text style={styles.triggerLabel}>Your message</Text>
                <Text style={styles.triggerText} numberOfLines={3}>
                  {triggerMessage}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>Refund amount (USD) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 150.00"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              editable={!busy}
            />

            <Text style={styles.label}>Reason for refund</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Briefly describe the issue (duplicate charge, cancelled load, etc.)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              editable={!busy}
            />

            <Text style={styles.label}>Supporting screenshot (optional)</Text>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttachScreenshot}
              disabled={busy}
            >
              <Text style={styles.attachText}>
                {screenshotFileName ? `📎 ${screenshotFileName}` : '📷 Attach screenshot'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.escalationNote}>
              Requests over ${REFUND_ADMIN_ESCALATION_THRESHOLD_USD} are automatically escalated to
              our billing team for priority review.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleDismiss} disabled={busy}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, (!amount.trim() || busy) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!amount.trim() || busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  triggerBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  triggerText: {
    fontSize: 14,
    color: '#334155',
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attachBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  escalationNote: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});