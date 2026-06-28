export type AiChatDomain = 'cble_prep' | 'compliance' | 'load_board' | 'general';

export interface OkfChunk {
  id: string;
  bundleId: string;
  title: string;
  content: string;
  domain: AiChatDomain;
  tags: string[];
  sourceFile: string;
}

export interface RouteResult {
  domain: AiChatDomain;
  confidence: number;
  matchedKeywords: string[];
  bundleIds: string[];
}

export interface RetrievedChunk extends OkfChunk {
  score: number;
}

export interface RagResult {
  chunks: RetrievedChunk[];
  query: string;
  domain: AiChatDomain;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  domain?: AiChatDomain;
  sources?: Array<{ id: string; title: string; bundleId: string }>;
}

export interface AiChatResponse {
  answer: string;
  domain: AiChatDomain;
  confidence: number;
  sources: Array<{ id: string; title: string; bundleId: string }>;
  disclaimer: string;
  mode: 'rag' | 'llm';
}