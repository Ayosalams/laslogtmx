import type { ExpenseCategory } from './types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'fuel', label: 'Fuel', icon: '⛽' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'tolls', label: 'Tolls', icon: '🛣️' },
  { value: 'food', label: 'Food', icon: '🍽️' },
  { value: 'lodging', label: 'Lodging', icon: '🏨' },
  { value: 'supplies', label: 'Supplies', icon: '📦' },
  { value: 'detention', label: 'Detention', icon: '⏱️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

/** Soft max amounts for inline warnings (not hard blocks). */
export const CATEGORY_AMOUNT_HINTS: Record<ExpenseCategory, { typicalMax: number; hardMax: number }> = {
  fuel: { typicalMax: 800, hardMax: 2500 },
  maintenance: { typicalMax: 1500, hardMax: 10000 },
  tolls: { typicalMax: 150, hardMax: 500 },
  food: { typicalMax: 75, hardMax: 300 },
  lodging: { typicalMax: 250, hardMax: 600 },
  supplies: { typicalMax: 300, hardMax: 2000 },
  detention: { typicalMax: 500, hardMax: 2000 },
  other: { typicalMax: 500, hardMax: 5000 },
};

export const BRAND = {
  accent: '#00bfff',
  accentDark: '#0099cc',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  danger: '#DC2626',
  success: '#047857',
  warning: '#B45309',
} as const;