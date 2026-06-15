/** Amount in USD above which refund requests escalate to the admin queue. */
export const REFUND_ADMIN_ESCALATION_THRESHOLD_USD = 500;

export const REFUND_KEYWORDS = [
  'refund',
  'cancel',
  'money back',
  'moneyback',
  'chargeback',
  'billing dispute',
] as const;