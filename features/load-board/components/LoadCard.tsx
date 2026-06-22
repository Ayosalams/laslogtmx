import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { getGlassCardStyle, MOBILE_GLASS_HIGHLIGHT } from '../../../packages/shared/src/utils/glass';
import type { LoadMatchReason } from '../../../packages/shared/src/notifications/types';
import type { BoardLoad } from '../types';
import { BOARD_STATUS_LABELS, LOAD_BOARD_COLORS, VERIFIED_BADGE_LABEL } from '../constants';
import { formatRateCents } from '../utils/formatRate';
import { LoadMatchBadge } from './LoadMatchBadge';
import { CompanyProfileStrip } from '../../verification/components/CompanyProfileStrip';
import type { CompanyPublicProfile } from '../../verification/types';

interface Props {
  load: BoardLoad;
  onPress: () => void;
  showBroker?: boolean;
  matchReasons?: LoadMatchReason[];
  brokerProfile?: CompanyPublicProfile | null;
}

export const LoadCard: React.FC<Props> = ({ load, onPress, showBroker, matchReasons, brokerProfile }) => {
  const { isMilitaryTime } = useSettings();
  const pickup = load.pickup_date
    ? formatMessageTime(load.pickup_date, isMilitaryTime)
    : 'TBD';

  const glassStyle = getGlassCardStyle();

  return (
    <TouchableOpacity style={[styles.card, glassStyle]} onPress={onPress} activeOpacity={0.85}>
      <View style={MOBILE_GLASS_HIGHLIGHT} />
      <View style={styles.headerRow}>
        <Text style={styles.loadNumber}>{load.load_number}</Text>
        <View style={styles.badgeRow}>
          {matchReasons && matchReasons.length > 0 && (
            <LoadMatchBadge reasons={matchReasons} compact />
          )}
          {load.is_laslog_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{VERIFIED_BADGE_LABEL}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.route}>
        {load.origin ?? 'TBD'} → {load.destination ?? 'TBD'}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{load.equipment ?? 'Equipment TBD'}</Text>
        <Text style={styles.rate}>{formatRateCents(load.rate_cents)}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Pickup {pickup}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{BOARD_STATUS_LABELS[load.board_status]}</Text>
        </View>
      </View>

      {showBroker && brokerProfile && (
        <CompanyProfileStrip profile={brokerProfile} />
      )}
      {showBroker && !brokerProfile && load.broker_name && (
        <Text style={styles.broker}>Posted by {load.broker_name}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    // glass applied via getGlassCardStyle + highlight (subtle targeted)
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.text,
  },
  verifiedBadge: {
    backgroundColor: LOAD_BOARD_COLORS.verifiedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.verified,
    letterSpacing: 0.3,
  },
  route: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: LOAD_BOARD_COLORS.textMuted,
  },
  rate: {
    fontSize: 18,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.accent,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: LOAD_BOARD_COLORS.textMuted,
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    backgroundColor: LOAD_BOARD_COLORS.accentTint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: LOAD_BOARD_COLORS.accent,
  },
  broker: {
    marginTop: 8,
    fontSize: 12,
    color: LOAD_BOARD_COLORS.textMuted,
  },
});