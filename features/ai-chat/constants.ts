import type { AiChatDomain } from './types';

export const AI_CHAT_DISCLAIMERS: Record<AiChatDomain, string> = {
  cble_prep:
    'INTERNAL TRAINING ONLY — Not official CBP/CBLE material. Verify all regulatory references independently.',
  compliance:
    'General FMCSA guidance — confirm with official FMCSA/MOTUS systems before taking action.',
  load_board:
    'Internal load board policy guidance — not legal, brokerage, or contract advice.',
  general:
    'AI assistant response — verify critical decisions with laslogTMX support or official sources.',
};

export const DOMAIN_LABELS: Record<AiChatDomain, string> = {
  cble_prep: 'CBLE Prep',
  compliance: 'Compliance',
  load_board: 'Load Board',
  general: 'General',
};

export const ROUTER_KEYWORDS: Record<Exclude<AiChatDomain, 'general'>, string[]> = {
  cble_prep: [
    'cble',
    'customs broker',
    'broker license',
    'hts',
    'harmonized tariff',
    'gri',
    'classification',
    '19 cfr',
    'entry type',
    'consumption entry',
    'ace entry',
    'valuation',
    'duty',
    'import',
    'cbp',
    'chapter note',
    'subheading',
  ],
  compliance: [
    'fmcsa',
    'motus',
    'dot number',
    'dot linking',
    'mcs-150',
    'mcs150',
    'insurance',
    'bmc-84',
    'bmc-91',
    'authority',
    'oos',
    'out of service',
    'safer',
    'biennial',
    'carrier compliance',
    'surety bond',
  ],
  load_board: [
    'load board',
    'load match',
    'smart match',
    'bid',
    'bidding',
    'contract',
    'award',
    'broker post',
    'carrier bid',
    'rate alert',
    'preferred route',
    'preferred city',
    'verified',
    'negotiation',
    'detention',
    'lane',
  ],
};

export const DOMAIN_BUNDLES: Record<Exclude<AiChatDomain, 'general'>, string[]> = {
  cble_prep: ['cble-prep'],
  compliance: ['compliance'],
  load_board: ['load-board'],
};

export const SUGGESTED_PROMPTS: Record<Exclude<AiChatDomain, 'general'>, string[]> = {
  cble_prep: [
    'Explain GRI 3(b) essential character with an example',
    'What are the main ACE entry types?',
    'What records must a customs broker retain per 19 CFR?',
  ],
  compliance: [
    'How do I link my DOT number in MOTUS?',
    'What insurance does a freight broker need?',
    'When is my MCS-150 biennial update due?',
  ],
  load_board: [
    'How do smart load match notifications work?',
    'What is the bidding etiquette on the internal board?',
    'What terms should I confirm before awarding a load?',
  ],
};