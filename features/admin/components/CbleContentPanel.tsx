import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { CBLE_CATEGORIES } from '../../cble-prep/constants';
import { useCbleContentAdmin } from '../hooks/useCbleContentAdmin';
import { CbleUploadForm } from './CbleUploadForm';
import { ADMIN_BRAND } from '../constants';

export const CbleContentPanel: React.FC = () => {
  const { materials, saving, addMaterial, toggleTierAccess } = useCbleContentAdmin();
  const { isMilitaryTime } = useSettings();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>CBLE Content Management</Text>
      <Text style={styles.subheading}>
        Upload training materials and configure tier access for the CBLE library.
      </Text>

      <CbleUploadForm
        saving={saving}
        onSubmit={async (input) => {
          const result = await addMaterial(input);
          return { error: result.error };
        }}
      />

      <Text style={styles.sectionTitle}>Library Materials ({materials.length})</Text>

      {materials.map((material) => {
        const category = CBLE_CATEGORIES.find((c) => c.id === material.categoryId);
        const timeLabel = formatMessageTime(material.updatedAt, isMilitaryTime);

        return (
          <View key={material.id} style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <Text style={styles.materialTitle}>{material.title}</Text>
              {material.isDraft ? (
                <View style={styles.draftBadge}>
                  <Text style={styles.draftText}>Draft</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.materialMeta}>
              {material.type.toUpperCase()} • {category?.title ?? material.categoryId} • {timeLabel}
            </Text>
            <Text style={styles.materialDesc} numberOfLines={2}>
              {material.description}
            </Text>

            <View style={styles.tierRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierLabel}>Full Access Required</Text>
                <Text style={styles.tierValue}>
                  {material.requiresFullAccess ? 'Annual Pro Broker' : 'Preview (Monthly OK)'}
                </Text>
              </View>
              {saving ? (
                <ActivityIndicator size="small" color={ADMIN_BRAND.accent} />
              ) : (
                <Switch
                  value={material.requiresFullAccess}
                  onValueChange={() => toggleTierAccess(material.id)}
                  trackColor={{ false: '#ccc', true: ADMIN_BRAND.accent }}
                  thumbColor="#fff"
                />
              )}
            </View>

            {material.assetPath ? (
              <Text style={styles.assetPath}>{material.assetPath}</Text>
            ) : null}
          </View>
        );
      })}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Internal training only. Real uploads will persist to Supabase Storage and cble_materials table.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: ADMIN_BRAND.textSecondary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
    marginBottom: 10,
  },
  materialCard: {
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
    flex: 1,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftText: {
    fontSize: 10,
    fontWeight: '700',
    color: ADMIN_BRAND.warning,
  },
  materialMeta: {
    fontSize: 11,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 4,
  },
  materialDesc: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 6,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ADMIN_BRAND.textSecondary,
  },
  tierValue: {
    fontSize: 12,
    color: ADMIN_BRAND.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  assetPath: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    fontFamily: 'monospace',
  },
  note: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  noteText: {
    fontSize: 11,
    color: ADMIN_BRAND.textSecondary,
    textAlign: 'center',
  },
});