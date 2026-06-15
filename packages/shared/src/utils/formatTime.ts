/**
 * Formats a message timestamp respecting the military time setting.
 * Uses device local time (timezone is already respected by the Date object).
 * Military: 24h padded HH:MM (e.g. 06:05, 18:42)
 * Standard: locale time with AM/PM
 */
export function formatMessageTime(
  dateInput: string | Date,
  isMilitary: boolean
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isMilitary) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 12-hour with AM/PM, respects device locale
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
