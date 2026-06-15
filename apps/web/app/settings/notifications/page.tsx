'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../../../packages/shared/src/auth/AuthContext';
import { useNotificationSettings } from '../../../../../packages/shared/src/notifications/useNotificationSettings';
import { usePushRegistration } from '../../../../../packages/shared/src/notifications/usePushRegistration';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
  SUGGESTED_CITIES,
} from '../../../../../packages/shared/src/notifications/constants';
import { NotificationType } from '../../../../../packages/shared/src/notifications/types';
import { registerWebPush } from '../../../lib/webPush';
import { NotificationInboxWeb } from '../../../../../features/notifications/components/NotificationInboxWeb';

const NOTIFICATION_TYPES: NotificationType[] = [
  'load_match',
  'chat_message',
  'load_status',
  'motus_update',
  'cble_material',
];

export default function NotificationSettingsPage() {
  const { user, profile, company } = useAuth();
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
    const sub = await registerWebPush();
    if (sub) {
      await registerPush({
        platform: 'web',
        token: sub.endpoint,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth_key: sub.auth_key,
        device_label: 'web',
      });
      await saveSettings({ push_enabled: true });
      setStatusMessage('Web push notifications enabled.');
    } else {
      setStatusMessage('Could not enable web push. Check browser permissions and VAPID config.');
    }
  };

  if (!profile?.company_id) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl border border-gray-100">
        <Link href="/settings" className="text-gray-500 hover:text-gray-800 text-sm">
          ← Back to Settings
        </Link>
        <h1 className="text-2xl font-bold mt-4">Notifications</h1>
        <p className="text-gray-600 mt-2">
          Join or create a company to configure notification preferences.
        </p>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="max-w-2xl mx-auto mt-8 text-center text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-500 hover:text-gray-800">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {company && (
        <p className="text-sm text-gray-500">
          {company.name} • Company-isolated alerts
        </p>
      )}

      {(error || statusMessage) && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
          {error ?? statusMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
        <NotificationInboxWeb userId={user?.id} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold">Push Notifications</h2>
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="font-medium">Enable web push</p>
            <p className="text-sm text-gray-500">Browser alerts when permitted.</p>
          </div>
          <button
            type="button"
            onClick={() => (settings.push_enabled ? saveSettings({ push_enabled: false }) : handleEnablePush())}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.push_enabled ? 'bg-[#00bfff]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.push_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Alert Types</h2>
        <div className="divide-y divide-gray-100">
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type} className="py-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-medium">{NOTIFICATION_TYPE_LABELS[type]}</p>
                <p className="text-sm text-gray-500">{NOTIFICATION_TYPE_DESCRIPTIONS[type]}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleType(type)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  settings.enabled_types[type] ? 'bg-[#00bfff]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enabled_types[type] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold">Preferred Cities</h2>
        <p className="text-sm text-gray-500 mt-1">
          Load match alerts when origin or destination matches a city you add.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Add city (e.g. Chicago)"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00bfff]"
          />
          <button
            type="button"
            onClick={handleAddCity}
            disabled={saving}
            className="px-4 py-2 bg-[#00bfff] text-white font-semibold rounded-xl hover:opacity-90"
          >
            Add
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => addCity(city)}
              className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
            >
              + {city}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {settings.preferred_cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => removeCity(city)}
              className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
            >
              {city} ×
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold">Quiet Hours</h2>
        <p className="text-sm text-gray-500 mt-1">
          Suppress non-urgent notifications during these hours (24h format).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Start</label>
            <input
              type="text"
              placeholder="22:00"
              value={settings.quiet_hours_start ?? ''}
              onChange={(e) => saveSettings({ quiet_hours_start: e.target.value || null })}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">End</label>
            <input
              type="text"
              placeholder="07:00"
              value={settings.quiet_hours_end ?? ''}
              onChange={(e) => saveSettings({ quiet_hours_end: e.target.value || null })}
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}