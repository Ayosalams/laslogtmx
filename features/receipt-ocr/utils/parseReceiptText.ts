import type {
  AmountCandidate,
  CategorySuggestion,
  ExpenseCategory,
  FieldConfidence,
  ReceiptOcrResult,
} from '../types';

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  fuel: ['fuel', 'diesel', 'gas', 'petro', 'shell', 'exxon', 'chevron', 'bp', 'pilot', 'loves', 'ta travel', 'flying j', 'petroleum', 'unleaded'],
  maintenance: ['repair', 'service', 'tire', 'oil change', 'parts', 'mechanic', 'lube', 'brake', 'alignment', 'fleet pride'],
  tolls: ['toll', 'ezpass', 'e-zpass', 'turnpike', 'express lane', 'ipass', 'sunpass'],
  food: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'subway', 'food', 'diner', 'grill', 'pizza', 'burger'],
  lodging: ['hotel', 'motel', 'inn', 'lodging', 'marriott', 'hilton', 'sleep', 'comfort inn', 'holiday inn'],
  supplies: ['supply', 'office', 'hardware', 'walmart', 'target', 'costco', 'parts', 'truck stop'],
  detention: ['detention', 'demurrage', 'waiting', 'layover fee', 'accessorial'],
  other: [],
};

const MERCHANT_SKIP = /^(receipt|invoice|thank you|welcome|store|tel|phone|www\.|http|date|time|cashier|register)/i;
const NOISE_LINE = /^[\d\s\-*#.:]+$/;

function padMilitaryTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/** Normalize common OCR misreads in currency strings. */
export function normalizeOcrText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/(\d)[oO](\d)/g, '$10$2')
    .replace(/(\$)\s*([oO])(\d)/g, '$10$3')
    .replace(/(\d)[lI](\d{2})\b/g, '$1.$2')
    .replace(/\bTOTAL\s*[oO]\s*/gi, 'TOTAL ')
    .trim();
}

function parseCurrencyToken(token: string): number | null {
  const cleaned = token.replace(/[^0-9.,]/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return Number.isNaN(value) || value <= 0 ? null : value;
}

function parseDate(text: string): { date: string; confidence: FieldConfidence } {
  const now = new Date();
  const fallback = toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const patterns: { regex: RegExp; handler: (m: RegExpMatchArray) => string }[] = [
    {
      regex: /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/,
      handler: (m) => toIsoDate(Number(m[1]), Number(m[2]), Number(m[3])),
    },
    {
      regex: /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
      handler: (m) => {
        let year = Number(m[3]);
        if (year < 100) year += 2000;
        return toIsoDate(year, Number(m[1]), Number(m[2]));
      },
    },
    {
      regex: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
      handler: (m) => {
        const monthMap: Record<string, number> = {
          jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
          jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
        };
        const month = monthMap[m[1].slice(0, 3).toLowerCase()] ?? 1;
        return toIsoDate(Number(m[3]), month, Number(m[2]));
      },
    },
  ];

  for (const { regex, handler } of patterns) {
    const match = text.match(regex);
    if (match) return { date: handler(match), confidence: 'high' };
  }

  return { date: fallback, confidence: 'low' };
}

function parseAmounts(text: string): {
  amount: string;
  confidence: FieldConfidence;
  candidates: AmountCandidate[];
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const candidates: AmountCandidate[] = [];
  const seen = new Set<string>();

  const addCandidate = (value: number, label: string, confidence: FieldConfidence) => {
    const key = value.toFixed(2);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ amount: key, label, confidence });
  };

  const totalPatterns = [
    { regex: /(?:^|\b)(?:total|amount\s+due|balance\s+due|grand\s+total|amt\s+due)[:\s]*\$?\s*(\d{1,6}(?:[.,]\d{2})?)/i, label: 'Total', confidence: 'high' as const },
    { regex: /\$\s*(\d{1,6}(?:[.,]\d{2})?)\s*(?:total|due)\b/i, label: 'Total', confidence: 'high' as const },
  ];

  for (const line of lines) {
    for (const { regex, label, confidence } of totalPatterns) {
      const match = line.match(regex);
      if (match) {
        const value = parseCurrencyToken(match[1]);
        if (value) addCandidate(value, label, confidence);
      }
    }
  }

  for (const line of lines) {
    if (/subtotal|sub-total/i.test(line)) {
      const match = line.match(/\$?\s*(\d{1,6}(?:[.,]\d{2})?)/);
      const value = match ? parseCurrencyToken(match[1]) : null;
      if (value) addCandidate(value, 'Subtotal', 'medium');
    }
    if (/\btax\b/i.test(line) && !/total/i.test(line)) {
      const match = line.match(/\$?\s*(\d{1,6}(?:[.,]\d{2})?)/);
      const value = match ? parseCurrencyToken(match[1]) : null;
      if (value) addCandidate(value, 'Tax', 'low');
    }
  }

  const totals = candidates.filter((c) => c.label === 'Total');
  if (totals.length > 0) {
    const best = totals[0];
    return { amount: best.amount, confidence: best.confidence, candidates };
  }

  const nonTax = candidates.filter((c) => c.label !== 'Tax');
  if (nonTax.length > 0) {
    const max = nonTax.reduce((a, b) => (parseFloat(a.amount) >= parseFloat(b.amount) ? a : b));
    return { amount: max.amount, confidence: max.confidence, candidates };
  }

  const allAmounts = [...text.matchAll(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/g)]
    .map((m) => parseCurrencyToken(m[1]))
    .filter((n): n is number => n !== null);

  if (allAmounts.length > 0) {
    const max = Math.max(...allAmounts);
    addCandidate(max, 'Largest $ on receipt', 'medium');
    return { amount: max.toFixed(2), confidence: 'medium', candidates };
  }

  return { amount: '0.00', confidence: 'low', candidates };
}

