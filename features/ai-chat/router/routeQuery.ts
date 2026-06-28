import { DOMAIN_BUNDLES, ROUTER_KEYWORDS } from '../constants';
import type { AiChatDomain, RouteResult } from '../types';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDomain(
  normalized: string,
  tokens: string[],
  keywords: string[]
): { score: number; matched: string[] } {
  const matched: string[] = [];
  let score = 0;

  for (const keyword of keywords) {
    if (keyword.includes(' ')) {
      if (normalized.includes(keyword)) {
        matched.push(keyword);
        score += 3;
      }
      continue;
    }
    if (tokens.includes(keyword)) {
      matched.push(keyword);
      score += 2;
    } else if (normalized.includes(keyword)) {
      matched.push(keyword);
      score += 1;
    }
  }

  return { score, matched };
}

/**
 * Lightweight keyword router — classifies user queries into OKF domains.
 * Returns general when no domain scores above threshold.
 */
export function routeQuery(query: string): RouteResult {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      domain: 'general',
      confidence: 0,
      matchedKeywords: [],
      bundleIds: [],
    };
  }

  const tokens = tokenize(normalized);
  const domains = Object.keys(ROUTER_KEYWORDS) as Array<Exclude<AiChatDomain, 'general'>>;

  let bestDomain: Exclude<AiChatDomain, 'general'> | 'general' = 'general';
  let bestScore = 0;
  let bestMatched: string[] = [];

  for (const domain of domains) {
    const { score, matched } = scoreDomain(normalized, tokens, ROUTER_KEYWORDS[domain]);
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
      bestMatched = matched;
    }
  }

  const threshold = 2;
  if (bestScore < threshold) {
    return {
      domain: 'general',
      confidence: 0.3,
      matchedKeywords: [],
      bundleIds: ['cble-prep', 'compliance', 'load-board'],
    };
  }

  const maxPossible = ROUTER_KEYWORDS[bestDomain].length * 3;
  const confidence = Math.min(0.95, 0.5 + bestScore / Math.max(maxPossible, 1));

  return {
    domain: bestDomain,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: bestMatched,
    bundleIds: DOMAIN_BUNDLES[bestDomain],
  };
}