export function formatRateCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function parseRateToCents(rateInput: string): number | null {
  const cleaned = rateInput.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  if (Number.isNaN(value) || value <= 0) return null;
  return Math.round(value * 100);
}