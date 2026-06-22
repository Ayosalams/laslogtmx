import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { BidForm } from '../components/BidForm';
import { ContractPreview } from '../components/ContractPreview';
import { useBidding } from '../hooks/useBidding';
import { BOARD_STATUS_LABELS, LOAD_BOARD_COLORS, VERIFIED_BADGE_LABEL } from '../constants';
import { formatRateCents } from '../utils/formatRate';
import { useCompanyProfile } from '../../verification/hooks/useCompanyProfile';
import { useCompanyRatings } from '../../verification/hooks/useCompanyRatings';
import { CompanyProfileCard } from '../../verification/components/CompanyProfileCard';
import { RateCompanyForm } from '../../verification/components/RateCompanyForm';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { DetentionTimerBanner } from '../../detention-timer/components/DetentionTimerBanner';
import { useAutoDetentionOnAssignment } from '../../detention-timer/hooks/useAutoDetentionOnAssignment';
import { useDetentionTimer } from '../../detention-timer/hooks/useDetentionTimer';
import { buildDetentionClaimOcrDefaults } from '../../detention-timer/utils/detentionUtils';

interface Props {
  route?: { params?: { loadId?: string } };
  navigation?: { navigate?: (screen: string, params?: object) => void; goBack?: () => void };
}

