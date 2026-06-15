import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useSettings } from '../../../../packages/shared/src/context/SettingsContext';
import { useCurrentTime } from '../../../../packages/shared/src/hooks/useCurrentTime';

// Import the tab screens
import { ChatListScreen } from '../../../../features/chat/screens/ChatListScreen';
import { MotusMainScreen } from '../../../../features/motus-helper/screens/MotusMainScreen';
import { CbleLibraryScreen } from '../../../../features/cble-prep/screens/CbleLibraryScreen';
import { useAuth } from '../../../../packages/shared/src/auth/AuthContext';
import { useCbleAccess } from '../../../../features/cble-prep/hooks/useCbleAccess';
import { getTierLabel } from '../../../../packages/shared/src/constants/subscription';

import { NotificationSettingsScreen } from '../../../../features/notifications/screens/NotificationSettingsScreen';
import { LoadBookingPanel } from '../../../../features/loads/components/LoadBookingPanel';
import { ExpenseListScreen } from '../../../../features/expenses/screens/ExpenseListScreen';
import { registerForExpoPush } from '../lib/mobilePush';
import { AdminDashboardScreen } from '../../../../features/admin/screens/AdminDashboardScreen';
import { useAdminAccess } from '../../../../features/admin/hooks/useAdminAccess';

// Simple Settings screen extracted from previous demo
function SettingsScreen({ navigation }: { navigation?: { navigate: (name: string) => void } }) {
  const { isMilitaryTime, toggleMilitaryTime } = useSettings();
  const { profile, company } = useAuth();
  const cbleAccess = useCbleAccess();
  const currentTime = useCurrentTime();
  const tierLabel = getTierLabel(company?.subscription_tier);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.profileName}>{profile.full_name ?? 'User'}</Text>
          <Text style={styles.profileMeta}>
            {profile.role}{company ? ` • ${company.name}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription & Access</Text>
        <View style={styles.accessRow}>
          <Text style={styles.label}>Plan Tier</Text>
          <Text style={styles.accessValue}>{company ? tierLabel : '—'}</Text>
        </View>
        {company?.billing_interval && (
          <Text style={styles.help}>
            {company.billing_interval === 'yearly' ? 'Annual' : 'Monthly'} billing
          </Text>
        )}
        <View style={[styles.accessRow, { marginTop: 10 }]}>
          <Text style={styles.label}>CBLE Prep</Text>
          <Text
            style={[
              styles.accessValue,
              cbleAccess.hasFullAccess && styles.accessFull,
              cbleAccess.hasPreviewAccess && styles.accessPreview,
              cbleAccess.isLocked && styles.accessLocked,
            ]}
          >
            {cbleAccess.hasFullAccess
              ? 'Full Library'
              : cbleAccess.hasPreviewAccess
                ? 'Preview'
                : 'Not Available'}
          </Text>
        </View>
        <Text style={styles.help}>{cbleAccess.accessSummary}</Text>
      </View>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => navigation?.navigate('NotificationSettings')}
      >
        <Text style={styles.linkLabel}>Notification Settings</Text>
        <Text style={styles.linkChevron}>›</Text>
      </TouchableOpacity>

      <LoadBookingPanel />

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Military Time Display</Text>
            <Text style={styles.help}>Use 24-hour time format across the application.</Text>
          </View>
          <Switch
            value={isMilitaryTime}
            onValueChange={toggleMilitaryTime}
            trackColor={{ false: '#ccc', true: '#1E40AF' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Current format: {isMilitaryTime ? '24-hour (military)' : '12-hour (standard)'}
          </Text>
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Timestamps in Chat, MOTUS, and CBLE Prep respect this setting.
        </Text>
      </View>
    </ScrollView>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { isAdmin } = useAdminAccess();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // We handle headers inside screens or via stack
        tabBarActiveTintColor: '#1E40AF', // Electric blue accent
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chat',
          // For icons, if @expo/vector-icons is available:
          // tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Expenses"
        options={{
          tabBarLabel: 'Expenses',
        }}
      >
        {(props) => <ExpenseListScreen navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="MOTUS"
        component={MotusMainScreen}
        options={{
          tabBarLabel: 'MOTUS',
          // tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CBLE"
        component={CbleLibraryScreen}
        options={{
          tabBarLabel: 'CBLE',
          // tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Admin',
          tabBarButton: isAdmin ? undefined : () => null,
          tabBarItemStyle: isAdmin ? undefined : { display: 'none', width: 0, height: 0 },
        }}
      />
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
        }}
      >
        {(props) => <SettingsScreen navigation={props.navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="NotificationSettings"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0 },
        }}
      >
        {() => <NotificationSettingsScreen onRegisterPush={registerForExpoPush} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
    color: '#1E40AF',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  profileMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  accessFull: {
    color: '#047857',
  },
  accessPreview: {
    color: '#B45309',
  },
  accessLocked: {
    color: '#94A3B8',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  help: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  note: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
  },
  noteText: {
    fontSize: 12,
    color: '#713f12',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkLabel: { fontSize: 15, fontWeight: '600', color: '#1E40AF' },
  linkChevron: { fontSize: 20, color: '#94A3B8' },
});