export const APP_CONFIG = {
  name: "laslogTMX",
  domain: "laslogtmx.com",
  webAppUrl: "https://app.laslogtmx.com",
  devUrl: "https://dev.laslogtmx.com",
  defaultTimeFormat: "military", // military or standard
} as const;

export const FEATURES = {
  militaryTimeDefault: true,
  chatSystem: true,
  receiptOcrCorrection: true,
  motusHelper: true,
  cblePrep: true,
} as const;

export * from './subscription';

export const STORAGE_KEYS = {
  militaryTime: "laslogtmx_military_time",
} as const;