function parseMerchant(text: string): { merchant: string; confidence: FieldConfidence } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !NOISE_LINE.test(l) && !MERCHANT_SKIP.test(l));

  for (const line of lines.slice(0, 4)) {
    const candidate = line.replace(/[^\w\s&'.-]/g, '').trim();
    if (candidate.length >= 3 && !/\d{3,}/.test(candidate)) {
      return { merchant: candidate.slice(0, 80), confidence: 'medium' };
    }
  }

  return { merchant: '', confidence: 'low' };
}

export function suggestCategories(text: string, merchant: string): CategorySuggestion[] {
  const haystack = `${merchant} ${text}`.toLowerCase();
  const suggestions: CategorySuggestion[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (category === 'other') continue;
    const hits = keywords.filter((kw) => haystack.includes(kw));
    if (hits.length === 0) continue;
    const score = Math.min(100, 40 + hits.length * 20);
    suggestions.push({
      category,
      score,
      reason: hits.slice(0, 2).map((h) => `"${h}"`).join(', '),
    });
  }

  return suggestions.sort((a, b) => b.score - a.score);
}

function inferCategory(suggestions: CategorySuggestion[]): { category: ExpenseCategory; confidence: FieldConfidence } {
  if (suggestions.length === 0) return { category: 'other', confidence: 'low' };
  if (suggestions[0].score >= 60) return { category: suggestions[0].category, confidence: 'high' };
  if (suggestions[0].score >= 40) return { category: suggestions[0].category, confidence: 'medium' };
  return { category: suggestions[0].category, confidence: 'low' };
}

function parseTime(text: string): { time: string; confidence: FieldConfidence } {
  const now = new Date();
  const fallback = padMilitaryTime(now.getHours(), now.getMinutes());

  const military = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?!\s*[ap]\.?m\.?)/i);
  if (military) {
    return {
      time: padMilitaryTime(Number(military[1]), Number(military[2])),
      confidence: 'high',
    };
  }

  const ampm = text.match(/\b(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase().startsWith('p')) hours += 12;
    return {
      time: padMilitaryTime(hours, Number(ampm[2])),
      confidence: 'medium',
    };
  }

  return { time: fallback, confidence: 'low' };
}

export function parseReceiptText(rawText: string): ReceiptOcrResult {
  const normalized = normalizeOcrText(rawText);
  const { amount, confidence: amountConf, candidates } = parseAmounts(normalized);
  const { merchant, confidence: merchantConf } = parseMerchant(normalized);
  const { date, confidence: dateConf } = parseDate(normalized);
  const { time, confidence: timeConf } = parseTime(normalized);
  const categorySuggestions = suggestCategories(normalized, merchant);
  const { category, confidence: categoryConf } = inferCategory(categorySuggestions);

  const fieldConfidence = {
    amount: amountConf,
    merchant: merchantConf,
    date: dateConf,
    time: timeConf,
    category: categoryConf,
  };

  const confidences = Object.values(fieldConfidence);
  const confidence: FieldConfidence = confidences.includes('low')
    ? 'low'
    : confidences.includes('medium')
      ? 'medium'
      : 'high';

  return {
    rawText: normalized,
    amount,
    merchant,
    category,
    expenseDate: date,
    expenseTime: time,
    confidence,
    fieldConfidence,
    categorySuggestions,
    amountCandidates: candidates,
  };
}

export function buildManualOcrDefaults(): ReceiptOcrResult {
  const now = new Date();
  return {
    rawText: '',
    amount: '',
    merchant: '',
    category: 'other',
    expenseDate: toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    expenseTime: padMilitaryTime(now.getHours(), now.getMinutes()),
    confidence: 'low',
    fieldConfidence: {
      amount: 'low',
      merchant: 'low',
      date: 'low',
      time: 'low',
      category: 'low',
    },
    categorySuggestions: [],
    amountCandidates: [],
  };
}