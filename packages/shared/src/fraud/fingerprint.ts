/**
 * Lightweight client fingerprint for signup velocity checks.
 * Not bulletproof — pairs with IP + email rules server-side.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ''),
  ];

  const raw = parts.join('|');
  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }

  return `fp_${Math.abs(hash).toString(36)}`;
}