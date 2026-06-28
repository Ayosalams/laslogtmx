import { loadAllOkfChunks } from './loadOkfBundles';
import { retrieveFromChunks } from './retrieve';

async function main() {
  const chunks = await loadAllOkfChunks();
  console.log('OKF chunks loaded:', chunks.length);

  const queries = [
    'Explain GRI 3 essential character',
    'MOTUS DOT linking PIN error',
    'How do load match rate alerts work?',
  ];

  for (const query of queries) {
    const r = retrieveFromChunks({ query, chunks });
    console.log(`\nQ: ${query}`);
    console.log(`  domain=${r.domain} confidence=${r.route.confidence}`);
    console.log(`  hits=${r.chunks.map((c) => c.title).join(' | ')}`);
  }

  if (chunks.length < 9) {
    console.error('Expected at least 9 chunks');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});