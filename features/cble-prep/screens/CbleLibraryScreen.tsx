import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { CBLE_INCLUDED_VALUE } from '../../../packages/shared/src/constants/subscription';
import { CbleDisclaimerBanner } from '../components/CbleDisclaimerBanner';
import { CbleMaterialCard } from '../components/CbleMaterialCard';
import { CBLE_CATEGORIES, CBLE_PLACEHOLDER_MATERIALS } from '../constants';
import { canAccessMaterial, useCbleAccess } from '../hooks/useCbleAccess';
import type { CbleCategoryId, CbleMaterial } from '../types';

interface Props {
  navigation?: { navigate?: (screen: string) => void };
}

export const CbleLibraryScreen: React.FC<Props> = () => {
  const currentTime = useCurrentTime();
  const access = useCbleAccess();
  const [selectedCategory, setSelectedCategory] = useState<CbleCategoryId | 'all'>('all');

  const filteredMaterials = useMemo(() => {
    if (selectedCategory === 'all') return CBLE_PLACEHOLDER_MATERIALS;
    return CBLE_PLACEHOLDER_MATERIALS.filter((m) => m.categoryId === selectedCategory);
  }, [selectedCategory]);

  const handleMaterialPress = (material: CbleMaterial) => {
    // TODO: Navigate to material detail player/viewer screen
    // TODO: Stream podcast/video from Supabase Storage or CDN
    // TODO: Open PDF in in-app viewer with watermark disclaimer
    Alert.alert(
      material.title,
      `${material.type.toUpperCase()} — placeholder content.\n\n` +
        `Asset: ${material.assetPath ?? 'TBD'}\n\n` +
        'Internal training only. Not official CBLE material.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CBLE Prep</Text>
            <Text style={styles.subtitle}>Customs Broker License Exam — Internal Library</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <CbleDisclaimerBanner showPronunciation />

        {access.isLocked ? (
          <View style={styles.gateCard}>
            <Text style={styles.gateTitle}>Pro Broker Required</Text>
            <Text style={styles.gateBody}>
              CBLE Prep is included with Pro Broker and Enterprise plans.
              Annual Pro Broker subscribers receive the full library (${CBLE_INCLUDED_VALUE} value included free).
            </Text>
            <Text style={styles.gateMeta}>{access.upgradeMessage}</Text>
          </View>
        ) : (
          <View style={styles.accessCard}>
            <Text style={styles.accessLabel}>Your Access</Text>
            <Text style={styles.accessValue}>{access.accessSummary}</Text>
            {access.hasPreviewAccess && (
              <Text style={styles.accessHint}>
                Preview materials are unlocked. Upgrade to annual billing for the complete library.
              </Text>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {CBLE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.icon} {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedCategory !== 'all' && (
          <Text style={styles.categoryDesc}>
            {CBLE_CATEGORIES.find((c) => c.id === selectedCategory)?.description}
          </Text>
        )}

        <Text style={styles.sectionTitle}>Materials</Text>
        {filteredMaterials.map((material) => {
          const unlocked = canAccessMaterial(material.requiresFullAccess, access);
          return (
            <CbleMaterialCard
              key={material.id}
              material={material}
              locked={!unlocked}
              onPress={handleMaterialPress}
            />
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Placeholder content. Real assets under features/cble-prep/assets/ (audio, videos, pdfs, practice-tests, etc.). Upload to Supabase Storage for prod.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  timePill: {
    backgroundColor: '#E0F2FE', // light electric blue tint
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00BFFF', // Electric Blue per lasbrandSKILL.md
  },
  gateCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00BFFF', // Electric Blue border for restricted per cble-prepSKILL
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  gateBody: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 19,
  },
  gateMeta: {
    fontSize: 12,
    color: '#00BFFF', // Electric Blue accent per lasbrand
    marginTop: 10,
    fontWeight: '500',
  },
  accessCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  accessLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  accessValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginTop: 4,
  },
  accessHint: {
    fontSize: 12,
    color: '#059669',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 4,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#00BFFF', // Electric Blue accent
    borderColor: '#00BFFF',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});