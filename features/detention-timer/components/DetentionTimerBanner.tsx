import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { getGlassCardStyle, MOBILE_GLASS_HIGHLIGHT } from '../../../packages/shared/src/utils/glass';
import { LiveActivityWidgetBridge } from '../../../apps/mobile/src/lib/LiveActivityWidgetBridge';
import { BRAND } from '../../receipt-ocr/constants';
import { useDetentionTimer } from '../hooks/useDetentionTimer';
import { formatDuration, facilityLabel } from '../utils/detentionUtils';
import type { DetentionFacility } from '../types';

interface Props {
  compact?: boolean;
  onScanExpense?: () => void;
  onGenerateClaim?: () => void;
  presetLoadNumber?: string;
  presetLoadId?: string | null;
}

export const DetentionTimerBanner: React.FC<Props> = ({
  compact,
  onScanExpense,
  onGenerateClaim,
  presetLoadNumber,
  presetLoadId,
}) => {
  const currentTime = useMilitaryClock();
  const { session, elapsed, loading, isActive, startTimer, stopTimer } = useDetentionTimer();
  const [loadNumber, setLoadNumber] = useState(presetLoadNumber ?? '');
  const [facility, setFacility] = useState<DetentionFacility>('pickup');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const glass = getGlassCardStyle();
  const glassActive = getGlassCardStyle({ active: true });

  if (loading) {
    return (
      <View style={[styles.card, glass, compact && styles.cardCompact]}>
        <ActivityIndicator color={BRAND.accent} size="small" />
      </View>
    );
  }

  if (isActive && session && elapsed) {
    // iOS Live Activity scaffold sync (no-op Android)
    LiveActivityWidgetBridge.startDetention({
      loadNumber: session.loadNumber,
      facility: session.facility,
      startedAtMilitary: elapsed.startedAtMilitary,
      elapsedMinutes: elapsed.totalMinutes,
      billableMinutes: elapsed.billableMinutes,
      freeMinutesRemaining: elapsed.freeMinutesRemaining,
      isBillable: elapsed.isBillable,
    });
    return (
      <View style={[styles.card, glassActive, compact && styles.cardCompact]}>
        <View style={MOBILE_GLASS_HIGHLIGHT} />
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>Detention Timer</Text>
          <Text style={styles.activeLoad}>Load {session.loadNumber}</Text>
        </View>
        <Text style={styles.meta}>
          {facilityLabel(session.facility)} • Started {elapsed.startedAtMilitary} • Now {currentTime}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Elapsed</Text>
            <Text style={styles.statValue}>{formatDuration(elapsed.totalMinutes)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Billable</Text>
            <Text style={[styles.statValue, elapsed.isBillable && styles.statBillable]}>
              {formatDuration(elapsed.billableMinutes)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Free Left</Text>
            <Text style={styles.statValue}>{formatDuration(elapsed.freeMinutesRemaining)}</Text>
          </View>
        </View>
        {!elapsed.isBillable && (
          <Text style={styles.freeHint}>
            {elapsed.freeMinutesRemaining > 0
              ? `${elapsed.freeMinutesRemaining} min free time remaining`
              : 'Free time exhausted — billable time accruing'}
          </Text>
        )}
        <View style={styles.actionRow}>
          {onGenerateClaim ? (
            <TouchableOpacity style={styles.claimLink} onPress={onGenerateClaim}>
              <Text style={styles.claimLinkText}>Generate claim →</Text>
            </TouchableOpacity>
          ) : onScanExpense ? (
            <TouchableOpacity style={styles.scanLink} onPress={onScanExpense}>
              <Text style={styles.scanLinkText}>Scan detention expense →</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.stopBtn} onPress={stopTimer}>
            <Text style={styles.stopBtnText}>End Timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (compact) return null;

  return (
    <View style={[styles.card, glass]}>
      <View style={MOBILE_GLASS_HIGHLIGHT} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Detention Timer</Text>
        <Text style={styles.timePill}>{currentTime}</Text>
      </View>
      <Text style={styles.subtitle}>Track wait time at pickup or delivery for expense attribution.</Text>

      <TextInput
        style={styles.input}
        value={loadNumber}
        onChangeText={setLoadNumber}
        placeholder="Load #"
        placeholderTextColor={BRAND.textMuted}
        autoCapitalize="characters"
      />

      <View style={styles.facilityRow}>
        {(['pickup', 'delivery'] as DetentionFacility[]).map((f) => {
          const selected = facility === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.facilityChip, selected && styles.facilityChipSelected]}
              onPress={() => setFacility(f)}
            >
              <Text style={[styles.facilityLabel, selected && styles.facilityLabelSelected]}>
                {facilityLabel(f)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.startBtn, starting && styles.btnDisabled]}
        disabled={starting}
        onPress={async () => {
          setStarting(true);
          setError(null);
          const result = await startTimer({
            loadNumber: loadNumber || presetLoadNumber || '',
            loadId: presetLoadId,
            facility,
          });
          if (result.error) setError(result.error);
          setStarting(false);
        }}
      >
        <Text style={styles.startBtnText}>{starting ? 'Starting…' : 'Start Detention Timer'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 12,
    // subtle glass from shared util (getGlassCardStyle)
  },
  cardCompact: { marginBottom: 10, padding: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: BRAND.text },
  timePill: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.accentDark,
    backgroundColor: 'rgba(0,191,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontVariant: ['tabular-nums'],
  },
  subtitle: { fontSize: 12, color: BRAND.textMuted, marginTop: 4, marginBottom: 10, lineHeight: 17 },
  input: {
    backgroundColor: BRAND.background,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: BRAND.text,
    marginBottom: 10,
  },
  facilityRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  facilityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    backgroundColor: BRAND.background,
  },
  facilityChipSelected: {
    borderColor: BRAND.accent,
    backgroundColor: 'rgba(0,191,255,0.12)',
  },
  facilityLabel: { fontSize: 13, fontWeight: '600', color: BRAND.textMuted },
  facilityLabelSelected: { color: BRAND.accentDark },
  startBtn: {
    backgroundColor: BRAND.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  errorText: { color: BRAND.danger, fontSize: 12, marginBottom: 8 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeTitle: { fontSize: 14, fontWeight: '700', color: BRAND.text },
  activeLoad: { fontSize: 13, fontWeight: '700', color: BRAND.accentDark },
  meta: { fontSize: 12, color: BRAND.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: {
    flex: 1,
    backgroundColor: BRAND.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  statLabel: { fontSize: 10, color: BRAND.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '700', color: BRAND.text, marginTop: 2, fontVariant: ['tabular-nums'] },
  statBillable: { color: '#B45309' },
  freeHint: { fontSize: 11, color: BRAND.textMuted, marginTop: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  claimLink: { flex: 1 },
  claimLinkText: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  scanLink: { flex: 1 },
  scanLinkText: { fontSize: 13, fontWeight: '600', color: BRAND.accent },
  stopBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  stopBtnText: { fontSize: 13, fontWeight: '600', color: BRAND.text },
});