'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { DEFAULT_ENABLED_TYPES } from './constants';
import { NotificationSettings, NotificationType, PreferredRoute } from './types';

function parseRoutes(raw: unknown): PreferredRoute[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is PreferredRoute => {
      if (!r || typeof r !== 'object') return false;
      const row = r as Record<string, unknown>;
      return typeof row.origin === 'string' && typeof row.destination === 'string';
    })
    .map((r) => ({
      origin: r.origin.trim(),
      destination: r.destination.trim(),
    }))
    .filter((r) => r.origin && r.destination);
}

function parseSettings(row: Record<string, unknown> | null): NotificationSettings | null {
  if (!row) return null;
  const enabled = (row.enabled_types as Record<string, boolean>) ?? {};
  return {
    user_id: row.user_id as string,
    company_id: (row.company_id as string) ?? null,
    preferred_cities: (row.preferred_cities as string[]) ?? [],
    preferred_routes: parseRoutes(row.preferred_routes),
    min_rate_cents: (row.min_rate_cents as number) ?? null,
    rate_alert_enabled: row.rate_alert_enabled === true,
    external_loads_enabled: row.external_loads_enabled === true,
    enabled_types: {
      load_match: enabled.load_match ?? DEFAULT_ENABLED_TYPES.load_match,
      chat_message: enabled.chat_message ?? DEFAULT_ENABLED_TYPES.chat_message,
      load_status: enabled.load_status ?? DEFAULT_ENABLED_TYPES.load_status,
      motus_update: enabled.motus_update ?? DEFAULT_ENABLED_TYPES.motus_update,
      cble_material: enabled.cble_material ?? DEFAULT_ENABLED_TYPES.cble_material,
    },
    quiet_hours_start: (row.quiet_hours_start as string) ?? null,
    quiet_hours_end: (row.quiet_hours_end as string) ?? null,
    push_enabled: row.push_enabled !== false,
  };
}

export function useNotificationSettings(userId?: string, companyId?: string | null) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(parseSettings(data));
    } else if (companyId) {
      setSettings({
        user_id: userId,
        company_id: companyId,
        preferred_cities: [],
        preferred_routes: [],
        min_rate_cents: null,
        rate_alert_enabled: false,
        external_loads_enabled: false,
        enabled_types: { ...DEFAULT_ENABLED_TYPES },
        quiet_hours_start: null,
        quiet_hours_end: null,
        push_enabled: true,
      });
    } else {
      setSettings(null);
    }

    setLoading(false);
  }, [userId, companyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (patch: Partial<NotificationSettings>) => {
      if (!userId || !companyId) {
        return { error: new Error('Company membership required') };
      }

      setSaving(true);
      setError(null);

      const merged: NotificationSettings = {
        user_id: userId,
        company_id: companyId,
        preferred_cities: patch.preferred_cities ?? settings?.preferred_cities ?? [],
        preferred_routes: patch.preferred_routes ?? settings?.preferred_routes ?? [],
        min_rate_cents: patch.min_rate_cents ?? settings?.min_rate_cents ?? null,
        rate_alert_enabled: patch.rate_alert_enabled ?? settings?.rate_alert_enabled ?? false,
        external_loads_enabled:
          patch.external_loads_enabled ?? settings?.external_loads_enabled ?? false,
        enabled_types: patch.enabled_types ?? settings?.enabled_types ?? { ...DEFAULT_ENABLED_TYPES },
        quiet_hours_start: patch.quiet_hours_start ?? settings?.quiet_hours_start ?? null,
        quiet_hours_end: patch.quiet_hours_end ?? settings?.quiet_hours_end ?? null,
        push_enabled: patch.push_enabled ?? settings?.push_enabled ?? true,
      };

      const { error: upsertError } = await supabase.from('notification_settings').upsert(
        {
          user_id: merged.user_id,
          company_id: merged.company_id,
          preferred_cities: merged.preferred_cities,
          preferred_routes: merged.preferred_routes,
          min_rate_cents: merged.min_rate_cents,
          rate_alert_enabled: merged.rate_alert_enabled,
          external_loads_enabled: merged.external_loads_enabled,
          enabled_types: merged.enabled_types,
          quiet_hours_start: merged.quiet_hours_start,
          quiet_hours_end: merged.quiet_hours_end,
          push_enabled: merged.push_enabled,
        },
        { onConflict: 'user_id' }
      );

      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return { error: upsertError };
      }

      setSettings(merged);
      setSaving(false);
      return { error: null };
    },
    [userId, companyId, settings]
  );

  const toggleType = useCallback(
    async (type: NotificationType) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      const next = {
        ...settings.enabled_types,
        [type]: !settings.enabled_types[type],
      };
      return saveSettings({ enabled_types: next });
    },
    [settings, saveSettings]
  );

  const addCity = useCallback(
    async (city: string) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      const trimmed = city.trim();
      if (!trimmed) return { error: new Error('City name required') };
      if (settings.preferred_cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return { error: new Error('City already added') };
      }
      return saveSettings({
        preferred_cities: [...settings.preferred_cities, trimmed],
      });
    },
    [settings, saveSettings]
  );

  const removeCity = useCallback(
    async (city: string) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      return saveSettings({
        preferred_cities: settings.preferred_cities.filter(
          (c) => c.toLowerCase() !== city.toLowerCase()
        ),
      });
    },
    [settings, saveSettings]
  );

  const addRoute = useCallback(
    async (origin: string, destination: string) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      const o = origin.trim();
      const d = destination.trim();
      if (!o || !d) return { error: new Error('Origin and destination required') };
      const exists = settings.preferred_routes.some(
        (r) => r.origin.toLowerCase() === o.toLowerCase() && r.destination.toLowerCase() === d.toLowerCase()
      );
      if (exists) return { error: new Error('Route already added') };
      return saveSettings({
        preferred_routes: [...settings.preferred_routes, { origin: o, destination: d }],
      });
    },
    [settings, saveSettings]
  );

  const removeRoute = useCallback(
    async (origin: string, destination: string) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      return saveSettings({
        preferred_routes: settings.preferred_routes.filter(
          (r) =>
            !(
              r.origin.toLowerCase() === origin.toLowerCase() &&
              r.destination.toLowerCase() === destination.toLowerCase()
            )
        ),
      });
    },
    [settings, saveSettings]
  );

  const setMinRate = useCallback(
    async (rateDollars: string) => {
      if (!settings) return { error: new Error('Settings not loaded') };
      const trimmed = rateDollars.trim();
      if (!trimmed) {
        return saveSettings({ min_rate_cents: null });
      }
      const dollars = parseFloat(trimmed.replace(/[$,]/g, ''));
      if (Number.isNaN(dollars) || dollars <= 0) {
        return { error: new Error('Enter a valid rate amount') };
      }
      return saveSettings({ min_rate_cents: Math.round(dollars * 100) });
    },
    [settings, saveSettings]
  );

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    toggleType,
    addCity,
    removeCity,
    addRoute,
    removeRoute,
    setMinRate,
    refresh: fetchSettings,
  };
}