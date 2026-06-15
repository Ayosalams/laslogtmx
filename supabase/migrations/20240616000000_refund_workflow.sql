-- =============================================================================
-- laslogTMX Refund Workflow
-- Timestamp: 20240616000000
-- Purpose: Support tickets for chat-initiated refund requests with company RLS
-- =============================================================================

-- System message support on existing chat messages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Support tickets (refund workflow)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'refund' CHECK (type IN ('refund', 'billing', 'general')),
  status text NOT NULL DEFAULT 'refund_requested' CHECK (
    status IN (
      'refund_requested',
      'credit_offered',
      'full_refund_pending',
      'in_review',
      'resolved',
      'denied'
    )
  ),
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  reason text,
  screenshot_path text,
  trigger_message text,
  escalated_to_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_company
  ON public.support_tickets(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_admin_queue
  ON public.support_tickets(company_id, escalated_to_admin)
  WHERE escalated_to_admin = true;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users: view and create tickets within their company
CREATE POLICY "support_tickets_select_own_company"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (company_id = public.get_my_company_id());

CREATE POLICY "support_tickets_insert_own_company"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = public.get_my_company_id()
  AND created_by = auth.uid()
);

-- Company admins can view all tickets and update status (admin queue)
CREATE POLICY "support_tickets_admin_select"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = support_tickets.company_id
      AND p.role = 'admin'
  )
);

CREATE POLICY "support_tickets_admin_update"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = support_tickets.company_id
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = support_tickets.company_id
      AND p.role = 'admin'
  )
);

COMMENT ON TABLE public.support_tickets IS
  'Chat-initiated support tickets. Refund workflow uses status refund_requested. Admin queue via escalated_to_admin.';