import React, { useMemo, useState } from 'react';
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
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { useExpenses } from '../../expenses/hooks/useExpenses';
import { EXPENSE_CATEGORIES, BRAND } from '../constants';
import type { ExpenseCategory, ReceiptOcrResult } from '../types';

interface RouteParams {
  imageUri: string;
  ocrResult: ReceiptOcrResult;
}

interface Props {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
  route?: { params?: RouteParams };
}

const CONFIDENCE_LABEL: Record<ReceiptOcrResult['confidence'], { text: string; color: string }> = {
  high: { text: 'High confidence', color: BRAND.success },
  medium: { text: 'Review suggested', color: '#B45309' },
  low: { text: 'Manual entry required', color: BRAND.danger },
};

export const ReceiptCorrectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route?.params;
  const currentTime = useCurrentTime();
  const { isMilitaryTime } = useSettings();
  const { createExpense, saving, error } = useExpenses();

  const [amount, setAmount] = useState(params?.ocrResult.amount ?? '');
  const [merchant, setMerchant] = useState(params?.ocrResult.merchant ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(params?.ocrResult.category ?? 'other');
  const [expenseDate, setExpenseDate] = useState(params?.ocrResult.expenseDate ?? '');
  const [expenseTime, setExpenseTime] = useState(params?.ocrResult.expenseTime ?? '');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const confidence = params?.ocrResult.confidence ?? 'low';
  const confidenceMeta = CONFIDENCE_LABEL[confidence];

  const displayTime = useMemo(() => {
    if (!expenseTime || !/^\d{2}:\d{2}$/.test(expenseTime)) return expenseTime;
    const [h, m] = expenseTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return formatMessageTime(date, isMilitaryTime);
  }, [expenseTime, isMilitaryTime]);

  const validationError = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    if (!merchant.trim()) return 'Merchant is required';
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return 'Enter a valid amount greater than 0';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return 'Date must be YYYY-MM-DD';
    if (!/^\d{2}:\d{2}$/.test(expenseTime)) return 'Time must be military HH:MM';
    if (!confirmed) return 'Confirm the details before saving';
    return null;
  }, [amount, merchant, expenseDate, expenseTime, confirmed]);

  const handleSave = async () => {
    if (validationError) {
      Alert.alert('Review Required', validationError);
      return;
    }

    const result = await createExpense({
      amount: parseFloat(amount),
      merchant: merchant.trim(),
      category,
      expense_date: expenseDate,
      expense_time: expenseTime,
      receipt_image_uri: params?.imageUri,
      notes: notes.trim() || undefined,
      ocr_raw_text: params?.ocrResult.rawText,
      user_confirmed: true,
    });

    if (result) {
      Alert.alert('Expense Saved', `$${parseFloat(amount).toFixed(2)} at ${merchant} recorded.`, [
        { text: 'OK', onPress: () => navigation?.navigate('MainTabs') },
      ]);
    }
  };

  if (!params) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.title}>Missing receipt data</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} disabled={saving}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Confirm</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.mandatoryBanner}>
          <Text style={styles.mandatoryTitle}>Mandatory Correction</Text>
          <Text style={styles.mandatoryText}>
            Verify every field before saving. OCR may misread amounts, dates, or merchant names.
          </Text>
          <Text style={[styles.confidenceBadge, { color: confidenceMeta.color }]}>
            {confidenceMeta.text}
          </Text>
        </View>

        <Image source={{ uri: params.imageUri }} style={styles.thumbnail} resizeMode="cover" />

        <View style={styles.field}>
          <Text style={styles.label}>Amount (USD)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={BRAND.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Merchant</Text>
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Store or vendor name"
            placeholderTextColor={BRAND.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
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
              style={styles.input}
              value={expenseDate}
              onChangeText={setExpenseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={BRAND.textMuted}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Time (24h)</Text>
            <TextInput
              style={styles.input}
              value={expenseTime}
              onChangeText={setExpenseTime}
              placeholder="HH:MM"
              placeholderTextColor={BRAND.textMuted}
              maxLength={5}
            />
            {displayTime ? (
              <Text style={styles.help}>Display: {displayTime}{!isMilitaryTime ? ' (setting applied)' : ''}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Load #, trip details, etc."
            placeholderTextColor={BRAND.textMuted}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.confirmRow, confirmed && styles.confirmRowActive]}
          onPress={() => setConfirmed((v) => !v)}
          activeOpacity={0.85}
        >
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
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
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
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 16,
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: BRAND.danger, fontSize: 13 },
  title: { fontSize: 18, fontWeight: '600', color: BRAND.text, marginBottom: 16 },
});