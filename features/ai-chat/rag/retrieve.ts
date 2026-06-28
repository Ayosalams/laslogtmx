import { routeQuery } from '../router/routeQuery';
import type { AiChatDomain, OkfChunk, RagResult, RetrievedChunk } from '../types';
import { scoreChunks } from './scoreChunks';

export interface RetrieveOptions {
  query: string;
  chunks: OkfChunk[];
  domainOverride?: AiChatDomain;
  limit?: number;
}

/**
 * End-to-end RAG retrieval: route → filter bundles → score chunks.
 */
export function retrieveFromChunks(options: RetrieveOptions): RagResult & {
  route: ReturnType<typeof routeQuery>;
} {
  const route = routeQuery(options.query);
  const domain = options.domainOverride ?? route.domain;
  const bundleFilter = route.bundleIds;

  let pool = options.chunks;
  if (bundleFilter.length > 0 && domain !== 'general') {
    pool = pool.filter((c) => bundleFilter.includes(c.bundleId));
  }

  const scored = scoreChunks(options.query, pool, domain, options.limit ?? 3);

  if (scored.length === 0 && domain !== 'general') {
    const fallback = scoreChunks(options.query, options.chunks, 'general', options.limit ?? 3);
    return { chunks: fallback, query: options.query, domain, route };
  }

  return { chunks: scored, query: options.query, domain, route };
}

export function buildRagAnswer(chunks: RetrievedChunk[], domain: AiChatDomain): string {
  if (chunks.length === 0) {
    return (
      'I could not find a matching knowledge article for that question. ' +
      'Try rephrasing with terms like HTS, MOTUS, DOT, load match, or bidding.'
    );
  }

  const intro =
    domain === 'cble_prep'
      ? 'Based on laslogTMX CBLE Prep training materials:'
      : domain === 'compliance'
        ? 'Based on FMCSA compliance guidance in our knowledge base:'
        : domain === 'load_board'
          ? 'Based on internal load board policies:'
          : 'Here is what I found across laslogTMX knowledge:';

  const sections = chunks.map((chunk, i) => {
    const excerpt = chunk.content
      .replace(/^#\s+.+\n+/m, '')
      .trim()
      .slice(0, 600);
    const trimmed = excerpt.length < chunk.content.length ? `${excerpt}…` : excerpt;
    return `**${i + 1}. ${chunk.title}** (${chunk.bundleId})\n${trimmed}`;
  });

  return [intro, '', ...sections].join('\n\n');
}

export function chunksToSources(chunks: RetrievedChunk[]) {
  return chunks.map((c) => ({
    id: c.id,
    title: c.title,
    bundleId: c.bundleId,
  }));
}