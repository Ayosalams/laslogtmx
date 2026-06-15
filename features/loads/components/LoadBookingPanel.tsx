import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { useLoadBooking } from '../hooks/useLoadBooking';

interface PendingLoad {
  id: string;
  load_number: string;
  origin: string | null;
  destination: string | null;
}

export const LoadBookingPanel: React.FC = () => {
  const { profile, verifyHighRiskAction } = useAuth();
  const { booking, bookLoad } = useLoadBooking();
  const [loads, setLoads] = useState<PendingLoad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingLoads = useCallback(async () => {
    if (!profile?.company_id) {
      setLoads([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('loads')
      .select('id, load_number, origin, destination')
      .eq('company_id', profile.company_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setLoads(data as PendingLoad[]);
    }
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    fetchPendingLoads();
  }, [fetchPendingLoads]);

  const handleBook = async (load: PendingLoad) => {
    const biometric = await verifyHighRiskAction('load_booking');
    if (!biometric.verified) {
      Alert.alert(
        'Verification Required',
        biometric.error ?? 'Biometric verification failed. Load not booked.'
      );
      return;
    }

    const result = await bookLoad({ loadId: load.id });
    if (result.error) {
      Alert.alert('Booking Failed', result.error.message);
      return;
    }

    Alert.alert('Load Booked', `Load ${load.load_number} is now assigned to you.`);
    fetchPendingLoads();
  };

  if (!profile?.company_id) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Loads</Text>
      <Text style={styles.help}>Book pending loads for your company (biometric required).</Text>

      {loading ? (
        <ActivityIndicator color="#1E40AF" style={{ marginTop: 12 }} />
      ) : loads.length === 0 ? (
        <Text style={styles.empty}>No pending loads right now.</Text>
      ) : (
        loads.map((load) => (
          <View key={load.id} style={styles.loadRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loadNumber}>{load.load_number}</Text>
              <Text style={styles.loadRoute}>
                {load.origin ?? 'TBD'} → {load.destination ?? 'TBD'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.bookButton, booking && styles.bookButtonDisabled]}
              onPress={() => handleBook(load)}
              disabled={booking}
            >
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  help: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  empty: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  loadNumber: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  loadRoute: { fontSize: 13, color: '#64748B', marginTop: 2 },
  bookButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});