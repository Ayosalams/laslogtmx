/** Max signup attempts per email, IP, or fingerprint in a rolling 24h window. */
export const MAX_SIGNUPS_PER_DAY = 2;

/** Common disposable domains — mirrored in Supabase migration for authoritative checks. */
export const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  '10minutemail.com',
  'trashmail.com',
  'getnada.com',
  'sharklasers.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  'mailnesia.com',
  'temp-mail.org',
  'emailondeck.com',
] as const;

export const FRAUD_BLOCK_MESSAGE =
  'Too many signup attempts from this email or device. Please try again in 24 hours.';