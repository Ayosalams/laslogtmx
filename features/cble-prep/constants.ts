import type { CbleCategory, CbleMaterial } from './types';

/** Shown on every CBLE material and screen — internal training only */
export const CBLE_DISCLAIMER_SHORT =
  'Internal training only. Not affiliated with CBP or the licensing exam.';

export const CBLE_DISCLAIMER_FULL =
  'INTERNAL TRAINING ONLY — This material is for laslogTMX team education and broker onboarding. ' +
  'It is not official CBP study material, does not guarantee exam results, and is not affiliated with ' +
  'U.S. Customs and Border Protection or the Customs Broker License Exam (CBLE). ' +
  'Pronunciation guides follow LAS (Logistics & Supply) internal standards.';

export const CBLE_PRONUNCIATION_NOTE =
  'LAS pronunciation guide: Terms are spoken per laslogTMX internal standards (e.g., "HTS" as H-T-S, ' +
  '"ACE" as A-C-E). Regional broker terminology may vary.';

export const CBLE_CATEGORIES: CbleCategory[] = [
  {
    id: 'customs_law',
    title: 'Customs Law & Regulations',
    description: '19 CFR fundamentals, broker responsibilities, and compliance frameworks',
    icon: '§',
  },
  {
    id: 'entry_procedures',
    title: 'Entry Procedures',
    description: 'ACE filings, entry types, and documentary requirements',
    icon: '📋',
  },
  {
    id: 'classification',
    title: 'Classification (HTS)',
    description: 'Harmonized Tariff Schedule rules, GRI, and chapter notes',
    icon: '🏷️',
  },
  {
    id: 'valuation',
    title: 'Valuation & Duties',
    description: 'Transaction value, assists, and duty calculation basics',
    icon: '💰',
  },
  {
    id: 'pronunciation',
    title: 'LAS Terminology & Pronunciation',
    description: 'Broker vocabulary with LAS pronunciation standards',
    icon: '🔊',
  },
];

/**
 * Placeholder library content.
 * TODO: Replace assetPath values with real Supabase Storage URLs (podcasts, videos, PDFs).
 * TODO: Wire progress tracking via cble_material_progress table when backend is ready.
 */
export const CBLE_PLACEHOLDER_MATERIALS: CbleMaterial[] = [
  {
    id: 'cble-pod-001',
    categoryId: 'customs_law',
    title: 'Broker Authority Overview',
    description: 'Introductory podcast on customs broker licensing scope and duties',
    type: 'podcast',
    durationMinutes: 24,
    updatedAt: '2026-06-10T14:30:00Z',
    assetPath: 'cble/podcasts/broker-authority-overview.mp3',
    requiresFullAccess: false,
  },
  {
    id: 'cble-vid-001',
    categoryId: 'entry_procedures',
    title: 'ACE Entry Walkthrough',
    description: 'Video demo of a standard consumption entry in ACE (simulated)',
    type: 'video',
    durationMinutes: 18,
    updatedAt: '2026-06-11T09:15:00Z',
    assetPath: 'cble/videos/ace-entry-walkthrough.mp4',
    requiresFullAccess: true,
  },
  {
    id: 'cble-pdf-001',
    categoryId: 'classification',
    title: 'HTS General Rules of Interpretation',
    description: 'PDF study sheet — GRI 1–6 with worked examples',
    type: 'pdf',
    updatedAt: '2026-06-12T16:45:00Z',
    assetPath: 'cble/pdfs/hts-gri-study-sheet.pdf',
    requiresFullAccess: true,
  },
  {
    id: 'cble-pod-002',
    categoryId: 'valuation',
    title: 'Transaction Value Deep Dive',
    description: 'Podcast on assists, related-party transactions, and additions',
    type: 'podcast',
    durationMinutes: 32,
    updatedAt: '2026-06-13T11:00:00Z',
    assetPath: 'cble/podcasts/transaction-value-deep-dive.mp3',
    requiresFullAccess: true,
  },
  {
    id: 'cble-vid-002',
    categoryId: 'pronunciation',
    title: 'LAS Broker Terminology — Pronunciation Guide',
    description: 'Video pronunciation reference for common customs broker terms',
    type: 'video',
    durationMinutes: 12,
    updatedAt: '2026-06-14T08:20:00Z',
    assetPath: 'cble/videos/las-pronunciation-guide.mp4',
    requiresFullAccess: false,
  },
  {
    id: 'cble-pdf-002',
    categoryId: 'customs_law',
    title: '19 CFR Quick Reference',
    description: 'Condensed regulatory reference for internal review sessions',
    type: 'pdf',
    updatedAt: '2026-06-14T17:30:00Z',
    assetPath: 'cble/pdfs/19-cfr-quick-reference.pdf',
    requiresFullAccess: true,
  },
];