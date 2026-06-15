import type { ExpenseCategory, ReceiptOcrResult } from '../types';

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  fuel: ['fuel', 'diesel', 'gas', 'petro', 'shell', 'exxon', 'chevron', 'bp', 'pilot', 'loves', 'ta travel'],
  maintenance: ['repair', 'service', 'tire', 'oil change', 'parts', 'mechanic', 'lube', 'brake'],
  tolls: ['toll', 'ezpass', 'e-zpass', 'turnpike', 'express lane'],
  food: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'subway', 'food', 'diner'],
  lodging: ['hotel', 'motel', 'inn', 'lodging', 'marriott', 'hilton', 'sleep'],
  supplies: ['supply', 'office', 'hardware', 'walmart', 'target', 'costco', 'parts'],
  other: [],
};

function padMilitaryTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function parseDate(text: string): { date: string; confidence: ReceiptOcrResult['confidence'] } {
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

function parseAmount(text: string): { amount: string; confidence: ReceiptOcrResult['confidence'] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const totalPatterns = [
    /(?:total|amount\s+due|balance\s+due|grand\s+total)[:\s]*\$?\s*(\d{1,6}(?:[.,]\d{2})?)/i,
    /\$\s*(\d{1,6}(?:[.,]\d{2})?)\s*(?:total|due)?/i,
  ];

  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const normalized = match[1].replace(',', '.');
        return { amount: parseFloat(normalized).toFixed(2), confidence: 'high' };
      }
    }
  }

  const amounts = [...text.matchAll(/\$\s*(\d{1,6}(?:[.,]\d{2})?)/g)]
    .map((m) => parseFloat(m[1].replace(',', '.')))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (amounts.length > 0) {
    const max = Math.max(...amounts);
    return { amount: max.toFixed(2), confidence: 'medium' };
  }

  return { amount: '0.00', confidence: 'low' };
}

function parseMerchant(text: string): { merchant: string; confidence: ReceiptOcrResult['confidence'] } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^\d+$/.test(l) && !/^(receipt|invoice|thank you)/i.test(l));

  if (lines.length > 0) {
    const candidate = lines[0].replace(/[^\w\s&'.-]/g, '').trim();
    if (candidate.length >= 2) {
      return { merchant: candidate.slice(0, 80), confidence: 'medium' };
    }
  }

  return { merchant: 'Unknown Merchant', confidence: 'low' };
}

function inferCategory(text: string, merchant: string): ExpenseCategory {
  const haystack = `${merchant} ${text}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (category === 'other') continue;
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }

  return 'other';
}

function parseTime(text: string): string {
  const now = new Date();
  const fallback = padMilitaryTime(now.getHours(), now.getMinutes());

  const military = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (military) {
    return padMilitaryTime(Number(military[1]), Number(military[2]));
  }

  const ampm = text.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toUpperCase() === 'PM') hours += 12;
    return padMilitaryTime(hours, Number(ampm[2]));
  }

  return fallback;
}

export function parseReceiptText(rawText: string): ReceiptOcrResult {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  const { amount, confidence: amountConf } = parseAmount(normalized);
  const { merchant, confidence: merchantConf } = parseMerchant(normalized);
  const { date, confidence: dateConf } = parseDate(normalized);
  const expenseTime = parseTime(normalized);
  const category = inferCategory(normalized, merchant);

  const confidences = [amountConf, merchantConf, dateConf];
  const confidence: ReceiptOcrResult['confidence'] = confidences.includes('low')
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
    expenseTime,
    confidence,
  };
}