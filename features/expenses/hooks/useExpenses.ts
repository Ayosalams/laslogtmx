import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import type { CreateExpenseInput, Expense } from '../types';

async function uploadReceiptImage(
  companyId: string,
  localUri: string
): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ext = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const fileName = `${companyId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('receipts').upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });

    if (error) {
      console.warn('Receipt upload failed:', error.message);
      return null;
    }

    // Private bucket — store object path; use signed URLs when displaying images
    return fileName;
  } catch (err) {
    console.warn('Receipt upload error:', err);
    return null;
  }
}

export function useExpenses() {
  const { profile, company } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = company?.id ?? profile?.company_id ?? null;

  const fetchExpenses = useCallback(async () => {
    if (!companyId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setExpenses([]);
    } else {
      setExpenses((data as Expense[]) ?? []);
    }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = useCallback(
    async (input: CreateExpenseInput): Promise<Expense | null> => {
      if (!companyId || !profile?.id) {
        setError('Company context required to save expenses');
        return null;
      }

      if (!input.user_confirmed) {
        setError('Expense must be confirmed before saving');
        return null;
      }

      setSaving(true);
      setError(null);

      let receiptImageUrl: string | null = null;
      if (input.receipt_image_uri) {
        receiptImageUrl = await uploadReceiptImage(companyId, input.receipt_image_uri);
      }

      const { data, error: insertError } = await supabase
        .from('expenses')
        .insert({
          company_id: companyId,
          created_by: profile.id,
          amount: input.amount,
          merchant: input.merchant.trim(),
          category: input.category,
          expense_date: input.expense_date,
          expense_time: input.expense_time ?? null,
          receipt_image_url: receiptImageUrl,
          notes: input.notes?.trim() || null,
          ocr_raw_text: input.ocr_raw_text ?? null,
          user_confirmed: true,
        })
        .select()
        .single();

      setSaving(false);

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      const expense = data as Expense;
      setExpenses((prev) => [expense, ...prev]);
      return expense;
    },
    [companyId, profile?.id]
  );

  return {
    expenses,
    loading,
    saving,
    error,
    refresh: fetchExpenses,
    createExpense,
    companyId,
  };
}