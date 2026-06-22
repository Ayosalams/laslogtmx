-- Migration: 20240622000000_loads_structure_update.sql
-- Purpose: Improve usability of loads table + backward compatibility

-- 1. Add new columns (idempotent)
ALTER TABLE public.loads 
  ADD COLUMN IF NOT EXISTS company_short_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_city TEXT,
  ADD COLUMN IF NOT EXISTS origin_state CHAR(2),
  ADD COLUMN IF NOT EXISTS destination_city TEXT,
  ADD COLUMN IF NOT EXISTS destination_state CHAR(2),
  ADD COLUMN IF NOT EXISTS pickup_date DATE,
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_time TIME;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_loads_company_short_id ON public.loads(company_short_id);
CREATE INDEX IF NOT EXISTS idx_loads_origin_city_state ON public.loads(origin_city, origin_state);
CREATE INDEX IF NOT EXISTS idx_loads_destination_city_state ON public.loads(destination_city, destination_state);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON public.loads(pickup_date);

-- 3. Safe backfill
UPDATE public.loads
SET 
  company_short_id = 'LAS-' || substring(company_id::text, 1, 6),
  origin_city = NULLIF(trim(split_part(origin, ',', 1)), ''),
  origin_state = UPPER(NULLIF(trim(split_part(origin, ',', 2)), '')),
  destination_city = NULLIF(trim(split_part(destination, ',', 1)), ''),
  destination_state = UPPER(NULLIF(trim(split_part(destination, ',', 2)), '')),
  pickup_date = pickup_date::date,
  pickup_time = pickup_date::time,
  delivery_date = delivery_date::date,
  delivery_time = delivery_date::time
WHERE company_short_id IS NULL;

-- 4. RLS Policies (idempotent)
DROP POLICY IF EXISTS "loads_select_company_or_internal_board" ON public.loads;
DROP POLICY IF EXISTS "loads_insert_internal_board_broker" ON public.loads;
DROP POLICY IF EXISTS "loads_update_own_company" ON public.loads;
DROP POLICY IF EXISTS "loads_delete_own_company" ON public.loads;

CREATE POLICY "loads_select_company_or_internal_board" ON public.loads
  FOR SELECT USING (
    (company_id = get_my_company_id()) OR 
    (is_internal_board = true AND is_laslog_verified = true)
  );

CREATE POLICY "loads_insert_internal_board_broker" ON public.loads
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id() 
    AND is_internal_board = true
  );

CREATE POLICY "loads_update_own_company" ON public.loads
  FOR UPDATE USING (company_id = get_my_company_id());

CREATE POLICY "loads_delete_own_company" ON public.loads
  FOR DELETE USING (company_id = get_my_company_id());

-- 5. Backward Compatibility View (Fixed name collision)
DROP VIEW IF EXISTS public.loads_compat;
CREATE VIEW public.loads_compat AS
SELECT 
  id, company_id, company_short_id, load_number, status, 
  origin_city, origin_state,
  origin_city || COALESCE(', ' || origin_state, '') AS origin,           -- backward compatible
  destination_city, destination_state,
  destination_city || COALESCE(', ' || destination_state, '') AS destination,
  pickup_date, pickup_time,
  pickup_date::timestamp + COALESCE(pickup_time, '00:00:00'::time) AS pickup_datetime,
  delivery_date, delivery_time,
  delivery_date::timestamp + COALESCE(delivery_time, '00:00:00'::time) AS delivery_datetime,
  is_internal_board, is_laslog_verified, rate_cents, equipment, notes,
  created_at, updated_at
FROM public.loads;

-- Comments
COMMENT ON COLUMN public.loads.company_short_id IS 'Human-friendly short ID for display (e.g. LAS-7834)';
COMMENT ON COLUMN public.loads.origin_city IS 'Split for better filtering and UX';
COMMENT ON VIEW public.loads_compat IS 'Backward compatibility view - use this in existing queries if needed';
