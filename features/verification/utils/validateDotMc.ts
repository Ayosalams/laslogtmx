export interface DotMcValidationResult {
  valid: boolean;
  error?: string;
  dotNormalized?: string;
  mcNormalized?: string;
}

/** Client-side DOT/MC format check (authoritative validation is in Supabase RPC). */
export function validateDotMcFormat(
  dotNumber: string,
  mcNumber?: string
): DotMcValidationResult {
  const dot = dotNumber.replace(/\D/g, '');
  if (!dot || dot.length < 6 || dot.length > 8) {
    return { valid: false, error: 'DOT must be 6–8 digits.' };
  }

  if (mcNumber?.trim()) {
    const mc = mcNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^MC\d{5,7}$/.test(mc)) {
      return { valid: false, error: 'MC must be format MC followed by 5–7 digits.' };
    }
    return { valid: true, dotNormalized: dot, mcNormalized: mc };
  }

  return { valid: true, dotNormalized: dot };
}