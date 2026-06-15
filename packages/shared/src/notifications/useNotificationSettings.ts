'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { DEFAULT_ENABLED_TYPES } from './constants';
import { NotificationSettings, NotificationType } from './types';

function parseSettings(row: Record<string, unknown> | null): NotificationSettings | null {
  if (!row) return null;
  const enabled = (row.enabled_types as Record<string, boolean>) ?? {};
  return {
    user_id: row.user_id as string,
    company_id: (row.company_id as string) ?? null,
    preferred_cities: (row.preferred_cities as string[]) ?? [],
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

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    toggleType,
    addCity,
    removeCity,
    refresh: fetchSettings,
  };
}