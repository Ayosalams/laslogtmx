import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { AdminGuard } from '../components/AdminGuard';
import { AdminTabBar } from '../components/AdminTabBar';
import { SupportTicketsPanel } from '../components/SupportTicketsPanel';
import { CbleContentPanel } from '../components/CbleContentPanel';
import { UserManagementPanel } from '../components/UserManagementPanel';
import { ADMIN_BRAND } from '../constants';
import type { AdminTabId } from '../types';

function AdminDashboardContent() {
  const currentTime = useCurrentTime();
  const [activeTab, setActiveTab] = useState<AdminTabId>('tickets');

  const renderPanel = () => {
    switch (activeTab) {
      case 'tickets':
        return <SupportTicketsPanel />;
      case 'cble':
        return <CbleContentPanel />;
      case 'users':
        return <UserManagementPanel />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>laslogTMX Operations</Text>
        </View>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      <AdminTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.panel}>{renderPanel()}</View>
    </SafeAreaView>
  );
}

export const AdminDashboardScreen: React.FC = () => {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_BRAND.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: ADMIN_BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_BRAND.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_BRAND.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 2,
  },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_BRAND.accent,
  },
  panel: {
    flex: 1,
  },
});