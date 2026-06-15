import { REFUND_KEYWORDS } from '../constants';

/**
 * Detects refund-related intent in chat input.
 * Matches whole words/phrases (case-insensitive).
 */
export function detectRefundIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;

  return REFUND_KEYWORDS.some((keyword) => {
    if (keyword.includes(' ')) {
      return normalized.includes(keyword);
    }
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    return pattern.test(normalized);
  });
}