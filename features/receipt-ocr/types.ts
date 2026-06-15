export type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'tolls'
  | 'food'
  | 'lodging'
  | 'supplies'
  | 'other';

export interface ReceiptOcrResult {
  rawText: string;
  amount: string;
  merchant: string;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  expenseTime: string; // military HH:MM
  confidence: 'high' | 'medium' | 'low';
}

export interface ReceiptCaptureParams {
  imageUri: string;
  ocrResult: ReceiptOcrResult;
}