import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useCompanyVerification } from '../hooks/useCompanyVerification';
import { VERIFICATION_COLORS } from '../constants';

export const SelfAttestForm: React.FC = () => {
  const { company, isVerified, selfAttest, submitting, error, message } = useCompanyVerification();
  const [dot, setDot] = useState(company?.dot_number ?? '');
  const [mc, setMc] = useState(company?.mc_number ?? '');

  if (isVerified) {
    return (
      <View style={styles.verifiedBox}>
        <Text style={styles.verifiedText}>Your company is laslogTMX Verified.</Text>
        {company?.dot_number && (
          <Text style={styles.dotText}>DOT {company.dot_number}</Text>
        )}
      </View>
    );
  }

  const handleSubmit = async () => {
    await selfAttest({ dot_number: dot, mc_number: mc || undefined });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Verify Your Company</Text>
      <Text style={styles.subtitle}>
        Self-attest your DOT/MC numbers. Format is validated; admin may review flagged accounts.
      </Text>

      <Text style={styles.label}>DOT Number</Text>
      <TextInput
        style={styles.input}
        value={dot}
        onChangeText={setDot}
        placeholder="6–8 digits"
        keyboardType="number-pad"
        autoCapitalize="none"
      />

      <Text style={styles.label}>MC Number (optional)</Text>
      <TextInput
        style={styles.input}
        value={mc}
        onChangeText={setMc}
        placeholder="MC-123456"
        autoCapitalize="characters"
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.success}>{message}</Text>}

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Verifying…' : 'Submit DOT/MC Verification'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: VERIFICATION_COLORS.unverified,
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: VERIFICATION_COLORS.unverified,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: {
    backgroundColor: VERIFICATION_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: VERIFICATION_COLORS.flagged,
    fontSize: 13,
    marginTop: 8,
  },
  success: {
    color: VERIFICATION_COLORS.verified,
    fontSize: 13,
    marginTop: 8,
  },
  verifiedBox: {
    backgroundColor: VERIFICATION_COLORS.verifiedBg,
    borderRadius: 12,
    padding: 14,
  },
  verifiedText: {
    color: VERIFICATION_COLORS.verified,
    fontWeight: '700',
    fontSize: 14,
  },
  dotText: {
    color: VERIFICATION_COLORS.verified,
    fontSize: 12,
    marginTop: 4,
  },
});