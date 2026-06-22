import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import type { LoadContract } from '../types';
import { LOAD_BOARD_COLORS, VERIFIED_BADGE_LABEL } from '../constants';
import { formatRateCents } from '../utils/formatRate';
import { downloadContractPdf, buildContractPreviewHtml } from '../utils/generateContract';

interface Props {
  contract: LoadContract;
  onDownload?: () => void;
}

export const ContractPreview: React.FC<Props> = ({ contract, onDownload }) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (Platform.OS === 'web') {
      const html = buildContractPreviewHtml(
        {
          id: contract.load_id,
          company_id: contract.broker_company_id,
          load_number: contract.contract_number.split('-')[1] ?? 'LOAD',
          status: 'assigned',
          board_status: 'awarded',
          is_internal_board: true,
          is_laslog_verified: true,
          origin: null,
          destination: null,
          equipment: null,
          rate_cents: contract.agreed_rate_cents,
          weight_lbs: null,
          commodity: null,
          pickup_date: null,
          delivery_date: null,
          notes: null,
          negotiation_channel_id: null,
          created_at: contract.created_at,
          updated_at: contract.updated_at,
        },
        {
          id: contract.bid_id,
          load_id: contract.load_id,
          company_id: contract.carrier_company_id,
          bidder_profile_id: '',
          rate_cents: contract.agreed_rate_cents,
          notes: null,
          status: 'accepted',
          negotiation_channel_id: null,
          created_at: contract.created_at,
          updated_at: contract.updated_at,
        },
        {
          brokerName: 'Broker',
          carrierName: 'Carrier',
        },
        contract.contract_number
      );
      downloadContractPdf(html, `${contract.contract_number}.pdf`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>{VERIFIED_BADGE_LABEL}</Text>
        </View>
        <Text style={styles.title}>Freight Contract</Text>
        <Text style={styles.contractNumber}>{contract.contract_number}</Text>
        <Text style={styles.rate}>Agreed Rate: {formatRateCents(contract.agreed_rate_cents)}</Text>
        <Text style={styles.status}>Status: {contract.status.replace('_', ' ')}</Text>
      </View>

      <ScrollView style={styles.bodyScroll} nestedScrollEnabled>
        <Text style={styles.body}>{contract.contract_body}</Text>
      </ScrollView>

      <View style={styles.sigSection}>
        <Text style={styles.sigLabel}>E-Signature Placeholders</Text>
        <View style={styles.sigRow}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>Broker</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigHint}>
              {contract.broker_signed_at ? `Signed ${contract.broker_signed_at}` : 'Awaiting signature'}
            </Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>Carrier</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigHint}>
              {contract.carrier_signed_at ? `Signed ${contract.carrier_signed_at}` : 'Awaiting signature'}
            </Text>
          </View>
        </View>
      </View>

      {Platform.OS === 'web' && (
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Text style={styles.downloadText}>Download / Print PDF</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LOAD_BOARD_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LOAD_BOARD_COLORS.border,
    overflow: 'hidden',
    marginTop: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: LOAD_BOARD_COLORS.border,
    backgroundColor: '#FAFBFC',
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LOAD_BOARD_COLORS.verifiedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.verified,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.text,
  },
  contractNumber: {
    fontSize: 13,
    color: LOAD_BOARD_COLORS.textMuted,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rate: {
    fontSize: 16,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.accent,
    marginTop: 8,
  },
  status: {
    fontSize: 12,
    color: LOAD_BOARD_COLORS.textMuted,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  bodyScroll: {
    maxHeight: 280,
    padding: 16,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sigSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: LOAD_BOARD_COLORS.border,
  },
  sigLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: LOAD_BOARD_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  sigRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sigBlock: {
    flex: 1,
  },
  sigTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: LOAD_BOARD_COLORS.text,
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: LOAD_BOARD_COLORS.text,
    height: 28,
    marginVertical: 6,
  },
  sigHint: {
    fontSize: 11,
    color: LOAD_BOARD_COLORS.textMuted,
  },
  downloadBtn: {
    margin: 16,
    marginTop: 0,
    backgroundColor: LOAD_BOARD_COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  downloadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});