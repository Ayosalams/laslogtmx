-- =============================================================================
-- laslogTMX Foundational Multi-Tenant Schema
-- Timestamp: 20240613000000
-- Purpose: Core multi-tenant foundation with strong company isolation via RLS.
-- Focus: Safety, scalability, and proper linkage to auth.users.
-- =============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- COMPANIES (Tenants)
-- =============================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dot_number text unique,                    -- Critical for MOTUS / FMCSA linking
  mc_number text,
  address text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companies is 'Tenant companies (carriers, brokers, 3PLs). DOT number is key for MOTUS/FMCSA integration.';

-- =============================================================================
-- PROFILES (Users linked to auth.users + company)
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  role text not null default 'driver' check (role in ('owner', 'dispatcher', 'driver', 'admin', 'accountant')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles. Always linked to auth.users. company_id provides the primary isolation boundary.';

-- Auto-create profile on new user signup (simple default - company claim happens later)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'driver');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- LOADS (Core TMS entity - basic version for foundation)
-- =============================================================================
create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  load_number text not null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled', 'issue')),
  origin text,
  destination text,
  pickup_date timestamptz,
  delivery_date timestamptz,
  driver_profile_id uuid references public.profiles(id),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_loads_company_load_number on public.loads(company_id, load_number);

comment on table public.loads is 'Basic load records. Strong company isolation enforced via RLS. Future: add more fields, stops, documents, etc.';

-- =============================================================================
-- UPDATED_AT TRIGGER (reusable)
-- =============================================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
create trigger update_companies_updated_at
  before update on public.companies
  for each row execute procedure public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger update_loads_updated_at
  before update on public.loads
  for each row execute procedure public.update_updated_at_column();

-- =============================================================================
-- INDEXES for performance & isolation queries
-- =============================================================================
create index if not exists idx_profiles_company on public.profiles(company_id);
create index if not exists idx_loads_company on public.loads(company_id);
create index if not exists idx_loads_status on public.loads(company_id, status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Company Isolation Foundation
-- =============================================================================

-- Enable RLS on all core tables
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.loads enable row level security;

-- Secure helper function to get current user's company (avoids JWT metadata leakage)
create or replace function public.get_my_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

comment on function public.get_my_company_id() is 'Security definer function. Returns the company_id of the currently authenticated user from profiles. Use this in all RLS policies for isolation.';

-- -----------------------------------------------------------------------------
-- COMPANIES RLS
-- -----------------------------------------------------------------------------
create policy "companies_select_own"
on public.companies
for select
to authenticated
using (id = public.get_my_company_id());

create policy "companies_update_own"
on public.companies
for update
to authenticated
using (id = public.get_my_company_id())
with check (id = public.get_my_company_id());

-- Only owners/admins can insert new companies (for now allow authenticated for signup flow)
create policy "companies_insert_authenticated"
on public.companies
for insert
to authenticated
with check (true);  -- Can be tightened later with role checks

-- -----------------------------------------------------------------------------
-- PROFILES RLS
-- -----------------------------------------------------------------------------
create policy "profiles_select_own_or_company"
on public.profiles
for select
to authenticated
using (
  id = auth.uid() 
  or company_id = public.get_my_company_id()
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Allow insert during signup trigger
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- LOADS RLS - Strict company isolation
-- -----------------------------------------------------------------------------
create policy "loads_select_own_company"
on public.loads
for select
to authenticated
using (company_id = public.get_my_company_id());

create policy "loads_insert_own_company"
on public.loads
for insert
to authenticated
with check (company_id = public.get_my_company_id());

create policy "loads_update_own_company"
on public.loads
for update
to authenticated
using (company_id = public.get_my_company_id())
with check (company_id = public.get_my_company_id());

create policy "loads_delete_own_company"
on public.loads
for delete
to authenticated
using (company_id = public.get_my_company_id());

-- =============================================================================
-- REALTIME PUBLICATION (for future live features)
-- =============================================================================
-- Supabase will handle this via dashboard or:
-- alter publication supabase_realtime add table public.loads, public.profiles; 
-- (run manually after migration if needed)

-- =============================================================================
-- COMMENTS FOR SCALABILITY
-- =============================================================================
comment on table public.profiles is 'Core user identity. Always 1:1 with auth.users. company_id is the tenant boundary.';
comment on table public.loads is 'Core operational entity. All future load-related tables (stops, documents, tracking) should have company_id + RLS.';
comment on policy "loads_select_own_company" on public.loads is 'Enforces strict multi-tenant isolation. Never bypass via service_role unless in trusted edge functions.';

-- End of foundation migration
