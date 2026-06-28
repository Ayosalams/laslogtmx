-- =============================================================================
-- laslogTMX Staging Seed Data (dev.laslogtmx.com / laslogtmx-dev)
-- Run against the STAGING Supabase project only — never production.
-- Apply after migrations: supabase db reset (local) or SQL editor (remote staging).
-- Safe to re-run (on conflict / upsert patterns).
-- =============================================================================

-- ── Test Companies (carriers, brokers, mixed — varied tiers & verification) ──
insert into public.companies (
  id, name, dot_number, mc_number, is_active,
  subscription_tier, billing_interval,
  is_laslog_verified, company_type,
  verification_status, dot_mc_validation_status
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Staging Carrier Alpha', 'STG100001', 'MC-STG001', true,
   'pro', 'monthly', true, 'carrier', 'admin_verified', 'valid'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Staging Broker Beta', 'STG200002', 'MC-STG002', true,
   'pro_broker', 'yearly', true, 'broker', 'admin_verified', 'valid'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Staging Mixed Logistics', 'STG300003', 'MC-STG003', true,
   'enterprise', 'yearly', true, 'mixed', 'self_attested', 'valid'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Staging Starter Fleet', 'STG400004', 'MC-STG004', true,
   'starter', 'monthly', false, 'carrier', 'unverified', 'not_submitted'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Staging Flagged Co (demo)', 'STG500005', 'MC-STG005', true,
   'starter', 'monthly', false, 'broker', 'flagged', 'invalid_format')
on conflict (id) do update set
  name = excluded.name,
  subscription_tier = excluded.subscription_tier,
  billing_interval = excluded.billing_interval,
  is_laslog_verified = excluded.is_laslog_verified,
  company_type = excluded.company_type,
  verification_status = excluded.verification_status,
  dot_mc_validation_status = excluded.dot_mc_validation_status,
  is_fraud_flagged = (excluded.verification_status = 'flagged');

-- Flag the demo fraud company
update public.companies
set is_fraud_flagged = true
where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

-- ── Operational TMS Loads (per-company isolation demos) ──
insert into public.loads (
  company_id, load_number, status, origin, destination,
  pickup_date, delivery_date, is_internal_board, board_status,
  is_laslog_verified, equipment, rate_cents, commodity, weight_lbs
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'STG-OP-1001', 'pending',
   'Chicago, IL', 'Atlanta, GA', now() + interval '1 day', now() + interval '3 days',
   false, 'open', true, null, null, 'General Freight', null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'STG-OP-1002', 'in_transit',
   'Dallas, TX', 'Houston, TX', now() - interval '1 day', now() + interval '1 day',
   false, 'open', true, 'Dry Van', null, 'Building Materials', 42000),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'STG-OP-2001', 'assigned',
   'Los Angeles, CA', 'Phoenix, AZ', now() + interval '2 days', now() + interval '4 days',
   false, 'open', true, 'Reefer', 185000, 'Produce', 38000)
on conflict (company_id, load_number) do update set
  status = excluded.status,
  origin = excluded.origin,
  destination = excluded.destination,
  pickup_date = excluded.pickup_date,
  delivery_date = excluded.delivery_date;

-- ── Internal Load Board (open, bidding, negotiating demos) ──
insert into public.loads (
  company_id, load_number, status, origin, destination,
  pickup_date, delivery_date, is_internal_board, board_status,
  is_laslog_verified, equipment, rate_cents, commodity, weight_lbs
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'STG-IB-OPEN-01', 'pending',
   'Memphis, TN', 'Nashville, TN', now() + interval '3 days', now() + interval '4 days',
   true, 'open', true, 'Dry Van', 95000, 'Electronics', 28000),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'STG-IB-BID-02', 'pending',
   'Denver, CO', 'Salt Lake City, UT', now() + interval '5 days', now() + interval '7 days',
   true, 'bidding', true, 'Flatbed', 210000, 'Steel Coils', 44000),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'STG-IB-NEG-03', 'pending',
   'Seattle, WA', 'Portland, OR', now() + interval '2 days', now() + interval '3 days',
   true, 'negotiating', true, 'Reefer', 165000, 'Seafood', 35000),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'STG-IB-CLOSED-04', 'delivered',
   'Miami, FL', 'Orlando, FL', now() - interval '5 days', now() - interval '4 days',
   true, 'closed', true, 'Dry Van', 72000, 'Retail Goods', 22000)
on conflict (company_id, load_number) do update set
  board_status = excluded.board_status,
  is_internal_board = excluded.is_internal_board,
  rate_cents = excluded.rate_cents,
  equipment = excluded.equipment;

-- ── Company + Load Channels (chat demos) ──
insert into public.channels (name, company_id, load_id, is_active)
select 'Staging Alpha Dispatch', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, null, true
where not exists (
  select 1 from public.channels
  where company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and load_id is null
    and name = 'Staging Alpha Dispatch'
);

insert into public.channels (name, company_id, load_id, is_active)
select 'Staging Broker Ops', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, null, true
where not exists (
  select 1 from public.channels
  where company_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and load_id is null
    and name = 'Staging Broker Ops'
);

-- Link load-specific channel by load_number lookup
insert into public.channels (name, company_id, load_id, is_active)
select
  'STG-IB-OPEN-01 — Memphis to Nashville',
  null,
  l.id,
  true
from public.loads l
where l.load_number = 'STG-IB-OPEN-01'
  and not exists (
    select 1 from public.channels c where c.load_id = l.id
  );

-- ── Profile linking (run after creating test users in Supabase Auth) ──
-- Example: assign a staging test user to Staging Carrier Alpha
-- update public.profiles
-- set company_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', role = 'owner', full_name = 'Staging Owner'
-- where id = 'USER-UUID-FROM-AUTH';

comment on table public.companies is
  'Staging seed: 5 test companies covering all tiers, verification states, and fraud demo.';