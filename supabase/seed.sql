-- =============================================================================
-- laslogTMX Basic Seed Data
-- Run after migrations. Safe to re-run (uses on conflict do nothing where possible).
-- =============================================================================

-- Sample Companies (carriers / brokers)
insert into public.companies (id, name, dot_number, mc_number, is_active, subscription_tier, billing_interval)
values 
  ('11111111-1111-1111-1111-111111111111', 'ACME Freight LLC', '1234567', 'MC-123456', true, 'pro', 'monthly'),
  ('22222222-2222-2222-2222-222222222222', 'Midwest Customs Brokers', '9876543', 'MC-987654', true, 'pro_broker', 'yearly'),
  ('33333333-3333-3333-3333-333333333333', 'Pacific Haulers Co', '5555555', 'MC-555555', true, 'starter', 'monthly')
on conflict (id) do update set
  subscription_tier = excluded.subscription_tier,
  billing_interval = excluded.billing_interval;

-- Note on Profiles:
-- Profiles are automatically created via the handle_new_user() trigger when a user signs up through Supabase Auth.
-- After a user signs up, you can manually assign them to a company like this (for testing):
--
-- update public.profiles 
-- set company_id = '11111111-1111-1111-1111-111111111111', role = 'owner', full_name = 'John Owner'
-- where id = 'USER-UUID-HERE';
--
-- Or create test users in the Supabase Auth UI and link them here.

-- Sample Loads (for the first company)
insert into public.loads (company_id, load_number, status, origin, destination, pickup_date, delivery_date)
values 
  ('11111111-1111-1111-1111-111111111111', 'L-4821', 'pending', 'Chicago, IL', 'Atlanta, GA', now() + interval '1 day', now() + interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'L-4822', 'in_transit', 'Dallas, TX', 'Houston, TX', now() - interval '1 day', now() + interval '1 day')
on conflict do nothing;

-- Sample Channels (company + load-specific) - will be created by the app or manually
insert into public.channels (name, company_id, load_id, is_active)
values 
  ('ACME Company Operations', '11111111-1111-1111-1111-111111111111', null, true),
  ('Load L-4821 - Chicago to Atlanta', null, 'L-4821', true),
  ('Midwest Logistics - Dispatch', '22222222-2222-2222-2222-222222222222', null, true)
on conflict do nothing;

-- Note: Message seed data is usually created through the application.
-- Example (once you have real user UUIDs):
-- insert into public.messages (channel_id, user_id, content) values (...);

comment on table public.companies is 'Seeded with example carriers for development and testing.';
