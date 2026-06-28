export const DOMAINS = {
  marketing: "laslogtmx.com",
  app: "app.laslogtmx.com",
  staging: "dev.laslogtmx.com",
  /** Legacy domains — redirect-only, never use in new code */
  legacy: ["laslogs.cc", "www.laslogs.cc", "app.laslogs.cc", "dev.laslogs.cc"],
} as const;

export const APP_CONFIG = {
  name: "laslogTMX",
  domain: DOMAINS.marketing,
  marketingUrl: "https://laslogtmx.com",
  webAppUrl: "https://app.laslogtmx.com",
  devUrl: "https://dev.laslogtmx.com",
  defaultTimeFormat: "military", // military or standard
} as const;

export const LOGOS = {
  logo: '/logos/TMX_Prim_Logo_actual.png',
  icon: '/logos/TMX_Icon_Logo_actual.png',
} as const;

export const FEATURES = {
  militaryTimeDefault: true,
  chatSystem: true,
  aiChat: true,
  receiptOcrCorrection: true,
  motusHelper: true,
  cblePrep: true,
  internalLoadBoard: true,
} as const;

export * from './subscription';

export const STORAGE_KEYS = {
  militaryTime: "laslogtmx_military_time",
} as const;

/** Resolve the active app URL from env vars with constant fallbacks. */
export function resolveAppUrl(): string {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.NEXT_PUBLIC_WEB_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.EXPO_PUBLIC_WEB_APP_URL ||
      APP_CONFIG.webAppUrl
    );
  }
  return APP_CONFIG.webAppUrl;
}

/** True when running on the dev.laslogtmx.com staging host. */
export function isStagingHost(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : undefined);
  return host === DOMAINS.staging || host === `www.${DOMAINS.staging}`;
}