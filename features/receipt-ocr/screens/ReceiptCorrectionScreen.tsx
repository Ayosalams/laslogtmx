import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { getGlassCardStyle, MOBILE_GLASS_HIGHLIGHT } from '../../../packages/shared/src/utils/glass';
import { useExpenses } from '../../expenses/hooks/useExpenses';
import { DetentionTimerBanner } from '../../detention-timer/components/DetentionTimerBanner';
import { useDetentionTimer } from '../../detention-timer/hooks/useDetentionTimer';
import { EXPENSE_CATEGORIES, BRAND } from '../constants';
import {
  normalizeAmountInput,
  validateAmount,
  validateExpenseDate,
  validateMilitaryTime,
} from '../utils/validateExpenseFields';
import type { ExpenseCategory, FieldConfidence, ReceiptCaptureParams } from '../types';

interface Props {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
  route?: { params?: ReceiptCaptureParams };
}

const CONFIDENCE_LABEL: Record<FieldConfidence, { text: string; color: string }> = {
  high: { text: 'High confidence', color: BRAND.success },
  medium: { text: 'Review suggested', color: BRAND.warning },
  low: { text: 'Manual entry required', color: BRAND.danger },
};

function fieldBorderColor(confidence: FieldConfidence | undefined, hasError: boolean): string {
  if (hasError) return BRAND.danger;
  if (confidence === 'low') return 'rgba(220,38,38,0.45)';
  if (confidence === 'medium') return 'rgba(180,83,9,0.4)';
  return BRAND.border;
}

