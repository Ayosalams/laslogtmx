-- OKF pgvector schema (optional upgrade from file-based RAG)
-- Apply when ready to migrate from knowledge/okf/ filesystem bundles.
-- Requires: CREATE EXTENSION vector; (enabled on Supabase via dashboard)

-- CREATE EXTENSION IF NOT EXISTS vector;

-- CREATE TABLE IF NOT EXISTS public.okf_chunks (
--   id text PRIMARY KEY,
--   bundle_id text NOT NULL,
--   domain text NOT NULL CHECK (domain IN ('cble_prep', 'compliance', 'load_board', 'general')),
--   title text NOT NULL,
--   content text NOT NULL,
--   tags text[] DEFAULT '{}',
--   source_file text,
--   embedding vector(1536),
--   updated_at timestamptz DEFAULT now()
-- );

-- CREATE INDEX IF NOT EXISTS okf_chunks_bundle_idx ON public.okf_chunks (bundle_id);
-- CREATE INDEX IF NOT EXISTS okf_chunks_domain_idx ON public.okf_chunks (domain);
-- CREATE INDEX IF NOT EXISTS okf_chunks_embedding_idx
--   ON public.okf_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- ALTER TABLE public.okf_chunks ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY okf_chunks_read_authenticated ON public.okf_chunks
--   FOR SELECT TO authenticated USING (true);

-- Service role only for inserts/updates (ingestion script):
-- CREATE POLICY okf_chunks_write_service ON public.okf_chunks
--   FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Similarity search RPC (uncomment after table + extension exist):
-- CREATE OR REPLACE FUNCTION public.search_okf_chunks(
--   p_query_embedding vector(1536),
--   p_domain text DEFAULT NULL,
--   p_limit int DEFAULT 3
-- )
-- RETURNS TABLE (
--   id text,
--   bundle_id text,
--   title text,
--   content text,
--   similarity float
-- )
-- LANGUAGE sql STABLE
-- AS $$
--   SELECT
--     c.id,
--     c.bundle_id,
--     c.title,
--     c.content,
--     1 - (c.embedding <=> p_query_embedding) AS similarity
--   FROM public.okf_chunks c
--   WHERE (p_domain IS NULL OR c.domain = p_domain)
--   ORDER BY c.embedding <=> p_query_embedding
--   LIMIT p_limit;
-- $$;

-- Placeholder: file-based RAG in features/ai-chat/rag/ is the active v1 implementation.
SELECT 1;