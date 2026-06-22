import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { BoardLoad } from '../types';
import { LOAD_BOARD_COLORS } from '../constants';
import { getGlassCardStyle, MOBILE_GLASS_HIGHLIGHT } from '../../../packages/shared/src/utils/glass';
import { formatRateCents, parseRateToCents } from '../utils/formatRate';

interface Props {
  load: BoardLoad;
  submitting: boolean;
  onSubmit: (rateCents: number, notes: string) => void;
  disabled?: boolean;
}

export const BidForm: React.FC<Props> = ({ load, submitting, onSubmit, disabled }) => {
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cents = parseRateToCents(rate);
    if (!cents) {
      setValidationError('Enter a valid bid rate (e.g. 2500).');
      return;
    }
    setValidationError(null);
    onSubmit(cents, notes.trim());
  };

  const glassStyle = getGlassCardStyle();

  return (
    <View style={[styles.container, glassStyle]}>
      <View style={MOBILE_GLASS_HIGHLIGHT} />
      <Text style={styles.title}>Submit Bid</Text>
      <Text style={styles.subtitle}>
        Posted rate: {formatRateCents(load.rate_cents)} · {load.equipment ?? 'Equipment TBD'}
      </Text>

      <Text style={styles.label}>Your Rate (USD)</Text>
      <TextInput
        style={styles.input}
        value={rate}
        onChangeText={setRate}
        placeholder="e.g. 2400"
        keyboardType="decimal-pad"
        editable={!disabled && !submitting}
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Equipment availability, team drivers, etc."
        multiline
        editable={!disabled && !submitting}
      />

      {validationError && <Text style={styles.error}>{validationError}</Text>}

      <TouchableOpacity
        style={[styles.button, (disabled || submitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={disabled || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Bid</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
    // subtle glass via getGlassCardStyle (shared util)
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: LOAD_BOARD_COLORS.textMuted,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: LOAD_BOARD_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: LOAD_BOARD_COLORS.text,
    marginBottom: 12,
    backgroundColor: '#FAFBFC',
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: LOAD_BOARD_COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
});