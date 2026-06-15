"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { APP_CONFIG, FEATURES, STORAGE_KEYS } from "../constants";

export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface SettingsContextType {
  isMilitaryTime: boolean;
  toggleMilitaryTime: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Safe default storage for web (localStorage). Mobile should inject AsyncStorage adapter.
const defaultWebStorage: Storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
};

export const SettingsProvider: React.FC<{
  children: React.ReactNode;
  storage?: Storage;
}> = ({ children, storage }) => {
  const effectiveStorage = storage || defaultWebStorage;

  // Check if there is a default set in the app config or features
  const defaultIsMilitary = FEATURES.militaryTimeDefault ?? (APP_CONFIG.defaultTimeFormat === "military");

  const [isMilitaryTime, setIsMilitaryTime] = useState<boolean>(defaultIsMilitary);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted value (async)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const saved = await effectiveStorage.getItem(STORAGE_KEYS.militaryTime);
        if (mounted && saved !== null) {
          setIsMilitaryTime(saved === "true");
        }
      } catch {
        // ignore storage errors, fall back to default
      } finally {
        if (mounted) setHydrated(true);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [effectiveStorage]);

  const toggleMilitaryTime = () => {
    setIsMilitaryTime((prev) => {
      const next = !prev;
      // Persist (fire and forget)
      effectiveStorage.setItem(STORAGE_KEYS.militaryTime, String(next)).catch(() => {
        // ignore write errors
      });
      return next;
    });
  };

  // While hydrating we still render with default to avoid flash; consumers see correct value quickly
  return (
    <SettingsContext.Provider value={{ isMilitaryTime, toggleMilitaryTime }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
