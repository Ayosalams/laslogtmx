import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useCompanyRatings } from '../hooks/useCompanyRatings';
import { VERIFICATION_COLORS, RATING_LABELS } from '../constants';

interface Props {
  loadId: string;
  ratedCompanyName: string;
  onRated?: () => void;
}

export const RateCompanyForm: React.FC<Props> = ({ loadId, ratedCompanyName, onRated }) => {
  const { submitRating, submitting, error } = useCompanyRatings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return;
    const result = await submitRating({ load_id: loadId, rating, comment });
    if (result.success) {
      setDone(true);
      onRated?.();
    }
  };

  if (done) {
    return (
      <View style={styles.doneBox}>
        <Text style={styles.doneText}>Thank you for rating {ratedCompanyName}.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rate {ratedCompanyName}</Text>
      <Text style={styles.subtitle}>How was your experience on this load?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
            <Text style={[styles.star, { color: n <= rating ? VERIFICATION_COLORS.star : VERIFICATION_COLORS.starEmpty }]}>
              ★
            </Text>
            <Text style={styles.starLabel}>{RATING_LABELS[n]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Optional comment"
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, (submitting || rating < 1) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || rating < 1}
      >
        <Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit Rating'}</Text>
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
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  starBtn: {
    alignItems: 'center',
    flex: 1,
  },
  star: {
    fontSize: 28,
  },
  starLabel: {
    fontSize: 8,
    color: VERIFICATION_COLORS.unverified,
    marginTop: 2,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: VERIFICATION_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  error: {
    color: VERIFICATION_COLORS.flagged,
    fontSize: 13,
    marginTop: 8,
  },
  doneBox: {
    backgroundColor: VERIFICATION_COLORS.verifiedBg,
    borderRadius: 12,
    padding: 14,
  },
  doneText: {
    color: VERIFICATION_COLORS.verified,
    fontWeight: '600',
  },
});