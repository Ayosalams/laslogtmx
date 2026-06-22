'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMilitaryClock } from '../../../packages/shared/src/hooks/useMilitaryClock';
import { SUGGESTED_CITIES, SUGGESTED_ROUTES } from '../../../packages/shared/src/notifications/constants';
import { useLoadMatchPreferences } from '../hooks/useLoadMatchPreferences';
import { formatRateCents } from '../utils/formatRate';

export function LoadMatchSettingsWeb() {
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

  const handleSaveMinRate = async () => {
    const result = await setMinRate(minRateInput);
    if (result.error) setMessage(result.error.message);
    else setMessage(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Smart Load Matching</h2>
        <span className="text-xs font-semibold tabular-nums bg-sky-50 text-[#00bfff] px-3 py-1 rounded-full">
          {militaryTime}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Get real-time alerts when internal board or external loads match your lanes and rate targets.
        <Link href="/load-board" className="ml-1 text-[#00bfff] hover:underline">
          View Load Board →
        </Link>
      </p>

      {message && (
        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Preferred Cities</h3>
          <p className="text-sm text-gray-500 mt-1">Alert when origin or destination contains a city.</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Chicago"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00bfff]"
            />
            <button
              type="button"
              onClick={handleAddCity}
              disabled={saving}
              className="px-4 py-2 bg-[#00bfff] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
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
          <div className="mt-2 flex flex-wrap gap-2">
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
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Preferred Routes</h3>
          <p className="text-sm text-gray-500 mt-1">Alert when both origin and destination match a lane.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={routeOrigin}
              onChange={(e) => setRouteOrigin(e.target.value)}
              placeholder="Origin"
              className="px-4 py-2 border border-gray-200 rounded-xl"
            />
            <input
              type="text"
              value={routeDest}
              onChange={(e) => setRouteDest(e.target.value)}
              placeholder="Destination"
              className="px-4 py-2 border border-gray-200 rounded-xl"
            />
          </div>
          <button
            type="button"
            onClick={handleAddRoute}
            disabled={saving}
            className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            Add Route
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_ROUTES.map((route) => (
              <button
                key={`${route.origin}-${route.destination}`}
                type="button"
                onClick={() => addRoute(route.origin, route.destination)}
                className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
              >
                + {route.origin} → {route.destination}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.preferred_routes.map((route) => (
              <button
                key={`${route.origin}-${route.destination}`}
                type="button"
                onClick={() => removeRoute(route.origin, route.destination)}
                className="text-sm px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full hover:bg-emerald-100"
              >
                {route.origin} → {route.destination} ×
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">Rate Alert</h3>
          <p className="text-sm text-gray-500 mt-1">
            Notify when posted rate meets or exceeds your minimum threshold.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-medium text-sm">Enable rate alerts</span>
            <button
              type="button"
              onClick={() =>
                saveSettings({ rate_alert_enabled: !settings.rate_alert_enabled })
              }
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.rate_alert_enabled ? 'bg-[#00bfff]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.rate_alert_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {settings.rate_alert_enabled && (
            <div className="mt-3 flex gap-2 items-end">
              <label className="flex-1 block">
                <span className="text-xs text-gray-500">Minimum rate (USD)</span>
                <input
                  type="text"
                  placeholder="2500"
                  defaultValue={
                    settings.min_rate_cents != null
                      ? String(settings.min_rate_cents / 100)
                      : minRateInput
                  }
                  onChange={(e) => setMinRateInput(e.target.value)}
                  onBlur={handleSaveMinRate}
                  className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl"
                />
              </label>
              {settings.min_rate_cents != null && (
                <span className="text-sm text-gray-500 pb-2">
                  Current: {formatRateCents(settings.min_rate_cents)}
                </span>
              )}
            </div>
          )}
        </section>

        <section className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                External Loads (Make.com)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Placeholder — receive alerts from external load feeds via Make.com integration.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                saveSettings({ external_loads_enabled: !settings.external_loads_enabled })
              }
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                settings.external_loads_enabled ? 'bg-[#00bfff]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.external_loads_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}