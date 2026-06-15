import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ErrorSolutionCard } from '../components/ErrorSolutionCard';
import { TroubleshootingItem } from '../types';

const ERRORS: TroubleshootingItem[] = [
  {
    id: 'err-1',
    title: 'DOT Number Not Found or Invalid',
    description: 'The system cannot locate your DOT number during claim or linking.',
    category: 'DOT Linking / Claim',
    solutions: [
      'Double-check the DOT number on your MC Authority or insurance filings.',
      'If newly registered, wait 24-72 hours for FMCSA systems to sync.',
      'Register or update at https://www.fmcsa.dot.gov/registration',
      'Contact FMCSA at 1-800-832-5660 with your MC/MX number.',
    ],
    commonFixTime: '1-3 business days',
  },
  {
    id: 'err-2',
    title: 'Authority Already Claimed by Another Entity',
    description: 'MOTUS shows the DOT is linked to a different company or user.',
    category: 'DOT Linking / Claim',
    solutions: [
      'Verify ownership via your MC certificate or SAFER report.',
      'Submit a request to transfer or correct via the FMCSA portal with proof of ownership.',
      'File a MCS-150 update and include supporting legal docs.',
      'Escalate with FMCSA help desk and reference previous ticket numbers.',
    ],
    commonFixTime: '5-10 business days',
  },
  {
    id: 'err-3',
    title: 'PIN Not Received or Expired',
    description: 'No email/SMS PIN for account verification or login.',
    category: 'PIN & Login',
    solutions: [
      'Check spam/junk folders and add @fmcsa.dot.gov to safe senders.',
      'Request PIN resend from the MOTUS login recovery flow.',
      'Ensure the email on file with FMCSA matches your current address.',
      'If still missing, call FMCSA support and verify identity with MC number.',
    ],
  },
  {
    id: 'err-4',
    title: 'Out of Service (OOS) Status Blocking Operations',
    description: 'Carrier shows as OOS in SAFER/MOTUS due to insurance lapse or violations.',
    category: 'Authority & Insurance',
    solutions: [
      'Upload current insurance certificate (Form MCS-90) immediately.',
      'File updated MCS-150 if operations have changed.',
      'Pay any outstanding fines or penalties listed on the SMS report.',
      'Monitor SAFER daily; OOS often lifts within 24 hours of filing.',
    ],
    commonFixTime: '24-48 hours after correct filing',
  },
  {
    id: 'err-5',
    title: 'Manual Submission Not Appearing in MOTUS',
    description: 'Documents sent via mail/fax/email are not reflected in the portal.',
    category: 'Document Submission',
    solutions: [
      'Always retain the confirmation or tracking number from USPS/FedEx.',
      'Resubmit electronically through the MOTUS portal when possible.',
      'Call FMCSA and provide tracking + date of submission for manual lookup.',
      'Keep digital copies named clearly (DOT-Number_DocType_Date.pdf).',
    ],
  },
];

interface Props {
  onBack?: () => void;
  navigation?: any;
  route?: any;
}

export const TroubleshootingScreen: React.FC<Props> = ({ onBack, navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (onBack) onBack(); if (navigation && navigation.goBack) navigation.goBack(); }}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Troubleshooting</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Tap any card to expand common FMCSA/MOTUS errors and proven fixes.
        </Text>
        {ERRORS.map((err) => (
          <ErrorSolutionCard key={err.id} item={err} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  back: { color: '#1E40AF', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  scroll: { padding: 16 },
  intro: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
});
