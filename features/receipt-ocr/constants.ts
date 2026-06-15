import type { ExpenseCategory } from './types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'fuel', label: 'Fuel', icon: '⛽' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'tolls', label: 'Tolls', icon: '🛣️' },
  { value: 'food', label: 'Food', icon: '🍽️' },
  { value: 'lodging', label: 'Lodging', icon: '🏨' },
  { value: 'supplies', label: 'Supplies', icon: '📦' },
  { value: 'other', label: 'Other', icon: '📋' },
];

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
} as const;