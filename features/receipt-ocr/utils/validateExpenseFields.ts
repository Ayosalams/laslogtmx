import { CATEGORY_AMOUNT_HINTS } from '../constants';
import type { ExpenseCategory } from '../types';

export interface AmountValidation {
  valid: boolean;
  error: string | null;
  warning: string | null;
  normalized: string | null;
}

export function normalizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (parts[1]?.length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return cleaned;
}

export function validateAmount(
  raw: string,
  category: ExpenseCategory,
  ocrAmount?: string
): AmountValidation {
  const normalized = normalizeAmountInput(raw);
  const parsed = parseFloat(normalized);

  if (!normalized || Number.isNaN(parsed)) {
    return { valid: false, error: 'Enter a valid dollar amount', warning: null, normalized: null };
  }
  if (parsed <= 0) {
    return { valid: false, error: 'Amount must be greater than $0.00', warning: null, normalized: null };
  }
  if (parsed > 99_999.99) {
    return { valid: false, error: 'Amount exceeds maximum ($99,999.99)', warning: null, normalized: null };
  }

  const formatted = parsed.toFixed(2);
  const hints = CATEGORY_AMOUNT_HINTS[category];
  let warning: string | null = null;

  if (parsed > hints.hardMax) {
    warning = `$${formatted} is unusually high for ${category}. Double-check the receipt total.`;
  } else if (parsed > hints.typicalMax) {
    warning = `$${formatted} is above typical ${category} expenses. Verify before saving.`;
  }

  if (ocrAmount) {
    const ocrParsed = parseFloat(ocrAmount);
    if (!Number.isNaN(ocrParsed) && Math.abs(ocrParsed - parsed) >= 0.02) {
      const drift = `OCR read $${ocrParsed.toFixed(2)} — confirm your correction.`;
      warning = warning ? `${warning} ${drift}` : drift;
    }
  }

  return { valid: true, error: null, warning, normalized: formatted };
}

export function validateMilitaryTime(raw: string): { valid: boolean; error: string | null; normalized: string | null } {
  const match = raw.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return { valid: false, error: 'Time must be military HH:MM (00:00–23:59)', normalized: null };
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const normalized = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { valid: true, error: null, normalized };
}

export function validateExpenseDate(raw: string): { valid: boolean; error: string | null } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { valid: false, error: 'Date must be YYYY-MM-DD' };
  }
  const [y, m, d] = raw.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { valid: false, error: 'Date is not valid' };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { valid: false, error: 'Expense date cannot be in the future' };
  }
  return { valid: true, error: null };
}