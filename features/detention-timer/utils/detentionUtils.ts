import type { ReceiptOcrResult } from '../../receipt-ocr/types';
import type { DetentionClaimDraft, DetentionElapsed, DetentionFacility, DetentionSession } from '../types';

export const STORAGE_KEY = 'laslogtmx_detention_timer';
export const DEFAULT_FREE_MINUTES = 120;
/** Industry-standard placeholder rate — user confirms amount on claim screen */
export const DEFAULT_DETENTION_RATE_PER_HOUR = 50;

export function toMilitaryTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function computeElapsed(session: DetentionSession, at = new Date()): DetentionElapsed {
  const started = new Date(session.startedAt);
  const totalMinutes = Math.max(0, Math.floor((at.getTime() - started.getTime()) / 60_000));
  const billableMinutes = Math.max(0, totalMinutes - session.freeMinutes);
  const freeMinutesRemaining = Math.max(0, session.freeMinutes - totalMinutes);

  return {
    totalMinutes,
    billableMinutes,
    isBillable: billableMinutes > 0,
    startedAtMilitary: toMilitaryTime(started),
    currentMilitary: toMilitaryTime(at),
    freeMinutesRemaining,
    freeMinutes: session.freeMinutes,
  };
}

export function buildDetentionClaimNotes(
  session: DetentionSession,
  elapsed: DetentionElapsed
): string {
  const facilityLabel = session.facility === 'pickup' ? 'Pickup' : 'Delivery';
  const lines = [
    `Load ${session.loadNumber} • ${facilityLabel} detention`,
    `Started ${elapsed.startedAtMilitary} • Now ${elapsed.currentMilitary}`,
    `Elapsed ${formatDuration(elapsed.totalMinutes)} • Billable ${formatDuration(elapsed.billableMinutes)}`,
    `Free time ${session.freeMinutes} min`,
  ];
  return lines.join(' • ');
}

export function buildDetentionClaimDraft(
  session: DetentionSession,
  elapsed: DetentionElapsed,
  ratePerHour = DEFAULT_DETENTION_RATE_PER_HOUR
): DetentionClaimDraft {
  const billableHours = elapsed.billableMinutes / 60;
  const suggestedAmount =
    elapsed.billableMinutes > 0 ? (billableHours * ratePerHour).toFixed(2) : '';

  const facilityLabel = session.facility === 'pickup' ? 'Pickup' : 'Delivery';

  return {
    loadNumber: session.loadNumber,
    loadId: session.loadId,
    facility: session.facility,
    startedAtMilitary: elapsed.startedAtMilitary,
    currentMilitary: elapsed.currentMilitary,
    elapsedMinutes: elapsed.totalMinutes,
    billableMinutes: elapsed.billableMinutes,
    freeMinutes: session.freeMinutes,
    suggestedAmount,
    merchant: `Detention — Load ${session.loadNumber} (${facilityLabel})`,
    notes: buildDetentionClaimNotes(session, elapsed),
  };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/** Pre-filled OCR defaults for a detention expense claim (manual entry). */
export function buildDetentionClaimOcrDefaults(
  claim: DetentionClaimDraft
): ReceiptOcrResult {
  const now = new Date();
  return {
    rawText: claim.notes,
    amount: claim.suggestedAmount,
    merchant: claim.merchant,
    category: 'detention',
    expenseDate: toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    expenseTime: claim.currentMilitary,
    confidence: 'high',
    fieldConfidence: {
      amount: claim.suggestedAmount ? 'medium' : 'low',
      merchant: 'high',
      date: 'high',
      time: 'high',
      category: 'high',
    },
    categorySuggestions: [{ category: 'detention', score: 1, reason: 'Detention timer claim' }],
    amountCandidates: claim.suggestedAmount
      ? [{ amount: claim.suggestedAmount, label: 'Billable estimate', confidence: 'medium' }]
      : [],
  };
}

export function facilityLabel(facility: DetentionFacility): string {
  return facility === 'pickup' ? 'Pickup' : 'Delivery';
}