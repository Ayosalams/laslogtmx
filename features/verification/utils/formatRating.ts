export function formatAverageRating(
  average: number | null | undefined,
  count: number | null | undefined
): string {
  if (average == null || !count) return 'No ratings yet';
  return `${average.toFixed(1)} (${count} rating${count === 1 ? '' : 's'})`;
}

export function formatStarDisplay(rating: number): string {
  const full = Math.round(Math.max(1, Math.min(5, rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}