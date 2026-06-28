import { AI_CHAT_DISCLAIMERS } from '../constants';
import type { AiChatDomain, AiChatResponse, RetrievedChunk } from '../types';
import { buildRagAnswer, chunksToSources } from './retrieve';

/**
 * Optional LLM synthesis via OpenRouter-compatible API.
 * Falls back to RAG-only when no API key is configured.
 */
export async function synthesizeAnswer(
  query: string,
  domain: AiChatDomain,
  confidence: number,
  chunks: RetrievedChunk[],
  options?: { allowLlm?: boolean }
): Promise<AiChatResponse> {
  const allowLlm = options?.allowLlm !== false;
  const apiKey = allowLlm
    ? (process.env.AI_CHAT_API_KEY ?? process.env.OPENROUTER_API_KEY)
    : undefined;
  const baseUrl =
    process.env.AI_CHAT_BASE_URL ??
    process.env.OPENROUTER_BASE_URL ??
    'https://openrouter.ai/api/v1';
  const model = process.env.AI_CHAT_MODEL ?? 'openrouter/auto';

  const ragAnswer = buildRagAnswer(chunks, domain);
  const sources = chunksToSources(chunks);
  const disclaimer = AI_CHAT_DISCLAIMERS[domain];

  if (!apiKey) {
    return {
      answer: ragAnswer,
      domain,
      confidence,
      sources,
      disclaimer,
      mode: 'rag',
    };
  }

  const context = chunks
    .map((c) => `[${c.id}] ${c.title}\n${c.content.slice(0, 1200)}`)
    .join('\n\n---\n\n');

  const systemPrompt =
    'You are laslogTMX AI assistant. Answer using ONLY the provided OKF context. ' +
    'Use military time in examples. Never invent CFR sections. Cite source IDs in brackets. ' +
    'If context is insufficient, say so clearly.';

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENROUTER_SITE_URL
          ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
          : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Domain: ${domain}\nQuestion: ${query}\n\nOKF Context:\n${context}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      return {
        answer: ragAnswer,
        domain,
        confidence,
        sources,
        disclaimer,
        mode: 'rag',
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const llmText = data.choices?.[0]?.message?.content?.trim();

    return {
      answer: llmText || ragAnswer,
      domain,
      confidence,
      sources,
      disclaimer,
      mode: llmText ? 'llm' : 'rag',
    };
  } catch {
    return {
      answer: ragAnswer,
      domain,
      confidence,
      sources,
      disclaimer,
      mode: 'rag',
    };
  }
}