export const ReceiptCorrectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route?.params;
  const ocrResult = params?.ocrResult;
  const isManual = params?.manual === true;
  const currentTime = useMilitaryClock();
  const { createExpense, saving, error } = useExpenses();
  const { detentionNotePrefix } = useDetentionTimer();

  const [amount, setAmount] = useState(ocrResult?.amount ?? '');
  const [merchant, setMerchant] = useState(ocrResult?.merchant ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(ocrResult?.category ?? 'other');
  const [expenseDate, setExpenseDate] = useState(ocrResult?.expenseDate ?? '');
  const [expenseTime, setExpenseTime] = useState(ocrResult?.expenseTime ?? '');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const detentionContext = params?.detentionContext;
  const isDetentionClaim = params?.detentionClaim === true;
  const fieldConfidence = ocrResult?.fieldConfidence;
  const confidence = ocrResult?.confidence ?? 'low';
  const confidenceMeta = CONFIDENCE_LABEL[confidence];

  useEffect(() => {
    const prefixes: string[] = [];
    if (detentionContext?.loadNumber) {
      prefixes.push(
        `Load ${detentionContext.loadNumber} • ${detentionContext.facility ?? 'pickup'} detention`
      );
    } else if (detentionNotePrefix) {
      prefixes.push(detentionNotePrefix);
    }
    if (prefixes.length > 0 && !notes) {
      setNotes(prefixes.join(' • '));
    }
  }, [detentionContext, detentionNotePrefix, notes]);

  const amountValidation = useMemo(
    () => validateAmount(amount, category, ocrResult?.amount),
    [amount, category, ocrResult?.amount]
  );
  const dateValidation = useMemo(() => validateExpenseDate(expenseDate), [expenseDate]);
  const timeValidation = useMemo(() => validateMilitaryTime(expenseTime), [expenseTime]);

  const validationError = useMemo(() => {
    if (!merchant.trim()) return 'Merchant is required';
    if (!amountValidation.valid) return amountValidation.error;
    if (!dateValidation.valid) return dateValidation.error;
    if (!timeValidation.valid) return timeValidation.error;
    if (!confirmed) return 'Confirm the details before saving';
    return null;
  }, [merchant, amountValidation, dateValidation, timeValidation, confirmed]);

  const handleAmountBlur = () => {
    setTouched((t) => ({ ...t, amount: true }));
    if (amountValidation.normalized) setAmount(amountValidation.normalized);
  };

  const handleTimeBlur = () => {
    setTouched((t) => ({ ...t, time: true }));
    if (timeValidation.normalized) setExpenseTime(timeValidation.normalized);
  };

  const handleSave = async () => {
    setTouched({ amount: true, merchant: true, date: true, time: true });
    if (validationError) {
      Alert.alert('Review Required', validationError);
      return;
    }

    const result = await createExpense({
      amount: parseFloat(amountValidation.normalized ?? amount),
      merchant: merchant.trim(),
      category,
      expense_date: expenseDate,
      expense_time: timeValidation.normalized ?? expenseTime,
      receipt_image_uri: params?.imageUri,
      notes: notes.trim() || undefined,
      ocr_raw_text: ocrResult?.rawText,
      user_confirmed: true,
      load_id: detentionContext?.loadId ?? undefined,
      load_number: detentionContext?.loadNumber,
    });

    if (result) {
      Alert.alert('Expense Saved', `$${parseFloat(amount).toFixed(2)} at ${merchant} recorded.`, [
        { text: 'OK', onPress: () => navigation?.navigate('MainTabs') },
      ]);
    }
  };

  if (!params || (!ocrResult && !isManual)) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.title}>Missing receipt data</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categorySuggestions = ocrResult?.categorySuggestions ?? [];
  const amountCandidates = ocrResult?.amountCandidates ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} disabled={saving}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isManual ? 'Manual Entry' : 'Review & Confirm'}</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <DetentionTimerBanner compact />

        {isDetentionClaim && (
          <View style={styles.claimBanner}>
            <Text style={styles.claimTitle}>Detention Claim</Text>
            <Text style={styles.claimText}>
              Pre-filled from active timer. Confirm billable time and amount before saving.
            </Text>
          </View>
        )}

        <View style={[styles.mandatoryBanner, getGlassCardStyle()]}>
          <View style={MOBILE_GLASS_HIGHLIGHT} />
          <Text style={styles.mandatoryTitle}>
            {isManual ? 'Manual Expense Entry' : 'Mandatory Correction'}
          </Text>
          <Text style={styles.mandatoryText}>
            {isManual
              ? 'Enter expense details manually. All timestamps use military time (HH:MM).'
              : 'Verify every field before saving. OCR may misread amounts, dates, or merchant names.'}
          </Text>
          {!isManual && (
            <Text style={[styles.confidenceBadge, { color: confidenceMeta.color }]}>
              {confidenceMeta.text}
            </Text>
          )}
        </View>

        {params.imageUri ? (
          <Image source={{ uri: params.imageUri }} style={styles.thumbnail} resizeMode="cover" />
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Amount (USD)</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: fieldBorderColor(
                  fieldConfidence?.amount,
                  touched.amount && !amountValidation.valid
                ),
              },
            ]}
            value={amount}
            onChangeText={(v) => setAmount(normalizeAmountInput(v))}
            onBlur={handleAmountBlur}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={BRAND.textMuted}
          />
          {touched.amount && amountValidation.error ? (
            <Text style={styles.fieldError}>{amountValidation.error}</Text>
          ) : amountValidation.warning ? (
            <Text style={styles.fieldWarning}>{amountValidation.warning}</Text>
          ) : null}
          {amountCandidates.length > 1 ? (
            <View style={styles.candidateRow}>
              {amountCandidates.slice(0, 4).map((c) => (
                <TouchableOpacity
                  key={`${c.label}-${c.amount}`}
                  style={[styles.candidateChip, amount === c.amount && styles.candidateChipActive]}
                  onPress={() => setAmount(c.amount)}
                >
                  <Text style={styles.candidateLabel}>{c.label}</Text>
                  <Text style={styles.candidateAmount}>${c.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Merchant</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: fieldBorderColor(fieldConfidence?.merchant, touched.merchant && !merchant.trim()) },
            ]}
            value={merchant}
            onChangeText={setMerchant}
            onBlur={() => setTouched((t) => ({ ...t, merchant: true }))}
            placeholder="Store or vendor name"
            placeholderTextColor={BRAND.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          {categorySuggestions.length > 0 ? (
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionTitle}>OCR suggestions</Text>
              <View style={styles.suggestionRow}>
                {categorySuggestions.slice(0, 3).map((s) => {
                  const meta = EXPENSE_CATEGORIES.find((c) => c.value === s.category);
                  const selected = category === s.category;
                  return (
                    <TouchableOpacity
                      key={s.category}
                      style={[styles.suggestionChip, selected && styles.suggestionChipActive]}
                      onPress={() => setCategory(s.category)}
                    >
                      <Text style={styles.suggestionChipText}>
                        {meta?.icon} {meta?.label}
                      </Text>
                      <Text style={styles.suggestionReason}>{s.reason}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const selected = category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: fieldBorderColor(
                    fieldConfidence?.date,
                    touched.date && !dateValidation.valid
                  ),
                },
              ]}
              value={expenseDate}
              onChangeText={setExpenseDate}
              onBlur={() => setTouched((t) => ({ ...t, date: true }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={BRAND.textMuted}
            />
            {touched.date && dateValidation.error ? (
              <Text style={styles.fieldError}>{dateValidation.error}</Text>
            ) : null}
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Time (24h)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: fieldBorderColor(
                    fieldConfidence?.time,
                    touched.time && !timeValidation.valid
                  ),
                },
              ]}
              value={expenseTime}
              onChangeText={setExpenseTime}
              onBlur={handleTimeBlur}
              placeholder="HH:MM"
              placeholderTextColor={BRAND.textMuted}
              maxLength={5}
            />
            {touched.time && timeValidation.error ? (
              <Text style={styles.fieldError}>{timeValidation.error}</Text>
            ) : (
              <Text style={styles.help}>Stored as military time</Text>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Load #, trip details, detention context…"
            placeholderTextColor={BRAND.textMuted}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.confirmRow, confirmed && styles.confirmRowActive, getGlassCardStyle()]}
          onPress={() => setConfirmed((v) => !v)}
          activeOpacity={0.85}
        >
          <View style={MOBILE_GLASS_HIGHLIGHT} />
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.confirmText}>
            I have reviewed and corrected all fields. This expense is accurate.
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, (saving || !!validationError) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Save Expense</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: BRAND.text },
  backBtn: { fontSize: 15, fontWeight: '600', color: BRAND.accent, minWidth: 60 },
  timePill: {
    backgroundColor: 'rgba(0,191,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: BRAND.accentDark, fontVariant: ['tabular-nums'] },
  scroll: { padding: 16, paddingBottom: 32 },
  mandatoryBanner: {
    padding: 16,
    marginBottom: 16,
    // glass applied (subtle targeted)
  },
  mandatoryTitle: { fontSize: 15, fontWeight: '700', color: BRAND.text, marginBottom: 4 },
  mandatoryText: { fontSize: 13, color: BRAND.textMuted, lineHeight: 18 },
  confidenceBadge: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  thumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: BRAND.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BRAND.text,
  },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  help: { fontSize: 11, color: BRAND.textMuted, marginTop: 4 },
  fieldError: { fontSize: 12, color: BRAND.danger, marginTop: 4 },
  fieldWarning: { fontSize: 12, color: BRAND.warning, marginTop: 4, lineHeight: 16 },
  candidateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  candidateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  candidateChipActive: { borderColor: BRAND.accent, backgroundColor: 'rgba(0,191,255,0.1)' },
  candidateLabel: { fontSize: 10, color: BRAND.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  candidateAmount: { fontSize: 13, fontWeight: '700', color: BRAND.text },
  suggestionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  suggestionTitle: { fontSize: 11, fontWeight: '700', color: BRAND.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
    minWidth: 100,
  },
  suggestionChipActive: { borderColor: BRAND.accent, backgroundColor: 'rgba(0,191,255,0.1)' },
  suggestionChipText: { fontSize: 13, fontWeight: '600', color: BRAND.text },
  suggestionReason: { fontSize: 10, color: BRAND.textMuted, marginTop: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(0,191,255,0.12)',
    borderColor: BRAND.accent,
  },
  categoryIcon: { fontSize: 14 },
  categoryLabel: { fontSize: 13, fontWeight: '500', color: BRAND.textMuted },
  categoryLabelSelected: { color: BRAND.accentDark, fontWeight: '700' },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    // glass via util
  },
  confirmRowActive: { borderColor: BRAND.accent, backgroundColor: 'rgba(0,191,255,0.06)' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  confirmText: { flex: 1, fontSize: 14, color: BRAND.text, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: BRAND.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
  claimBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  claimTitle: { fontSize: 14, fontWeight: '700', color: '#B45309' },
  claimText: { fontSize: 12, color: '#92400E', marginTop: 4, lineHeight: 17 },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: BRAND.danger, fontSize: 13 },
  title: { fontSize: 18, fontWeight: '600', color: BRAND.text, marginBottom: 16 },
});