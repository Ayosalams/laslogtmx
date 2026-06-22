import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { SUGGESTED_CITIES, SUGGESTED_ROUTES } from '../../../packages/shared/src/notifications/constants';
import { useLoadMatchPreferences } from '../hooks/useLoadMatchPreferences';
import { formatRateCents } from '../utils/formatRate';

export const LoadMatchSettingsMobile: React.FC = () => {
  const militaryTime = useMilitaryClock();
  const {
    settings,
    saving,
    addCity,
    removeCity,
    addRoute,
    removeRoute,
    setMinRate,
    saveSettings,
  } = useLoadMatchPreferences();

  const [cityInput, setCityInput] = useState('');
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [minRateInput, setMinRateInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!settings) return null;

  const handleAddCity = async () => {
    const result = await addCity(cityInput);
    if (!result.error) {
      setCityInput('');
      setMessage(null);
    } else {
      setMessage(result.error.message);
    }
  };

  const handleAddRoute = async () => {
    const result = await addRoute(routeOrigin, routeDest);
    if (!result.error) {
      setRouteOrigin('');
      setRouteDest('');
      setMessage(null);
    } else {
      setMessage(result.error.message);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Smart Load Matching</Text>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{militaryTime}</Text>
        </View>
      </View>
      <Text style={styles.help}>
        Real-time alerts when internal board or external loads match your lanes and rate targets.
      </Text>

      {message && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{message}</Text>
        </View>
      )}

      <Text style={styles.subTitle}>Preferred Cities</Text>
      <View style={styles.cityInputRow}>
        <TextInput
          style={styles.cityInput}
          placeholder="Chicago"
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
          <TouchableOpacity key={city} style={styles.suggestChip} onPress={() => addCity(city)} disabled={saving}>
            <Text style={styles.suggestChipText}>+ {city}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chipRow}>
        {settings.preferred_cities.map((city) => (
          <TouchableOpacity key={city} style={styles.cityChip} onPress={() => removeCity(city)} disabled={saving}>
            <Text style={styles.cityChipText}>{city} ×</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subTitle}>Preferred Routes</Text>
      <View style={styles.routeRow}>
        <TextInput
          style={[styles.cityInput, { flex: 1 }]}
          placeholder="Origin"
          value={routeOrigin}
          onChangeText={setRouteOrigin}
        />
        <TextInput
          style={[styles.cityInput, { flex: 1 }]}
          placeholder="Destination"
          value={routeDest}
          onChangeText={setRouteDest}
        />
      </View>
      <TouchableOpacity style={styles.routeAddBtn} onPress={handleAddRoute} disabled={saving}>
        <Text style={styles.addButtonText}>Add Route</Text>
      </TouchableOpacity>
      <View style={styles.chipRow}>
        {SUGGESTED_ROUTES.map((route) => (
          <TouchableOpacity
            key={`${route.origin}-${route.destination}`}
            style={styles.suggestChip}
            onPress={() => addRoute(route.origin, route.destination)}
            disabled={saving}
          >
            <Text style={styles.suggestChipText}>
              + {route.origin} → {route.destination}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chipRow}>
        {settings.preferred_routes.map((route) => (
          <TouchableOpacity
            key={`${route.origin}-${route.destination}`}
            style={styles.routeChip}
            onPress={() => removeRoute(route.origin, route.destination)}
            disabled={saving}
          >
            <Text style={styles.routeChipText}>
              {route.origin} → {route.destination} ×
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subTitle}>Rate Alert</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Minimum rate threshold</Text>
          <Text style={styles.help}>Alert when rate meets or exceeds your minimum.</Text>
        </View>
        <Switch
          value={settings.rate_alert_enabled}
          onValueChange={(val) => {
            void saveSettings({ rate_alert_enabled: val });
          }}
          trackColor={{ false: '#ccc', true: '#1E40AF' }}
          thumbColor="#fff"
          disabled={saving}
        />
      </View>
      {settings.rate_alert_enabled && (
        <View style={styles.cityInputRow}>
          <TextInput
            style={styles.cityInput}
            placeholder="2500"
            value={minRateInput || (settings.min_rate_cents != null ? String(settings.min_rate_cents / 100) : '')}
            onChangeText={setMinRateInput}
            onBlur={() => setMinRate(minRateInput)}
            keyboardType="decimal-pad"
          />
          {settings.min_rate_cents != null && (
            <Text style={styles.rateLabel}>{formatRateCents(settings.min_rate_cents)}</Text>
          )}
        </View>
      )}

      <View style={[styles.row, { marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>External Loads (Make.com)</Text>
          <Text style={styles.help}>Placeholder for external load feed alerts.</Text>
        </View>
        <Switch
          value={settings.external_loads_enabled}
          onValueChange={(val) => {
            void saveSettings({ external_loads_enabled: val });
          }}
          trackColor={{ false: '#ccc', true: '#1E40AF' }}
          thumbColor="#fff"
          disabled={saving}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 8,
  },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: '#1E40AF', fontVariant: ['tabular-nums'] },
  help: { fontSize: 13, color: '#64748B', marginTop: 2 },
  banner: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  bannerText: { fontSize: 13, color: '#713f12' },
  cityInputRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  routeRow: { flexDirection: 'row', gap: 8 },
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
  routeAddBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
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
  routeChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  routeChipText: { fontSize: 12, color: '#065F46', fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  rateLabel: { fontSize: 13, color: '#64748B', paddingHorizontal: 8 },
});