import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { CBLE_CATEGORIES } from '../../cble-prep/constants';
import type { CbleMaterialType, CbleCategoryId } from '../../cble-prep/types';
import { ADMIN_BRAND } from '../constants';
import type { NewCbleMaterialInput } from '../types';

const MATERIAL_TYPES: { value: CbleMaterialType; label: string }[] = [
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
  { value: 'quiz', label: 'Quiz' },
];

interface Props {
  saving: boolean;
  onSubmit: (input: NewCbleMaterialInput) => Promise<{ error: string | null }>;
}

export const CbleUploadForm: React.FC<Props> = ({ saving, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CbleMaterialType>('pdf');
  const [categoryId, setCategoryId] = useState<CbleCategoryId>('customs_law');
  const [assetPath, setAssetPath] = useState('');
  const [requiresFullAccess, setRequiresFullAccess] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setMessage('Title is required.');
      return;
    }

    const result = await onSubmit({
      title,
      description,
      type,
      categoryId,
      assetPath,
      requiresFullAccess,
    });

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('Material added to library (draft).');
      setTitle('');
      setDescription('');
      setAssetPath('');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Upload New Material</Text>
      <Text style={styles.hint}>
        Placeholder upload flow — assets will sync to Supabase Storage when backend is wired.
      </Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Material title"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description"
        placeholderTextColor="#94A3B8"
        multiline
      />

      <Text style={styles.label}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {MATERIAL_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, type === t.value && styles.chipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CBLE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, categoryId === cat.id && styles.chipActive]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
              {cat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Asset Path (optional)</Text>
      <TextInput
        style={styles.input}
        value={assetPath}
        onChangeText={setAssetPath}
        placeholder="cble/pdfs/example.pdf"
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
      />

      <View style={styles.tierRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Tier Access</Text>
          <Text style={styles.tierHint}>
            {requiresFullAccess
              ? 'Full library — annual Pro Broker required'
              : 'Preview — monthly Pro Broker OK'}
          </Text>
        </View>
        <Switch
          value={requiresFullAccess}
          onValueChange={setRequiresFullAccess}
          trackColor={{ false: '#ccc', true: ADMIN_BRAND.accent }}
          thumbColor="#fff"
        />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity
        style={[styles.submitBtn, saving && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text style={styles.submitText}>{saving ? 'Saving…' : 'Add Material'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: ADMIN_BRAND.background,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ADMIN_BRAND.textPrimary,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  chipRow: {
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: ADMIN_BRAND.surface,
  },
  chipActive: {
    backgroundColor: ADMIN_BRAND.accent,
    borderColor: ADMIN_BRAND.accent,
  },
  chipText: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  tierHint: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 2,
  },
  message: {
    fontSize: 13,
    color: ADMIN_BRAND.accent,
    marginTop: 10,
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: ADMIN_BRAND.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});