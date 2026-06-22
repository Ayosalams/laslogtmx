import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { LoadCard } from '../components/LoadCard';
import { useLoadBoard } from '../hooks/useLoadBoard';
import { useLoadMatchNotifications } from '../hooks/useLoadMatchNotifications';
import { useMatchedLoads } from '../hooks/useMatchedLoads';
import { EQUIPMENT_TYPES, LOAD_BOARD_COLORS, VERIFIED_BADGE_LABEL } from '../constants';
import { parseRateToCents } from '../utils/formatRate';
import type { BoardLoad } from '../types';
import { useCompanyProfiles } from '../../verification/hooks/useCompanyProfile';

interface Props {
  navigation?: { navigate?: (screen: string, params?: object) => void };
}

export const LoadBoardScreen: React.FC<Props> = ({ navigation }) => {
  const currentTime = useCurrentTime();
  const { loads, myPostedLoads, loading, posting, access, refresh, postLoad } = useLoadBoard();
  const { matchMap, matchCount, hasPreferences } = useMatchedLoads(loads);
  const { profiles: brokerProfiles } = useCompanyProfiles(loads.map((l) => l.company_id));

  useLoadMatchNotifications((title, body) => {
    Alert.alert(title, body);
  });
  const [showPostForm, setShowPostForm] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [equipment, setEquipment] = useState<string>(EQUIPMENT_TYPES[0]);
  const [rate, setRate] = useState('');
  const [commodity, setCommodity] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const openLoad = (load: BoardLoad) => {
    navigation?.navigate?.('LoadDetail', { loadId: load.id });
  };

  const handlePost = async () => {
    const rateCents = parseRateToCents(rate);
    if (!origin.trim() || !destination.trim() || !rateCents) {
      Alert.alert('Missing Fields', 'Origin, destination, and rate are required.');
      return;
    }

    const pickup = pickupDate.trim()
      ? new Date(pickupDate).toISOString()
      : new Date(Date.now() + 86400000).toISOString();
    const delivery = deliveryDate.trim()
      ? new Date(deliveryDate).toISOString()
      : new Date(Date.now() + 172800000).toISOString();

    const result = await postLoad({
      load_number: '',
      origin: origin.trim(),
      destination: destination.trim(),
      equipment,
      rate_cents: rateCents,
      commodity: commodity.trim() || undefined,
      pickup_date: pickup,
      delivery_date: delivery,
    });

    if (result.error) {
      Alert.alert('Post Failed', result.error.message);
      return;
    }

    Alert.alert('Load Posted', `${result.load?.load_number} is now on the internal board.`);
    setShowPostForm(false);
    setOrigin('');
    setDestination('');
    setRate('');
    setCommodity('');
    setPickupDate('');
    setDeliveryDate('');
  };

  if (!access.canAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>Internal Load Board</Text>
          <Text style={styles.gateBadge}>{VERIFIED_BADGE_LABEL} Required</Text>
          <Text style={styles.gateBody}>{access.gateMessage}</Text>
          <Text style={styles.gateNote}>
            This is an internal feature only — not a public load board.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={LOAD_BOARD_COLORS.accent} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Internal Load Board</Text>
            <Text style={styles.subtitle}>
              {access.canPost ? 'Post & manage loads' : 'View matching loads & bid'}
            </Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <View style={styles.internalBanner}>
          <Text style={styles.internalBadge}>{VERIFIED_BADGE_LABEL}</Text>
          <Text style={styles.internalText}>
            Internal laslogTMX network only — verified carriers & brokers.
          </Text>
        </View>

        {access.canPost && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.postToggle}
              onPress={() => setShowPostForm((v) => !v)}
            >
              <Text style={styles.postToggleText}>
                {showPostForm ? 'Cancel' : '+ Post New Load'}
              </Text>
            </TouchableOpacity>

            {showPostForm && (
              <View style={styles.postForm}>
                <Text style={styles.formLabel}>Origin</Text>
                <TextInput style={styles.input} value={origin} onChangeText={setOrigin} placeholder="Chicago, IL" />

                <Text style={styles.formLabel}>Destination</Text>
                <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="Atlanta, GA" />

                <Text style={styles.formLabel}>Equipment</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.equipScroll}>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <TouchableOpacity
                      key={eq}
                      style={[styles.equipChip, equipment === eq && styles.equipChipActive]}
                      onPress={() => setEquipment(eq)}
                    >
                      <Text style={[styles.equipChipText, equipment === eq && styles.equipChipTextActive]}>
                        {eq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>Rate (USD)</Text>
                <TextInput style={styles.input} value={rate} onChangeText={setRate} placeholder="3200" keyboardType="decimal-pad" />

                <Text style={styles.formLabel}>Commodity (optional)</Text>
                <TextInput style={styles.input} value={commodity} onChangeText={setCommodity} placeholder="General Freight" />

                <Text style={styles.formLabel}>Pickup Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={pickupDate} onChangeText={setPickupDate} placeholder="2026-06-25" />

                <Text style={styles.formLabel}>Delivery Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={deliveryDate} onChangeText={setDeliveryDate} placeholder="2026-06-27" />

                <TouchableOpacity
                  style={[styles.submitBtn, posting && styles.submitBtnDisabled]}
                  onPress={handlePost}
                  disabled={posting}
                >
                  {posting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Post to Internal Board</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {access.canPost && myPostedLoads.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Posted Loads</Text>
            {myPostedLoads.map((load) => (
              <LoadCard
                key={load.id}
                load={load}
                onPress={() => openLoad(load)}
                showBroker
                brokerProfile={brokerProfiles[load.company_id] ?? null}
                matchReasons={matchMap[load.id]}
              />
            ))}
          </>
        )}

        {access.canBid && hasPreferences && matchCount > 0 && (
          <View style={styles.matchBanner}>
            <Text style={styles.matchBannerText}>
              {matchCount} load{matchCount === 1 ? '' : 's'} match your smart alert preferences
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {access.canBid ? 'Available Loads' : 'Open Loads'}
        </Text>

        {loading && loads.length === 0 ? (
          <ActivityIndicator color={LOAD_BOARD_COLORS.accent} style={{ marginTop: 24 }} />
        ) : loads.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matching loads right now.</Text>
            <Text style={styles.emptyHint}>New verified broker postings will appear here.</Text>
          </View>
        ) : (
          loads.map((load) => (
            <LoadCard
              key={load.id}
              load={load}
              onPress={() => openLoad(load)}
              showBroker
              brokerProfile={brokerProfiles[load.company_id] ?? null}
              matchReasons={matchMap[load.id]}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOAD_BOARD_COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: LOAD_BOARD_COLORS.text },
  subtitle: { fontSize: 13, color: LOAD_BOARD_COLORS.textMuted, marginTop: 2 },
  timePill: {
    backgroundColor: LOAD_BOARD_COLORS.accentTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: LOAD_BOARD_COLORS.accent, fontVariant: ['tabular-nums'] },
  internalBanner: {
    backgroundColor: LOAD_BOARD_COLORS.verifiedBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  internalBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.verified,
  },
  internalText: { flex: 1, fontSize: 12, color: '#065F46' },
  section: { marginBottom: 16 },
  postToggle: {
    backgroundColor: LOAD_BOARD_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postToggleText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  postForm: {
    marginTop: 12,
    backgroundColor: LOAD_BOARD_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LOAD_BOARD_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: LOAD_BOARD_COLORS.text,
    backgroundColor: '#FAFBFC',
  },
  equipScroll: { marginBottom: 8 },
  equipChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  equipChipActive: { backgroundColor: LOAD_BOARD_COLORS.accentTint },
  equipChipText: { fontSize: 13, color: LOAD_BOARD_COLORS.textMuted },
  equipChipTextActive: { color: LOAD_BOARD_COLORS.accent, fontWeight: '600' },
  submitBtn: {
    backgroundColor: LOAD_BOARD_COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  matchBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  matchBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '500', color: '#475569' },
  emptyHint: { marginTop: 6, fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  gateCard: {
    margin: 24,
    padding: 24,
    backgroundColor: LOAD_BOARD_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
  },
  gateTitle: { fontSize: 22, fontWeight: '700', color: LOAD_BOARD_COLORS.text, marginBottom: 8 },
  gateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LOAD_BOARD_COLORS.warningBg,
    color: LOAD_BOARD_COLORS.warning,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gateBody: { fontSize: 15, color: '#334155', lineHeight: 22 },
  gateNote: { marginTop: 12, fontSize: 12, color: LOAD_BOARD_COLORS.textMuted, fontStyle: 'italic' },
});