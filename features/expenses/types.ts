import type { ExpenseCategory } from '../receipt-ocr/types';

export interface Expense {
  id: string;
  company_id: string;
  created_by: string | null;
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  expense_date: string;
  expense_time: string | null;
  receipt_image_url: string | null;
  notes: string | null;
  ocr_raw_text: string | null;
  user_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  expense_date: string;
  expense_time?: string;
  receipt_image_uri?: string;
  notes?: string;
  ocr_raw_text?: string;
  user_confirmed: boolean;
}