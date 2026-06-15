import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StepIndicator } from '../components/StepIndicator';
import { useFmcsaStatus } from '../hooks/useFmcsaStatus';
import { ClaimFlowState, FlowStep, DotNumberInfo } from '../types';

interface Props {
  onDone?: () => void;
  onBack?: () => void;
  navigation?: any;
  route?: any;
}

export const DotClaimingFlow: React.FC<Props> = ({ onDone, onBack, navigation }) => {
  const [state, setState] = useState<ClaimFlowState>({
    currentStep: 'enter-dot',
    dotNumber: '',
    submitted: false,
  });

  const { status: liveStatus, isChecking, checkDot, clear } = useFmcsaStatus();

  const goToStep = (step: FlowStep) => {
    setState((s) => ({ ...s, currentStep: step }));
  };

  const handleDotSubmit = async () => {
    if (!state.dotNumber.trim()) return;
    try {
      const info = await checkDot(state.dotNumber);
      setState((s) => ({
        ...s,
        statusInfo: info,
        currentStep: 'verify-status',
      }));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to check DOT at this time.');
    }
  };

  const proceedToClaim = () => {
    if (state.statusInfo?.status === 'Not Found') {
      Alert.alert('DOT Not Found', 'You may need to first register via the FMCSA portal.');
      return;
    }
    goToStep('claim-account');
  };

  const submitClaim = () => {
    if (!state.contactEmail) {
      Alert.alert('Required', 'Please enter a contact email.');
      return;
    }
    // Simulate claim submission
    setState((s) => ({
      ...s,
      submitted: true,
      currentStep: 'confirmation',
    }));
  };

  const finish = () => {
    if (onDone) onDone();
    if (navigation && navigation.navigate) navigation.navigate('Main');
    // reset for next use
    setState({ currentStep: 'enter-dot', dotNumber: '', submitted: false });
    clear();
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'enter-dot':
        return (
          <View>
            <Text style={styles.stepTitle}>Enter your DOT Number</Text>
            <Text style={styles.hint}>7-8 digit number assigned by FMCSA</Text>
            <TextInput
              style={styles.input}
              value={state.dotNumber}
              onChangeText={(t) => setState((s) => ({ ...s, dotNumber: t }))}
              placeholder="e.g. 1234567"
              keyboardType="numeric"
              maxLength={8}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleDotSubmit} disabled={isChecking}>
              {isChecking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Check Status &amp; Continue</Text>}
            </TouchableOpacity>
          </View>
        );

      case 'verify-status':
        return (
          <View>
            <Text style={styles.stepTitle}>Verify DOT Status</Text>
            {state.statusInfo && (
              <View style={styles.statusCard}>
                <Text style={styles.legalName}>{state.statusInfo.legalName || 'Unknown Carrier'}</Text>
                <Text>DOT: {state.statusInfo.dotNumber}</Text>
                <Text style={{ marginTop: 8 }}>Status: {state.statusInfo.status}</Text>
                <Text>Authority: {state.statusInfo.authorityStatus || 'N/A'}</Text>
                {state.statusInfo.outOfService && <Text style={styles.warning}>⚠ Out of Service</Text>}
              </View>
            )}
            <TouchableOpacity style={styles.primaryBtn} onPress={proceedToClaim}>
              <Text style={styles.btnText}>Continue to Claim / Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goToStep('enter-dot')}>
              <Text>Edit DOT Number</Text>
            </TouchableOpacity>
          </View>
        );

      case 'claim-account':
        return (
          <View>
            <Text style={styles.stepTitle}>Claim or Link DOT</Text>
            <Text style={styles.hint}>Provide contact details for the claim request</Text>

            <TextInput
              style={styles.input}
              placeholder="Business email"
              keyboardType="email-address"
              value={state.contactEmail || ''}
              onChangeText={(t) => setState((s) => ({ ...s, contactEmail: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              keyboardType="phone-pad"
              value={state.contactPhone || ''}
              onChangeText={(t) => setState((s) => ({ ...s, contactPhone: t }))}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={submitClaim}>
              <Text style={styles.btnText}>Submit Claim / Link Request</Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              This will initiate the MOTUS/FMCSA linking process. You may receive a PIN via email.
            </Text>
          </View>
        );

      case 'upload-docs':
        // For flow simplicity we skip detailed upload here (use DocumentTracker)
        return (
          <View>
            <Text style={styles.stepTitle}>Upload Supporting Documents</Text>
            <Text style={styles.hint}>Common: MCS-150, Insurance Certificate, Articles of Incorporation</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep('confirmation')}>
              <Text style={styles.btnText}>Skip for now / Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'confirmation':
        return (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.stepTitle}>Request Submitted</Text>
            <Text style={styles.successText}>
              Your DOT claim / link request for {state.dotNumber} has been submitted.
            </Text>
            <Text style={styles.disclaimer}>
              Check your email for confirmation or PIN. Track status in the Document section.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={finish}>
              <Text style={styles.btnText}>Return to MOTUS Home</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>DOT Linking Wizard</Text>
        <View />
      </View>

      <StepIndicator current={state.currentStep} />

      <ScrollView contentContainerStyle={styles.content}>
        {renderStepContent()}
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
  back: { color: '#1E40AF', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  content: { padding: 16 },
  stepTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#0F172A' },
  hint: { color: '#64748B', marginBottom: 16, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryBtn: {
    padding: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legalName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  warning: { color: '#DC2626', fontWeight: '600', marginTop: 6 },
  disclaimer: { fontSize: 13, color: '#64748B', marginTop: 12, lineHeight: 18 },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successText: { fontSize: 16, textAlign: 'center', marginBottom: 12 },
});
