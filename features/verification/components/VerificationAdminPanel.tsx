import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useVerificationAdmin } from '../hooks/useVerificationAdmin';
import { ADMIN_BRAND } from '../../admin/constants';
import { FRAUD_FLAG_REASONS, VERIFICATION_STATUS_LABELS } from '../constants';
import { VerifiedBadge } from './VerifiedBadge';
import { CompanyRatingStars } from './CompanyRatingStars';
import { formatAverageRating } from '../utils/formatRating';

export const VerificationAdminPanel: React.FC = () => {
  const { companies, loading, updatingId, error, verifyCompany, flagCompany } = useVerificationAdmin();
  const [flagReason, setFlagReason] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={ADMIN_BRAND.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Company Verification</Text>
      <Text style={styles.subtitle}>
        Verify carriers/brokers or flag suspicious companies. Flags write to fraud_flags.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {companies.map((co) => (
        <View key={co.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Text style={styles.name}>{co.name}</Text>
              <Text style={styles.meta}>
                {co.company_type} • DOT {co.dot_number ?? '—'} • MC {co.mc_number ?? '—'}
              </Text>
            </View>
            <VerifiedBadge
              verificationStatus={co.verification_status}
              isLaslogVerified={co.is_laslog_verified}
              isFraudFlagged={co.is_fraud_flagged}
            />
          </View>

          <CompanyRatingStars averageRating={co.average_rating} ratingCount={co.rating_count} />
          <Text style={styles.statusText}>
            Status: {VERIFICATION_STATUS_LABELS[co.verification_status]} •{' '}
            {formatAverageRating(co.average_rating, co.rating_count)}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              disabled={updatingId === co.id}
              onPress={() => verifyCompany(co.id, true)}
            >
              <Text style={styles.btnPrimaryText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              disabled={updatingId === co.id}
              onPress={() => verifyCompany(co.id, false)}
            >
              <Text style={styles.btnSecondaryText}>Unverify</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.flagRow}>
            {FRAUD_FLAG_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.flagChip,
                  flagReason[co.id] === reason && styles.flagChipActive,
                ]}
                onPress={() => setFlagReason((prev) => ({ ...prev, [co.id]: reason }))}
              >
                <Text
                  style={[
                    styles.flagChipText,
                    flagReason[co.id] === reason && styles.flagChipTextActive,
                  ]}
                >
                  {reason.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnDanger]}
            disabled={updatingId === co.id || !flagReason[co.id]}
            onPress={() => flagCompany(co.id, flagReason[co.id] ?? 'other')}
          >
            <Text style={styles.btnDangerText}>Flag for Fraud</Text>
          </TouchableOpacity>
        </View>
      ))}

      {companies.length === 0 && (
        <Text style={styles.empty}>No companies found.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  center: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 8,
  },
  error: {
    color: ADMIN_BRAND.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  card: {
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
  },
  meta: {
    fontSize: 11,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    color: ADMIN_BRAND.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#D1FAE5',
  },
  btnPrimaryText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
  },
  btnSecondaryText: {
    color: ADMIN_BRAND.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: '#FEE2E2',
    flex: undefined,
    width: '100%',
  },
  btnDangerText: {
    color: ADMIN_BRAND.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  flagChipActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  flagChipText: {
    fontSize: 10,
    color: ADMIN_BRAND.textSecondary,
    textTransform: 'capitalize',
  },
  flagChipTextActive: {
    color: ADMIN_BRAND.danger,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: ADMIN_BRAND.textSecondary,
    paddingVertical: 24,
  },
});