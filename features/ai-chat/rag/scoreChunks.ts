import type { AiChatDomain, OkfChunk, RetrievedChunk } from '../types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'what',
  'how', 'when', 'where', 'why', 'who', 'which', 'my', 'me', 'i',
  'you', 'your', 'we', 'our', 'they', 'their', 'it', 'its', 'this',
  'that', 'these', 'those', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'and', 'or', 'but', 'not', 'no', 'if', 'about', 'per',
]);

function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? 'Untitled';
}

export function parseChunkMeta(
  raw: string,
  bundleId: string,
  sourceFile: string,
  domain: AiChatDomain,
  id: string,
  tags: string[] = []
): OkfChunk {
  return {
    id,
    bundleId,
    title: extractTitle(raw),
    content: raw.trim(),
    domain,
    tags,
    sourceFile,
  };
}

/** File-based RAG scoring — term overlap + tag boost (no embeddings required). */
export function scoreChunks(
  query: string,
  chunks: OkfChunk[],
  domain: AiChatDomain,
  limit = 3
): RetrievedChunk[] {
  const terms = queryTerms(query);
  if (terms.length === 0) {
    return chunks
      .filter((c) => c.domain === domain || domain === 'general')
      .slice(0, limit)
      .map((c) => ({ ...c, score: 0.1 }));
  }

  const scored = chunks.map((chunk) => {
    const haystack = `${chunk.title} ${chunk.content} ${chunk.tags.join(' ')}`.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
      for (const tag of chunk.tags) {
        if (tag.toLowerCase().includes(term)) score += 0.5;
      }
    }

    if (chunk.domain === domain) score *= 1.25;

    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}