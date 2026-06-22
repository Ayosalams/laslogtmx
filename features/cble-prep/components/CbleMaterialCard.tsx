import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { CBLE_DISCLAIMER_SHORT } from '../constants';
import type { CbleMaterial } from '../types';

const TYPE_ICONS: Record<CbleMaterial['type'], string> = {
  podcast: '🎧',
  video: '▶️',
  pdf: '📄',
  quiz: '✓',
};

interface Props {
  material: CbleMaterial;
  locked?: boolean;
  onPress?: (material: CbleMaterial) => void;
}

export const CbleMaterialCard: React.FC<Props> = ({ material, locked = false, onPress }) => {
  const { isMilitaryTime } = useSettings();
  const updatedTime = formatMessageTime(material.updatedAt, isMilitaryTime);

  const handlePress = () => {
    if (!locked && onPress) onPress(material);
  };

  return (
    <TouchableOpacity
      style={[styles.card, locked && styles.cardLocked]}
      onPress={handlePress}
      activeOpacity={locked ? 1 : 0.85}
      disabled={locked}
    >
      <View style={styles.headerRow}>
        <Text style={styles.typeIcon}>{TYPE_ICONS[material.type]}</Text>
        <View style={styles.headerContent}>
          <Text style={[styles.title, locked && styles.titleLocked]}>{material.title}</Text>
          <Text style={styles.meta}>
            {material.type.toUpperCase()}
            {material.durationMinutes ? ` • ${material.durationMinutes} min` : ''}
            {' • Updated '}
            {updatedTime}
          </Text>
        </View>
        {locked && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {material.description}
      </Text>

      <Text style={styles.disclaimer}>{CBLE_DISCLAIMER_SHORT}</Text>

      {material.assetPath && (
        <Text style={styles.assetHint} numberOfLines={1}>
          {/* TODO: Load from Supabase Storage when real assets are uploaded */}
          Asset: {material.assetPath}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardLocked: {
    opacity: 0.65,
    backgroundColor: '#F8FAFC',
    borderColor: '#00BFFF', // Electric Blue for restricted content
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  typeIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  titleLocked: {
    color: '#64748B',
  },
  meta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 8,
    fontStyle: 'italic',
  },
  assetHint: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  lockBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  lockText: {
    fontSize: 14,
  },
});