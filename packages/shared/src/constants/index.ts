export const APP_CONFIG = {
  name: "laslogTMX",
  domain: "laslogtmx.com",
  webAppUrl: "https://app.laslogtmx.com",
  devUrl: "https://dev.laslogtmx.com",
  defaultTimeFormat: "military",
} as const;

export const FEATURES = {
  militaryTimeDefault: true,
  chatSystem: true,
  receiptOcrCorrection: true,
  motusHelper: true,
} as const;
