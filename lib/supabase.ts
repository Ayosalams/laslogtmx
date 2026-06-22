import { createClient } from '@supabase/supabase-js';

// Supports both Next.js (NEXT_PUBLIC_*) and Expo (EXPO_PUBLIC_*) conventions.
// Falls back to the project's example values from .env.example (public anon key is safe for client-side).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or EXPO_*) in .env.local. Do NOT hardcode values.');
}

// Cross-platform auth storage setup
// For mobile/Expo: uses AsyncStorage for session persistence
// For web/Next.js: uses default (localStorage/cookies via browser)
let authStorage: any = undefined;

try {
  // Dynamic import to avoid breaking web bundle
  // In mobile entry (App.tsx), also ensure: import 'react-native-url-polyfill/auto';
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (AsyncStorage) {
    authStorage = AsyncStorage;
  }
} catch (e) {
  // AsyncStorage not available (web or not installed) - use Supabase default
  authStorage = undefined;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(authStorage && { storage: authStorage }),
  },
});

// Helper to get the client (useful for future DI or testing)
export function createSupabaseClient() {
  return supabase;
}

// Note for Mobile: Add at top of App.tsx or index:
// import 'react-native-url-polyfill/auto';
