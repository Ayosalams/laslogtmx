import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useDocumentUploads } from '../hooks/useDocumentUploads';
import { DocumentItem } from '../components/DocumentItem';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  onBack?: () => void;
  initialDot?: string;
  navigation?: any;
  route?: any;
}

const DOC_TYPES = ['MCS-150', 'INSURANCE_FILING', 'DOT_CLAIM', 'AUTHORITY_UPDATE', 'OTHER'] as const;

export const DocumentTrackerScreen: React.FC<Props> = ({ onBack, navigation, initialDot = '1234567' }) => {
  const { submissions, isUploading, uploadDocument, updateStatus, removeSubmission } =
    useDocumentUploads(initialDot);

  const [selectedDot, setSelectedDot] = useState(initialDot);
  const [selectedType, setSelectedType] = useState<typeof DOC_TYPES[number]>('MCS-150');
  const [customFile, setCustomFile] = useState('');

  const handleUpload = async () => {
    const fileName = customFile.trim() || `${selectedType}_${Date.now()}.pdf`;
    try {
      await uploadDocument(selectedDot, selectedType, fileName);
      setCustomFile('');
      Alert.alert('Upload Complete', 'Your document has been recorded with tracking.');
    } catch (e) {
      Alert.alert('Upload failed', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (onBack) onBack(); if (navigation && navigation.goBack) navigation.goBack(); }}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Document Upload &amp; Tracking</Text>
        <View />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Submit New Document</Text>

        <TextInput
          style={styles.input}
          value={selectedDot}
          onChangeText={setSelectedDot}
          placeholder="DOT Number"
          keyboardType="numeric"
        />

        <View style={styles.typeRow}>
          {DOC_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typePill, selectedType === t && styles.typeActive]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>{t.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={customFile}
          onChangeText={setCustomFile}
          placeholder="File name (optional) - e.g. Insurance_2026.pdf"
        />

        <TouchableOpacity
          style={[styles.uploadBtn, isUploading && styles.disabled]}
          onPress={handleUpload}
          disabled={isUploading}
        >
          <Text style={styles.uploadText}>{isUploading ? 'Uploading...' : '📤 Simulate Document Upload'}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Your Submissions ({submissions.length})</Text>

        {submissions.length === 0 && (
          <Text style={styles.empty}>No submissions yet. Use the form above to add one.</Text>
        )}

        {submissions.map((sub) => (
          <DocumentItem
            key={sub.id}
            submission={sub}
            onRemove={removeSubmission}
          />
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            In a full implementation this would upload to secure cloud storage and sync status from FMCSA MOTUS.
            Timestamps shown in your preferred military/standard format.
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
  scroll: { padding: 16 },
  section: { fontSize: 16, fontWeight: '600', marginVertical: 12, color: '#1E293B' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeActive: {
    backgroundColor: '#1E40AF',
  },
  typeText: { fontSize: 12, color: '#475569' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  uploadBtn: {
    backgroundColor: '#1E40AF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabled: { opacity: 0.6 },
  uploadText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#64748B', fontStyle: 'italic', marginBottom: 12 },
  note: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#713f12',
  },
});
