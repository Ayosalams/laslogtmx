import { checkDomainAccess, evaluateAiChatAccess } from './aiChatAccess';

const proBrokerVerified = {
  subscription_tier: 'pro_broker' as const,
  is_laslog_verified: true,
  is_active: true,
  company_type: 'broker' as const,
};

const proBrokerUnverified = {
  subscription_tier: 'pro_broker' as const,
  is_laslog_verified: false,
  is_active: true,
};

const starter = {
  subscription_tier: 'starter' as const,
  is_laslog_verified: true,
  is_active: true,
};

let passed = 0;

function assert(label: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}`);
  }
}

const locked = evaluateAiChatAccess(starter);
assert('starter is locked', locked.isLocked);
assert('starter cannot use LLM', !locked.canUseLlm);
assert('starter blocked on compliance', !locked.canAccessDomain('compliance'));

const full = evaluateAiChatAccess(proBrokerVerified);
assert('pro broker has advanced access', full.hasAdvancedAccess);
assert('pro broker can access cble_prep', full.canAccessDomain('cble_prep'));
assert('pro broker verified can access load_board', full.canAccessDomain('load_board'));

const partial = evaluateAiChatAccess(proBrokerUnverified);
assert('pro broker unverified can access compliance', partial.canAccessDomain('compliance'));
assert('pro broker unverified blocked on load_board', !partial.canAccessDomain('load_board'));

const loadGate = checkDomainAccess('load_board', proBrokerUnverified);
assert('load_board gate returns message', !loadGate.allowed && loadGate.message.includes('Verified'));

const TOTAL = 9;
console.log(`\n${passed}/${TOTAL} access tests passed`);
process.exit(passed === TOTAL ? 0 : 1);