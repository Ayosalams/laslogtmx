import type { BoardLoadStatus } from './types';

export const LOAD_BOARD_COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  accent: '#00BFFF',
  accentTint: '#E0F2FE',
  verified: '#047857',
  verifiedBg: '#D1FAE5',
  warning: '#B45309',
  warningBg: '#FEF3C7',
} as const;

export const EQUIPMENT_TYPES = [
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Step Deck',
  'Power Only',
  'Box Truck',
  'Hotshot',
  'Conestoga',
] as const;

export const BOARD_STATUS_LABELS: Record<BoardLoadStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  bidding: 'Bidding',
  negotiating: 'Negotiating',
  awarded: 'Awarded',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const VERIFIED_BADGE_LABEL = 'laslogTMX Verified';