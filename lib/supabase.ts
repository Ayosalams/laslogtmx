import { createClient } from '@supabase/supabase-js';

/**
 * SERVER / CLIENT SEPARATION (OpenNext + Cloudflare)
 * --------------------------------------------------
 * - Browser bundles: NEXT_PUBLIC_* values are inlined at **build time**. Set them
 *   in Cloudflare Pages → Settings → Environment variables before deploying.
 * - Server / edge (OpenNext worker): reads the same vars at **request runtime**
 *   from the Cloudflare Workers environment — not from the build machine's disk.
 * - Do NOT import SUPABASE_SERVICE_ROLE_KEY here. API routes create their own
 *   server-side clients with the service role key.
 * - This singleton is imported during SSR and SSG. Auth persistence is disabled
 *   when config is missing or during static generation to avoid window/localStorage
 *   access on the server.
 */

const BUILD_PHASE = 'phase-production-build';

/** Valid-format placeholders used only when env is missing during SSG/build. */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciJ9.placeholder';

const CLOUDFLARE_DEPLOY_NOTE =
  'Cloudflare Pages (laslogtmx-app): Workers & Pages → laslogtmx-app → Settings → ' +
  'Environment variables → add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
  '(Production + Preview). Save, then redeploy — NEXT_PUBLIC_* values are baked into ' +
  'client bundles at build time.';

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

function isPlaceholderValue(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your-') ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('project-ref') ||
    value === PLACEHOLDER_URL ||
    value === PLACEHOLDER_KEY
  );
}

function isBuildOrStaticGeneration(): boolean {
  return process.env.NEXT_PHASE === BUILD_PHASE;
}

function isServerRuntime(): boolean {
  return typeof window === 'undefined';
}

function warnMissingConfig(context: 'build' | 'runtime'): void {
  const prefix =
    context === 'build'
      ? '[supabase] Build proceeding without real Supabase config (SSG-safe placeholders).'
      : '[supabase] Missing or placeholder Supabase config.';
  console.warn(
    `${prefix} ${CLOUDFLARE_DEPLOY_NOTE} ` +
      'Local dev: copy .env.example → .env.local and fill in real values. Do NOT hardcode secrets.',
  );
}

const rawSupabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');

const rawSupabaseKey = readEnv(
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
);

const configMissing =
  !rawSupabaseUrl ||
  !rawSupabaseKey ||
  isPlaceholderValue(rawSupabaseUrl) ||
  isPlaceholderValue(rawSupabaseKey);

function resolveSupabaseConfig(): { url: string; key: string; degraded: boolean } {
  if (!configMissing) {
    return { url: rawSupabaseUrl, key: rawSupabaseKey, degraded: false };
  }

  // Graceful degradation: never throw during SSG / production build.
  if (isBuildOrStaticGeneration()) {
    warnMissingConfig('build');
    return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY, degraded: true };
  }

  if (isServerRuntime()) {
    return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY, degraded: true };
  }

  warnMissingConfig('runtime');
  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY, degraded: true };
}

const { url: supabaseUrl, key: supabaseKey, degraded: isDegradedConfig } = resolveSupabaseConfig();

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
} catch {
  // AsyncStorage not available (web or not installed) - use Supabase default
  authStorage = undefined;
}

const authEnabled = !isDegradedConfig && !isBuildOrStaticGeneration();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: authEnabled,
    autoRefreshToken: authEnabled,
    detectSessionInUrl: authEnabled,
    ...(authStorage && authEnabled && { storage: authStorage }),
  },
});

// Helper to get the client (useful for future DI or testing)
export function createSupabaseClient() {
  return supabase;
}

// Note for Mobile: Add at top of App.tsx or index:
// import 'react-native-url-polyfill/auto';