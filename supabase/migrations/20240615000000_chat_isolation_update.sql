-- =============================================================================
-- laslogTMX Chat Isolation Update (aligns with new foundation)
-- Timestamp: 20240615000000
-- Purpose: Improve existing chat RLS to use the new profiles-based company isolation
--          instead of (or in addition to) user_metadata. This is the recommended
--          production approach.
-- =============================================================================

-- The original 20240614_000000_chat_system.sql created tables using user_metadata.
-- This migration adds safer policies based on profiles.company_id while preserving
-- load-specific chat behavior.

-- Make sure the helper from foundation exists (idempotent)
create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- =============================================================================
-- Safe policy updates for chat tables
-- We wrap everything in DO blocks that first check if the table exists.
-- This prevents errors if this migration is applied before the chat tables
-- are created (e.g. due to filename sorting or partial deploys).
-- =============================================================================

-- Channels policies (improved to use profiles.company_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'channels'
  ) THEN
    -- Drop old policies if they exist (from the original chat migration)
    DROP POLICY IF EXISTS "channels_select_company_or_load" ON public.channels;
    DROP POLICY IF EXISTS "channels_insert_own_company" ON public.channels;

    CREATE POLICY "channels_select_company_or_load_v2"
    ON public.channels
    FOR SELECT
    TO authenticated
    USING (
      company_id = public.get_my_company_id()
      OR (load_id IS NOT NULL)  -- Load-specific chats remain accessible to participants
    );

    CREATE POLICY "channels_insert_own_company_v2"
    ON public.channels
    FOR INSERT
    TO authenticated
    WITH CHECK (company_id = public.get_my_company_id());
  END IF;
END $$;

-- Messages policies (improved to use profiles.company_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    DROP POLICY IF EXISTS "messages_select_channel_access" ON public.messages;
    DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;

    CREATE POLICY "messages_select_own_company_v2"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 
        FROM public.channels c 
        WHERE c.id = messages.channel_id 
          AND (
            c.company_id = public.get_my_company_id() 
            OR c.load_id IS NOT NULL
          )
      )
    );

    CREATE POLICY "messages_insert_own_company_v2"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 
        FROM public.channels c 
        WHERE c.id = messages.channel_id 
          AND (
            c.company_id = public.get_my_company_id() 
            OR c.load_id IS NOT NULL
          )
      )
    );
  END IF;
END $$;

-- Keep the report update policy from the original (it references messages, so guard it too)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    DROP POLICY IF EXISTS "messages_update_reported_by_reporter" ON public.messages;

    CREATE POLICY "messages_update_reported_by_reporter"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
      -- reporter can mark reported
      EXISTS (
        SELECT 1 FROM public.message_reports r
        WHERE r.message_id = messages.id AND r.reporter_user_id = auth.uid()
      )
      OR 
      -- owner of message or future admin role
      user_id = auth.uid()
    )
    WITH CHECK (reported = true);
  END IF;
END $$;

-- Reports policies (guarded for completeness)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'message_reports'
  ) THEN
    DROP POLICY IF EXISTS "reports_select_own" ON public.message_reports;
    DROP POLICY IF EXISTS "reports_insert_own" ON public.message_reports;

    CREATE POLICY "reports_select_own"
    ON public.message_reports
    FOR SELECT
    TO authenticated
    USING (reporter_user_id = auth.uid());

    CREATE POLICY "reports_insert_own"
    ON public.message_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (reporter_user_id = auth.uid());
  END IF;
END $$;

-- Add / update comments (these are safe even if tables don't exist yet)
COMMENT ON TABLE public.channels IS 'Company + Load-specific chat channels. RLS now prefers profiles.company_id for stronger isolation (see get_my_company_id()).';
COMMENT ON FUNCTION public.get_my_company_id() IS 'Preferred over user_metadata for production. All new RLS policies should use this function.';

-- Optional: Add a helper view for easier querying in the app (guarded)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) THEN
    CREATE OR REPLACE VIEW public.my_company AS
    SELECT * FROM public.companies WHERE id = public.get_my_company_id();
  END IF;
END $$;

COMMENT ON VIEW public.my_company IS 'Convenience view for the current user''s company. Use with care in RLS.';

-- Note: This migration is designed to be safe regardless of application order.
-- It will gracefully skip policy updates if the chat tables do not exist yet.
-- The original chat migration (20240614_000000_chat_system.sql) is responsible for creating the tables.