import { routeQuery } from './routeQuery';

const cases: Array<{ query: string; expected: string }> = [
  { query: 'Explain GRI 3 classification rules', expected: 'cble_prep' },
  { query: 'How do I link my DOT in MOTUS?', expected: 'compliance' },
  { query: 'How does smart load match work?', expected: 'load_board' },
  { query: 'Hello there', expected: 'general' },
];

let passed = 0;
for (const { query, expected } of cases) {
  const result = routeQuery(query);
  if (result.domain === expected) {
    passed++;
    console.log(`PASS: "${query}" -> ${result.domain} (${result.confidence})`);
  } else {
    console.error(`FAIL: "${query}" -> ${result.domain}, expected ${expected}`);
  }
}

console.log(`\n${passed}/${cases.length} router tests passed`);
process.exit(passed === cases.length ? 0 : 1);