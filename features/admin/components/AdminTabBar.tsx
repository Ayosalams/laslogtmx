import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ADMIN_BRAND, ADMIN_TABS } from '../constants';
import type { AdminTabId } from '../types';

interface Props {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
}

export const AdminTabBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      {ADMIN_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: ADMIN_BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BRAND.border,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: ADMIN_BRAND.accent,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: ADMIN_BRAND.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: ADMIN_BRAND.accent,
    fontWeight: '700',
  },
});