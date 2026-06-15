import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { useNotificationSettings } from '../../../packages/shared/src/notifications/useNotificationSettings';
import { usePushRegistration } from '../../../packages/shared/src/notifications/usePushRegistration';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
  SUGGESTED_CITIES,
} from '../../../packages/shared/src/notifications/constants';
import { NotificationType } from '../../../packages/shared/src/notifications/types';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { NotificationInbox } from '../components/NotificationInbox';

const NOTIFICATION_TYPES: NotificationType[] = [
  'load_match',
  'chat_message',
  'load_status',
  'motus_update',
  'cble_material',
];

interface Props {
  onRegisterPush?: () => Promise<string | null>;
}

export const NotificationSettingsScreen: React.FC<Props> = ({ onRegisterPush }) => {
  const { user, profile, company } = useAuth();
  const currentTime = useCurrentTime();
  const {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    toggleType,
    addCity,
    removeCity,
  } = useNotificationSettings(user?.id, profile?.company_id);
  const { registerPush } = usePushRegistration(user?.id, profile?.company_id);
  const [cityInput, setCityInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleAddCity = async () => {
    const result = await addCity(cityInput);
    if (!result.error) {
      setCityInput('');
      setStatusMessage(null);
    } else {
      setStatusMessage(result.error.message);
    }
  };

  const handleEnablePush = async () => {
    if (!onRegisterPush) {
      setStatusMessage('Push registration is not available on this platform.');
      return;
    }
    const token = await onRegisterPush();
    if (token) {
      await registerPush({
        platform: 'expo',
        token,
        device_label: Platform.OS,
      });
      await saveSettings({ push_enabled: true });
      setStatusMessage('Push notifications enabled.');
    } else {
      setStatusMessage('Could not obtain push token. Check device permissions.');
    }
  };

  if (!profile?.company_id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Company Required</Text>
        <Text style={styles.emptyText}>
          Notification settings are available after you join or create a company.
        </Text>
      </View>
    );
  }

  if (loading || !settings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      {company && (
        <Text style={styles.companyLabel}>{company.name} • Company-isolated alerts</Text>
      )}

      {(error || statusMessage) && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error ?? statusMessage}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <NotificationInbox userId={user?.id} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Enable push alerts</Text>
            <Text style={styles.help}>Receive alerts on this device when permitted.</Text>
          </View>
          <Switch
            value={settings.push_enabled}
            onValueChange={async (val) => {
              if (val && onRegisterPush) {
                await handleEnablePush();
              } else {
                await saveSettings({ push_enabled: val });
              }
            }}
            trackColor={{ false: '#ccc', true: '#1E40AF' }}
            thumbColor="#fff"
            disabled={saving}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>
        {NOTIFICATION_TYPES.map((type) => (
          <View key={type} style={styles.typeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{NOTIFICATION_TYPE_LABELS[type]}</Text>
              <Text style={styles.help}>{NOTIFICATION_TYPE_DESCRIPTIONS[type]}</Text>
            </View>
            <Switch
              value={settings.enabled_types[type]}
              onValueChange={() => {
                void toggleType(type);
              }}
              trackColor={{ false: '#ccc', true: '#1E40AF' }}
              thumbColor="#fff"
              disabled={saving}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Cities</Text>
        <Text style={styles.help}>
          Load match alerts fire when origin or destination matches a city you add.
        </Text>

        <View style={styles.cityInputRow}>
          <TextInput
            style={styles.cityInput}
            placeholder="Add city (e.g. Chicago)"
            value={cityInput}
            onChangeText={setCityInput}
            autoCapitalize="words"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddCity} disabled={saving}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chipRow}>
          {SUGGESTED_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.suggestChip}
              onPress={() => addCity(city)}
              disabled={saving}
            >
              <Text style={styles.suggestChipText}>+ {city}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chipRow}>
          {settings.preferred_cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.cityChip}
              onPress={() => removeCity(city)}
              disabled={saving}
            >
              <Text style={styles.cityChipText}>{city} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Text style={styles.help}>
          Suppress non-urgent notifications during these hours (24h format, your local time).
        </Text>
        <View style={styles.quietRow}>
          <View style={styles.quietField}>
            <Text style={styles.quietLabel}>Start</Text>
            <TextInput
              style={styles.quietInput}
              placeholder="22:00"
              value={settings.quiet_hours_start ?? ''}
              onChangeText={(t) => saveSettings({ quiet_hours_start: t || null })}
            />
          </View>
          <View style={styles.quietField}>
            <Text style={styles.quietLabel}>End</Text>
            <TextInput
              style={styles.quietInput}
              placeholder="07:00"
              value={settings.quiet_hours_end ?? ''}
              onChangeText={(t) => saveSettings({ quiet_hours_end: t || null })}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  companyLabel: {
    fontSize: 13,
    color: '#64748B',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  banner: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
  },
  bannerText: { fontSize: 13, color: '#713f12' },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  help: { fontSize: 13, color: '#64748B', marginTop: 2 },
  cityInputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  suggestChipText: { fontSize: 12, color: '#475569' },
  cityChip: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cityChipText: { fontSize: 13, color: '#1E40AF', fontWeight: '500' },
  quietRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  quietField: { flex: 1 },
  quietLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  quietInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
});