import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFmcsaStatus } from '../hooks/useFmcsaStatus';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  onBack?: () => void;
  navigation?: any;
  route?: any;
}

export const StatusCheckerScreen: React.FC<Props> = ({ onBack, navigation }) => {
  const [dotInput, setDotInput] = useState('');
  const { status, isChecking, checkDot, clear } = useFmcsaStatus();

  const onCheck = async () => {
    if (!dotInput.trim()) return;
    try {
      await checkDot(dotInput);
    } catch (e: any) {
      // errors handled inside hook for demo
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (onBack) onBack(); if (navigation && navigation.goBack) navigation.goBack(); }}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>FMCSA Status Checker</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Enter a DOT number to check status using public FMCSA SAFER data.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={dotInput}
            onChangeText={setDotInput}
            placeholder="DOT Number (e.g. 1234567)"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.checkBtn} onPress={onCheck} disabled={isChecking}>
            {isChecking ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.checkText}>Check</Text>}
          </TouchableOpacity>
        </View>

        {status && (
          <View style={styles.resultCard}>
            <Text style={styles.dot}>DOT {status.dotNumber}</Text>
            <Text style={styles.name}>{status.legalName || 'Carrier Name Not Available'}</Text>

            <View style={styles.row}>
              <StatusBadge status={status.status as any} />
              {status.authorityStatus && <StatusBadge status={status.authorityStatus as any} />}
            </View>

            {status.outOfService && (
              <Text style={styles.alert}>⚠️ This carrier is currently Out of Service</Text>
            )}

            <Text style={styles.meta}>
              Power Units: {status.powerUnits ?? 'N/A'} • Drivers: {status.drivers ?? 'N/A'}
            </Text>
            <Text style={styles.meta}>Source: {status.source}</Text>
            {status.lastUpdated && (
              <Text style={styles.meta}>Last updated: {new Date(status.lastUpdated).toLocaleDateString()}</Text>
            )}

            <TouchableOpacity style={styles.clearBtn} onPress={clear}>
              <Text style={styles.clearText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This is a demonstration using simulated public FMCSA data. For production use, integrate with official FMCSA APIs or SAFER queries. Always verify directly on safer.fmcsa.dot.gov.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  back: { color: '#1E40AF' },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  content: { padding: 16 },
  description: { fontSize: 14, color: '#475569', marginBottom: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  checkBtn: {
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  checkText: { color: '#fff', fontWeight: '600' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  dot: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 20, fontWeight: '700', marginVertical: 4 },
  row: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  alert: { color: '#DC2626', fontWeight: '600', marginTop: 4 },
  meta: { fontSize: 13, color: '#475569', marginTop: 2 },
  clearBtn: { marginTop: 12, alignSelf: 'flex-start' },
  clearText: { color: '#DC2626', fontWeight: '500' },
  disclaimer: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 },
  disclaimerText: { fontSize: 12, color: '#713f12' },
});
