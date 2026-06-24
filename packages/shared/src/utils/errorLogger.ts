/**
 * Shared lightweight Error Logger for laslogTMX (web + mobile)
 * - Sentry client-side error monitoring + tracking
 * - Best-effort integration with Supabase "Unified Logs" (insert to unified_logs table)
 *
 * Usage:
 *   import { captureException, initSentry } from '.../errorLogger';
 *   initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);
 *   captureException(err, { feature: 'load-board' });
 *
 * Keep lightweight: optional deps, no-ops if not configured.
 * Never log secrets.
 */

let sentryInitialized = false;
let Sentry: any = null;

export async function initSentry(dsn?: string) {
  if (!dsn || sentryInitialized) {
    return;
  }
  const isLikelyRN = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';
  try {
    if (isLikelyRN) {
      // Dynamic import for RN only - prevents web build from including RN native modules
      Sentry = await import(/* webpackIgnore: true */ '@sentry/react-native').catch(() => null);
    } else {
      // Web / Next client only
      Sentry = await import('@sentry/react').catch(async () => {
        try { return await import('@sentry/browser'); } catch { return null; }
      });
    }
    if (Sentry && (Sentry.init || (Sentry.default && Sentry.default.init))) {
      const S = Sentry.init ? Sentry : Sentry.default;
      S.init({
        dsn,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV || 'development',
        beforeSend(event: any) {
          if (event.request && event.request.url) {
            try {
              const u = new URL(event.request.url);
              u.search = '';
              event.request.url = u.toString();
            } catch {}
          }
          return event;
        },
      });
      sentryInitialized = true;
      console.info('[errorLogger] Sentry initialized (client)');
    }
  } catch (e) {
    console.warn('[errorLogger] Sentry not available (install @sentry/react or @sentry/react-native).');
  }
}

export interface LogContext {
  feature?: string;
  userId?: string;
  companyId?: string;
  action?: string;
  [key: string]: unknown;
}

export async function captureException(error: unknown, context: LogContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message || String(error);

  // 1. Always console (dev + prod logs)
  console.error('[laslogTMX error]', message, context, err.stack);

  // 2. Sentry (if ready)
  try {
    if (sentryInitialized && Sentry && Sentry.captureException) {
      Sentry.captureException(err, { extra: context });
    } else if (Sentry && Sentry.captureException) {
      // late init attempt skipped
    }
  } catch (sErr) {
    console.warn('[errorLogger] Sentry capture failed (non-fatal)', sErr);
  }

  // 3. Supabase Unified Logs (best effort, non-blocking, no crash if table/RPC missing)
  try {
    // Lazy import to avoid circulars and web/mobile bundle issues
    const { supabase } = await import('../../../../lib/supabase');
    // Fire and forget
    const p = supabase
      .from('unified_logs')
      .insert({
        level: 'error',
        message,
        meta: {
          ...context,
          stack: err.stack?.slice(0, 2000),
        },
        created_at: new Date().toISOString(),
      });
    if (p && typeof (p as any).then === 'function') {
      (p as any)
        .then(({ error: logErr }: any) => {
          if (logErr) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[unified_logs] insert skipped:', logErr.message);
            }
          }
        })
        .catch(() => {});
    }
  } catch {
    // supabase not ready or import fail - ignore
  }
}

// Convenience for simple messages (treated as error for monitoring)
export function captureMessage(message: string, context: LogContext = {}) {
  console.warn('[laslogTMX warn]', message, context);
  try {
    if (sentryInitialized && Sentry && Sentry.captureMessage) {
      Sentry.captureMessage(message, { extra: context });
    }
  } catch {}
}