export const LoadDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const loadId = route?.params?.loadId;
  const { profile } = useAuth();
  const currentTime = useCurrentTime();
  const { isMilitaryTime } = useSettings();
  const {
    load,
    bids,
    contract,
    loading,
    submitting,
    generating,
    access,
    isPoster,
    myBid,
    acceptedBid,
    submitBid,
    updateBidStatus,
    generateContract,
  } = useBidding(loadId);

  const { profile: brokerProfile, refresh: refreshBroker } = useCompanyProfile(load?.company_id);
  const { profile: carrierProfile, refresh: refreshCarrier } = useCompanyProfile(
    contract?.carrier_company_id ?? acceptedBid?.company_id
  );
  const { closeLoad, submitting: closingLoad } = useCompanyRatings();
  const {
    session: detentionSession,
    isActive: detentionActive,
    startTimer,
    buildClaimDraft,
  } = useDetentionTimer();

  const isCarrierAssigned =
    contract?.carrier_company_id === profile?.company_id ||
    (acceptedBid?.status === 'accepted' && acceptedBid.company_id === profile?.company_id);

  useAutoDetentionOnAssignment({
    load,
    contract,
    myBid: acceptedBid ?? myBid,
    carrierCompanyId: profile?.company_id,
    isActive: detentionActive,
    session: detentionSession,
    startTimer,
    enabled: isCarrierAssigned,
  });

  const startDetentionClaim = useCallback(() => {
    const claim = buildClaimDraft();
    if (!claim) return;
    navigation?.navigate?.('ReceiptCorrection', {
      manual: true,
      ocrResult: buildDetentionClaimOcrDefaults(claim),
      detentionContext: {
        loadNumber: claim.loadNumber,
        loadId: claim.loadId,
        facility: claim.facility,
      },
      detentionClaim: true,
    });
  }, [buildClaimDraft, navigation]);

  const ratedCompanyId =
    profile?.company_id === load?.company_id
      ? contract?.carrier_company_id
      : load?.company_id;
  const ratedCompanyName =
    profile?.company_id === load?.company_id
      ? carrierProfile?.name ?? 'Carrier'
      : brokerProfile?.name ?? 'Broker';
  const canRate =
    Boolean(load && contract && ['closed', 'awarded'].includes(load.board_status));
  const canCloseLoad = isPoster && load && !['closed', 'cancelled'].includes(load.board_status) && contract;

  const handleCloseLoad = async () => {
    if (!load) return;
    const result = await closeLoad(load.id);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      Alert.alert('Load Complete', 'You can now rate your counterparty.');
    }
  };

  const openNegotiationChat = (channelId: string, channelName: string) => {
    navigation?.navigate?.('ChatRoom', { channelId, channelName });
  };

  const handleSubmitBid = async (rateCents: number, notes: string) => {
    if (!load) return;
    const result = await submitBid({ load_id: load.id, rate_cents: rateCents, notes });
    if (result.error) {
      Alert.alert('Bid Failed', result.error.message);
      return;
    }
    Alert.alert('Bid Submitted', 'Your bid has been sent to the broker.');
    if (result.channelId) {
      openNegotiationChat(result.channelId, `Load ${load.load_number} — Negotiation`);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    const result = await updateBidStatus(bidId, 'accepted');
    if (result.error) {
      Alert.alert('Error', result.error.message);
      return;
    }
    Alert.alert('Bid Accepted', 'Open negotiation chat to finalize terms, then generate contract.');
  };

  const handleGenerateContract = async (bidId: string) => {
    const result = await generateContract(bidId);
    if (result.error) {
      Alert.alert('Contract Error', result.error.message);
      return;
    }
    Alert.alert('Contract Generated', 'Review and download the contract below.');
  };

  if (!access.canAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.gateText}>Internal load board access required.</Text>
      </SafeAreaView>
    );
  }

  if (loading || !load) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={LOAD_BOARD_COLORS.accent} />
      </SafeAreaView>
    );
  }

  const negotiationChannelId =
    acceptedBid?.negotiation_channel_id ?? myBid?.negotiation_channel_id ?? load.negotiation_channel_id;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <View style={styles.headerCard}>
          {load.is_laslog_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{VERIFIED_BADGE_LABEL}</Text>
            </View>
          )}
          <Text style={styles.loadNumber}>{load.load_number}</Text>
          <Text style={styles.route}>
            {load.origin ?? 'TBD'} → {load.destination ?? 'TBD'}
          </Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Rate</Text>
              <Text style={styles.metaValue}>{formatRateCents(load.rate_cents)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Equipment</Text>
              <Text style={styles.metaValue}>{load.equipment ?? 'TBD'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>{BOARD_STATUS_LABELS[load.board_status]}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Pickup</Text>
              <Text style={styles.metaValue}>
                {load.pickup_date ? formatMessageTime(load.pickup_date, isMilitaryTime) : 'TBD'}
              </Text>
            </View>
          </View>
          {load.commodity && <Text style={styles.commodity}>Commodity: {load.commodity}</Text>}
        </View>

        {isCarrierAssigned && (
          <DetentionTimerBanner
            compact={detentionActive}
            presetLoadNumber={load.load_number}
            presetLoadId={load.id}
            onGenerateClaim={detentionActive ? startDetentionClaim : undefined}
            onScanExpense={
              detentionActive
                ? () => navigation?.navigate?.('ReceiptCapture')
                : undefined
            }
          />
        )}

        {brokerProfile && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Broker Profile</Text>
            <CompanyProfileCard profile={brokerProfile} />
          </View>
        )}

        {carrierProfile && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Carrier Profile</Text>
            <CompanyProfileCard profile={carrierProfile} />
          </View>
        )}

        {canCloseLoad && (
          <TouchableOpacity
            style={styles.closeLoadBtn}
            onPress={handleCloseLoad}
            disabled={closingLoad}
          >
            <Text style={styles.closeLoadBtnText}>
              {closingLoad ? 'Closing…' : 'Mark Load Complete'}
            </Text>
          </TouchableOpacity>
        )}

        {canRate && ratedCompanyId && (
          <View style={styles.profileSection}>
            <RateCompanyForm
              loadId={load.id}
              ratedCompanyName={ratedCompanyName}
              onRated={() => {
                refreshBroker();
                refreshCarrier();
              }}
            />
          </View>
        )}

        {negotiationChannelId && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() =>
              openNegotiationChat(negotiationChannelId, `Load ${load.load_number} — Negotiation`)
            }
          >
            <Text style={styles.chatBtnText}>Open Negotiation Chat</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Bids ({bids.length})</Text>
        {bids.length === 0 ? (
          <Text style={styles.emptyBids}>No bids yet.</Text>
        ) : (
          bids.map((bid) => (
            <View key={bid.id} style={styles.bidRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bidRate}>{formatRateCents(bid.rate_cents)}</Text>
                <Text style={styles.bidStatus}>{bid.status}</Text>
                {bid.notes && <Text style={styles.bidNotes}>{bid.notes}</Text>}
              </View>
              {isPoster && bid.status === 'pending' && (
                <View style={styles.bidActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptBid(bid.id)}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => updateBidStatus(bid.id, 'rejected')}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {bid.status === 'accepted' && !contract && (
                <TouchableOpacity
                  style={styles.contractBtn}
                  onPress={() => handleGenerateContract(bid.id)}
                  disabled={generating}
                >
                  <Text style={styles.contractBtnText}>
                    {generating ? 'Generating…' : 'Generate Contract'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {access.canBid && !isPoster && !myBid && load.board_status !== 'awarded' && (
          <BidForm load={load} submitting={submitting} onSubmit={handleSubmitBid} />
        )}

        {myBid && (
          <View style={styles.myBidCard}>
            <Text style={styles.myBidTitle}>Your Bid</Text>
            <Text style={styles.myBidRate}>{formatRateCents(myBid.rate_cents)}</Text>
            <Text style={styles.myBidStatus}>Status: {myBid.status}</Text>
          </View>
        )}

        {contract && <ContractPreview contract={contract} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOAD_BOARD_COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backLink: { fontSize: 15, fontWeight: '600', color: LOAD_BOARD_COLORS.accent },
  timePill: {
    backgroundColor: LOAD_BOARD_COLORS.accentTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: LOAD_BOARD_COLORS.accent, fontVariant: ['tabular-nums'] },
  headerCard: {
    backgroundColor: LOAD_BOARD_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
    marginBottom: 12,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LOAD_BOARD_COLORS.verifiedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: LOAD_BOARD_COLORS.verified },
  loadNumber: { fontSize: 20, fontWeight: '700', color: LOAD_BOARD_COLORS.text },
  route: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 4 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12 },
  metaItem: { minWidth: '45%' },
  metaLabel: { fontSize: 11, fontWeight: '600', color: LOAD_BOARD_COLORS.textMuted, textTransform: 'uppercase' },
  metaValue: { fontSize: 15, fontWeight: '600', color: LOAD_BOARD_COLORS.text, marginTop: 2 },
  commodity: { marginTop: 10, fontSize: 13, color: LOAD_BOARD_COLORS.textMuted },
  profileSection: { marginBottom: 12 },
  closeLoadBtn: {
    backgroundColor: LOAD_BOARD_COLORS.verifiedBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.verified,
  },
  closeLoadBtnText: { fontSize: 15, fontWeight: '700', color: LOAD_BOARD_COLORS.verified },
  chatBtn: {
    backgroundColor: LOAD_BOARD_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyBids: { fontSize: 14, color: '#94A3B8', marginBottom: 8 },
  bidRow: {
    backgroundColor: LOAD_BOARD_COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  bidRate: { fontSize: 17, fontWeight: '700', color: LOAD_BOARD_COLORS.accent },
  bidStatus: { fontSize: 12, color: LOAD_BOARD_COLORS.textMuted, textTransform: 'capitalize' },
  bidNotes: { fontSize: 12, color: '#475569', marginTop: 4 },
  bidActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: LOAD_BOARD_COLORS.verified, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  rejectBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  contractBtn: { backgroundColor: LOAD_BOARD_COLORS.accentTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  contractBtnText: { color: LOAD_BOARD_COLORS.accent, fontWeight: '700', fontSize: 13 },
  myBidCard: {
    marginTop: 16,
    backgroundColor: LOAD_BOARD_COLORS.accentTint,
    borderRadius: 12,
    padding: 14,
  },
  myBidTitle: { fontSize: 12, fontWeight: '700', color: LOAD_BOARD_COLORS.accent },
  myBidRate: { fontSize: 20, fontWeight: '700', color: LOAD_BOARD_COLORS.text, marginTop: 4 },
  myBidStatus: { fontSize: 13, color: LOAD_BOARD_COLORS.textMuted, marginTop: 4 },
  gateText: { padding: 24, fontSize: 15, color: LOAD_BOARD_COLORS.textMuted, textAlign: 'center' },
});