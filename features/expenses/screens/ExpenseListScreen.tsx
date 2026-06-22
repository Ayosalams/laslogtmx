import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { DetentionTimerBanner } from '../../detention-timer/components/DetentionTimerBanner';
import { useDetentionTimer } from '../../detention-timer/hooks/useDetentionTimer';
import { EXPENSE_CATEGORIES, BRAND } from '../../receipt-ocr/constants';
import { buildManualOcrDefaults } from '../../receipt-ocr/utils/parseReceiptText';
import { buildDetentionClaimOcrDefaults } from '../../detention-timer/utils/detentionUtils';
import { useExpenses } from '../hooks/useExpenses';
import type { Expense } from '../types';

interface Props {
  navigation?: {
    navigate: (screen: string, params?: object) => void;
    getParent?: () => { navigate: (screen: string, params?: object) => void } | undefined;
  };
}

function getCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function formatExpenseDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMilitaryTime(timeStr: string): string {
  const match = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return timeStr;
  return `${Number(match[1]).toString().padStart(2, '0')}:${match[2]}`;
}

function ExpenseRow({ item }: { item: Expense }) {
  const timeLabel = item.expense_time ? formatMilitaryTime(item.expense_time) : null;

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.merchant}>{item.merchant}</Text>
        <Text style={styles.meta}>
          {getCategoryLabel(item.category)} • {formatExpenseDate(item.expense_date)}
          {timeLabel ? ` • ${timeLabel}` : ''}
          {item.load_number ? ` • Load ${item.load_number}` : ''}
        </Text>
      </View>
      <Text style={styles.amount}>${Number(item.amount).toFixed(2)}</Text>
    </View>
  );
}

export const ExpenseListScreen: React.FC<Props> = ({ navigation }) => {
  const currentTime = useMilitaryClock();
  const { expenses, loading, refresh, error, companyId } = useExpenses();
  const { session: detentionSession, buildClaimDraft } = useDetentionTimer();

  const stackNav = navigation?.getParent?.() ?? navigation;

  const startScan = useCallback(() => {
    stackNav?.navigate('ReceiptCapture');
  }, [stackNav]);

  const startManualEntry = useCallback(() => {
    const detentionContext = detentionSession
      ? {
          loadNumber: detentionSession.loadNumber,
          loadId: detentionSession.loadId,
          facility: detentionSession.facility,
        }
      : undefined;

    stackNav?.navigate('ReceiptCorrection', {
      manual: true,
      ocrResult: buildManualOcrDefaults(),
      detentionContext,
    });
  }, [stackNav, detentionSession]);

  const startDetentionScan = useCallback(() => {
    if (!detentionSession) {
      startScan();
      return;
    }
    stackNav?.navigate('ReceiptCapture');
  }, [stackNav, detentionSession, startScan]);

  const startDetentionClaim = useCallback(() => {
    const claim = buildClaimDraft();
    if (!claim) {
      startManualEntry();
      return;
    }
    stackNav?.navigate('ReceiptCorrection', {
      manual: true,
      ocrResult: buildDetentionClaimOcrDefaults(claim),
      detentionContext: {
        loadNumber: claim.loadNumber,
        loadId: claim.loadId,
        facility: claim.facility,
      },
      detentionClaim: true,
    });
  }, [buildClaimDraft, stackNav, startManualEntry]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={BRAND.accent} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Expenses</Text>
                <Text style={styles.subtitle}>Receipt OCR • manual entry • detention linking</Text>
              </View>
              <View style={styles.timePill}>
                <Text style={styles.timeText}>{currentTime}</Text>
              </View>
            </View>

            <DetentionTimerBanner
              onScanExpense={startDetentionScan}
              onGenerateClaim={detentionSession ? startDetentionClaim : undefined}
            />

            <TouchableOpacity style={styles.scanBtn} onPress={startScan} activeOpacity={0.85}>
              <Text style={styles.scanBtnIcon}>📷</Text>
              <View style={styles.scanBtnTextWrap}>
                <Text style={styles.scanBtnTitle}>Scan Receipt</Text>
                <Text style={styles.scanBtnSub}>Capture → OCR → Review → Save</Text>
              </View>
              <Text style={styles.scanBtnArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualBtn} onPress={startManualEntry} activeOpacity={0.85}>
              <Text style={styles.manualBtnIcon}>✏️</Text>
              <View style={styles.scanBtnTextWrap}>
                <Text style={styles.manualBtnTitle}>Manual Entry</Text>
                <Text style={styles.scanBtnSub}>No receipt — enter amount and details directly</Text>
              </View>
              <Text style={styles.scanBtnArrow}>→</Text>
            </TouchableOpacity>

            {!companyId && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>Select a company to track expenses.</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptySub}>
                Scan a receipt or use manual entry to log fuel, tolls, detention, and more.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={expenses.length === 0 ? styles.emptyList : undefined}
      />

      {loading && expenses.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={BRAND.accent} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: BRAND.text },
  subtitle: { fontSize: 13, color: BRAND.textMuted, marginTop: 2 },
  timePill: {
    backgroundColor: 'rgba(0,191,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: BRAND.accentDark, fontVariant: ['tabular-nums'] },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.3)',
    shadowColor: BRAND.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
    marginBottom: 10,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: 12,
    marginBottom: 8,
  },
  scanBtnIcon: { fontSize: 28 },
  manualBtnIcon: { fontSize: 24 },
  scanBtnTextWrap: { flex: 1 },
  scanBtnTitle: { fontSize: 16, fontWeight: '700', color: BRAND.text },
  manualBtnTitle: { fontSize: 16, fontWeight: '600', color: BRAND.text },
  scanBtnSub: { fontSize: 12, color: BRAND.textMuted, marginTop: 2 },
  scanBtnArrow: { fontSize: 20, color: BRAND.accent, fontWeight: '600' },
  warningBox: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
  },
  warningText: { fontSize: 13, color: '#713f12' },
  errorBox: {
    marginTop: 12,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { fontSize: 13, color: BRAND.danger },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.card,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  rowMain: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: '600', color: BRAND.text },
  meta: { fontSize: 12, color: BRAND.textMuted, marginTop: 3 },
  amount: { fontSize: 16, fontWeight: '700', color: BRAND.accentDark },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: BRAND.textMuted },
  emptySub: { fontSize: 13, color: BRAND.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyList: { flexGrow: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,252,0.7)',
  },
});