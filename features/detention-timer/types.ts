export type DetentionFacility = 'pickup' | 'delivery';

export interface DetentionSession {
  loadId: string | null;
  loadNumber: string;
  facility: DetentionFacility;
  /** ISO timestamp when detention clock started */
  startedAt: string;
  /** Free time allowance in minutes before billable detention */
  freeMinutes: number;
}

export interface DetentionElapsed {
  totalMinutes: number;
  billableMinutes: number;
  isBillable: boolean;
  startedAtMilitary: string;
  currentMilitary: string;
  freeMinutesRemaining: number;
  freeMinutes: number;
}

export interface DetentionClaimDraft {
  loadNumber: string;
  loadId: string | null;
  facility: DetentionFacility;
  startedAtMilitary: string;
  currentMilitary: string;
  elapsedMinutes: number;
  billableMinutes: number;
  freeMinutes: number;
  suggestedAmount: string;
  merchant: string;
  notes: string;
}