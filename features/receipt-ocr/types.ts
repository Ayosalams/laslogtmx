export type ExpenseCategory =
  | 'fuel'
  | 'maintenance'
  | 'tolls'
  | 'food'
  | 'lodging'
  | 'supplies'
  | 'detention'
  | 'other';

export type FieldConfidence = 'high' | 'medium' | 'low';

export interface CategorySuggestion {
  category: ExpenseCategory;
  score: number;
  reason: string;
}

export interface AmountCandidate {
  amount: string;
  label: string;
  confidence: FieldConfidence;
}

export interface ReceiptOcrResult {
  rawText: string;
  amount: string;
  merchant: string;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  expenseTime: string; // military HH:MM
  confidence: FieldConfidence;
  fieldConfidence: {
    amount: FieldConfidence;
    merchant: FieldConfidence;
    date: FieldConfidence;
    time: FieldConfidence;
    category: FieldConfidence;
  };
  categorySuggestions: CategorySuggestion[];
  amountCandidates: AmountCandidate[];
}

export interface ReceiptCaptureParams {
  imageUri?: string;
  ocrResult?: ReceiptOcrResult;
  manual?: boolean;
  detentionContext?: {
    loadNumber: string;
    loadId?: string | null;
    facility?: 'pickup' | 'delivery';
  };
  /** Pre-filled from detention timer claim generator */
  detentionClaim?: boolean;
}