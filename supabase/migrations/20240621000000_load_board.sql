-- =============================================================================
-- laslogTMX Internal Load Board + Bidding + Contracts
-- Timestamp: 20240621000000
-- Purpose: Internal-only load board for verified carriers and brokers.
--          Strong company_id + RLS isolation with controlled cross-tenant read
--          for open internal board listings only.
-- Idempotent: safe to re-run — DROP POLICY/TRIGGER before CREATE, IF NOT EXISTS
--             on tables/indexes, CREATE OR REPLACE on functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Company verification + type (for internal load board access)
-- -----------------------------------------------------------------------------
alter table public.companies
  add column if not exists is_laslog_verified boolean not null default false,
  add column if not exists company_type text not null default 'carrier'
    check (company_type in ('carrier', 'broker', 'mixed'));

comment on column public.companies.is_laslog_verified is
  'laslogTMX Verified flag. Required for internal load board access.';
comment on column public.companies.company_type is
  'Primary company role: carrier, broker, or mixed. Brokers may post loads; carriers may bid.';

create index if not exists idx_companies_verified
  on public.companies(is_laslog_verified)
  where is_laslog_verified = true;

-- -----------------------------------------------------------------------------
-- Extend loads for internal board postings
-- -----------------------------------------------------------------------------
alter table public.loads
  add column if not exists is_internal_board boolean not null default false,
  add column if not exists board_status text not null default 'open'
    check (board_status in ('draft', 'open', 'bidding', 'negotiating', 'awarded', 'closed', 'cancelled')),
  add column if not exists is_laslog_verified boolean not null default true,
  add column if not exists equipment text,
  add column if not exists rate_cents integer,
  add column if not exists weight_lbs integer,
  add column if not exists commodity text,
  add column if not exists negotiation_channel_id uuid references public.channels(id) on delete set null;

comment on column public.loads.is_internal_board is
  'True when posted to the internal laslogTMX load board (not operational TMS-only).';
comment on column public.loads.board_status is
  'Internal board lifecycle. Operational loads ignore this when is_internal_board=false.';
comment on column public.loads.is_laslog_verified is
  'laslogTMX Verified badge on internal board loads. Always true for board posts.';

create index if not exists idx_loads_internal_board_open
  on public.loads(board_status, created_at desc)
  where is_internal_board = true and board_status in ('open', 'bidding', 'negotiating');

-- -----------------------------------------------------------------------------
-- load_bids
-- -----------------------------------------------------------------------------
create table if not exists public.load_bids (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  bidder_profile_id uuid not null references public.profiles(id),
  rate_cents integer not null check (rate_cents > 0),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'countered', 'accepted', 'rejected', 'withdrawn')),
  negotiation_channel_id uuid references public.channels(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_load_bids_load on public.load_bids(load_id, created_at desc);
create index if not exists idx_load_bids_company on public.load_bids(company_id);
create unique index if not exists idx_load_bids_load_company_active
  on public.load_bids(load_id, company_id)
  where status in ('pending', 'countered', 'accepted');

drop trigger if exists update_load_bids_updated_at on public.load_bids;
create trigger update_load_bids_updated_at
  before update on public.load_bids
  for each row execute procedure public.update_updated_at_column();

comment on table public.load_bids is
  'Carrier bids on internal board loads. company_id is the bidding carrier tenant.';

-- -----------------------------------------------------------------------------
-- load_contracts
-- -----------------------------------------------------------------------------
create table if not exists public.load_contracts (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  bid_id uuid not null references public.load_bids(id) on delete restrict,
  broker_company_id uuid not null references public.companies(id) on delete cascade,
  carrier_company_id uuid not null references public.companies(id) on delete cascade,
  contract_number text not null,
  agreed_rate_cents integer not null check (agreed_rate_cents > 0),
  contract_body text not null,
  pdf_storage_path text,
  status text not null default 'pending_signatures'
    check (status in ('draft', 'pending_signatures', 'signed', 'void')),
  broker_signed_at timestamptz,
  carrier_signed_at timestamptz,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_load_contracts_load on public.load_contracts(load_id);
create unique index if not exists idx_load_contracts_number on public.load_contracts(contract_number);

drop trigger if exists update_load_contracts_updated_at on public.load_contracts;
create trigger update_load_contracts_updated_at
  before update on public.load_contracts
  for each row execute procedure public.update_updated_at_column();

comment on table public.load_contracts is
  'Auto-generated contracts when broker and carrier agree on a bid. PDF stored in Supabase Storage.';

-- -----------------------------------------------------------------------------
-- Access helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_verified_load_board_participant()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies c
    join public.profiles p on p.company_id = c.id
    where p.id = auth.uid()
      and c.is_active = true
      and c.is_laslog_verified = true
      and c.subscription_tier in ('pro', 'pro_broker', 'enterprise')
  );
$$;

create or replace function public.is_broker_company()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies c
    join public.profiles p on p.company_id = c.id
    where p.id = auth.uid()
      and c.company_type in ('broker', 'mixed')
      and c.subscription_tier in ('pro_broker', 'enterprise')
      and c.is_laslog_verified = true
  );
$$;

create or replace function public.is_carrier_company()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies c
    join public.profiles p on p.company_id = c.id
    where p.id = auth.uid()
      and c.company_type in ('carrier', 'mixed')
      and c.subscription_tier in ('pro', 'pro_broker', 'enterprise')
      and c.is_laslog_verified = true
  );
$$;

-- -----------------------------------------------------------------------------
-- RLS: loads (replace strict-only policy with internal board cross-read)
-- -----------------------------------------------------------------------------
drop policy if exists "loads_select_own_company" on public.loads;
drop policy if exists "loads_insert_own_company" on public.loads;
drop policy if exists "loads_select_company_or_internal_board" on public.loads;
drop policy if exists "loads_insert_internal_board_broker" on public.loads;

create policy "loads_select_company_or_internal_board"
on public.loads
for select
to authenticated
using (
  company_id = public.get_my_company_id()
  or (
    is_internal_board = true
    and board_status in ('open', 'bidding', 'negotiating', 'awarded')
    and public.is_verified_load_board_participant()
  )
);

create policy "loads_insert_internal_board_broker"
on public.loads
for insert
to authenticated
with check (
  company_id = public.get_my_company_id()
  and (
    is_internal_board = false
    or (
      is_internal_board = true
      and public.is_broker_company()
      and is_laslog_verified = true
    )
  )
);

-- Keep update/delete for own company only (existing policies remain)

-- -----------------------------------------------------------------------------
-- RLS: load_bids
-- -----------------------------------------------------------------------------
alter table public.load_bids enable row level security;
alter table public.load_contracts enable row level security;

drop policy if exists "load_bids_select_participant" on public.load_bids;
create policy "load_bids_select_participant"
on public.load_bids
for select
to authenticated
using (
  company_id = public.get_my_company_id()
  or exists (
    select 1 from public.loads l
    where l.id = load_bids.load_id
      and l.company_id = public.get_my_company_id()
  )
);

drop policy if exists "load_bids_insert_carrier" on public.load_bids;
create policy "load_bids_insert_carrier"
on public.load_bids
for insert
to authenticated
with check (
  company_id = public.get_my_company_id()
  and bidder_profile_id = auth.uid()
  and public.is_carrier_company()
  and exists (
    select 1 from public.loads l
    where l.id = load_bids.load_id
      and l.is_internal_board = true
      and l.board_status in ('open', 'bidding')
      and l.company_id <> public.get_my_company_id()
  )
);

drop policy if exists "load_bids_update_participant" on public.load_bids;
create policy "load_bids_update_participant"
on public.load_bids
for update
to authenticated
using (
  company_id = public.get_my_company_id()
  or exists (
    select 1 from public.loads l
    where l.id = load_bids.load_id
      and l.company_id = public.get_my_company_id()
  )
)
with check (
  company_id = public.get_my_company_id()
  or exists (
    select 1 from public.loads l
    where l.id = load_bids.load_id
      and l.company_id = public.get_my_company_id()
  )
);

-- -----------------------------------------------------------------------------
-- RLS: load_contracts (broker + carrier parties only)
-- -----------------------------------------------------------------------------
drop policy if exists "load_contracts_select_parties" on public.load_contracts;
create policy "load_contracts_select_parties"
on public.load_contracts
for select
to authenticated
using (
  broker_company_id = public.get_my_company_id()
  or carrier_company_id = public.get_my_company_id()
);

drop policy if exists "load_contracts_insert_parties" on public.load_contracts;
create policy "load_contracts_insert_parties"
on public.load_contracts
for insert
to authenticated
with check (
  broker_company_id = public.get_my_company_id()
  or carrier_company_id = public.get_my_company_id()
);

drop policy if exists "load_contracts_update_parties" on public.load_contracts;
create policy "load_contracts_update_parties"
on public.load_contracts
for update
to authenticated
using (
  broker_company_id = public.get_my_company_id()
  or carrier_company_id = public.get_my_company_id()
)
with check (
  broker_company_id = public.get_my_company_id()
  or carrier_company_id = public.get_my_company_id()
);

-- -----------------------------------------------------------------------------
-- RPC: Generate contract when both parties agree
-- -----------------------------------------------------------------------------
create or replace function public.generate_load_contract(p_bid_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.load_bids%rowtype;
  v_load public.loads%rowtype;
  v_broker public.companies%rowtype;
  v_carrier public.companies%rowtype;
  v_contract_id uuid;
  v_contract_number text;
  v_body text;
begin
  if not public.is_verified_load_board_participant() then
    raise exception 'Not authorized for load board contracts';
  end if;

  select * into v_bid from public.load_bids where id = p_bid_id;
  if not found then
    raise exception 'Bid not found';
  end if;

  if v_bid.status <> 'accepted' then
    raise exception 'Bid must be accepted before generating contract';
  end if;

  select * into v_load from public.loads where id = v_bid.load_id;
  select * into v_broker from public.companies where id = v_load.company_id;
  select * into v_carrier from public.companies where id = v_bid.company_id;

  if public.get_my_company_id() not in (v_load.company_id, v_bid.company_id) then
    raise exception 'Only load parties may generate contract';
  end if;

  v_contract_number := 'LBC-' || upper(substr(replace(v_load.id::text, '-', ''), 1, 8)) || '-' || to_char(now(), 'YYYYMMDD');

  v_body := format(
    E'laslogTMX INTERNAL FREIGHT CONTRACT\n' ||
    E'Contract Number: %s\n' ||
    E'Generated: %s UTC\n\n' ||
    E'BROKER: %s (DOT %s)\n' ||
    E'CARRIER: %s (DOT %s)\n\n' ||
    E'LOAD: %s\n' ||
    E'Origin: %s\n' ||
    E'Destination: %s\n' ||
    E'Equipment: %s\n' ||
    E'Commodity: %s\n' ||
    E'Pickup: %s\n' ||
    E'Delivery: %s\n' ||
    E'Agreed Rate: $%s\n\n' ||
    E'TERMS:\n' ||
    E'1. This is an internal laslogTMX Verified load contract.\n' ||
    E'2. Carrier agrees to transport per agreed rate and schedule.\n' ||
    E'3. Broker agrees to remit payment per standard laslogTMX terms.\n' ||
    E'4. Disputes resolved via laslogTMX internal mediation.\n\n' ||
    E'E-SIGNATURE PLACEHOLDERS:\n' ||
    E'Broker Signature: _________________________  Date: __________\n' ||
    E'Carrier Signature: _________________________  Date: __________\n',
    v_contract_number,
    to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI'),
    v_broker.name, coalesce(v_broker.dot_number, 'N/A'),
    v_carrier.name, coalesce(v_carrier.dot_number, 'N/A'),
    v_load.load_number,
    coalesce(v_load.origin, 'TBD'),
    coalesce(v_load.destination, 'TBD'),
    coalesce(v_load.equipment, 'TBD'),
    coalesce(v_load.commodity, 'General Freight'),
    coalesce(to_char(v_load.pickup_date at time zone 'UTC', 'YYYY-MM-DD HH24:MI'), 'TBD'),
    coalesce(to_char(v_load.delivery_date at time zone 'UTC', 'YYYY-MM-DD HH24:MI'), 'TBD'),
    (v_bid.rate_cents::numeric / 100)::text
  );

  insert into public.load_contracts (
    load_id, bid_id, broker_company_id, carrier_company_id,
    contract_number, agreed_rate_cents, contract_body, status
  )
  values (
    v_load.id, v_bid.id, v_load.company_id, v_bid.company_id,
    v_contract_number, v_bid.rate_cents, v_body, 'pending_signatures'
  )
  on conflict (load_id) do update set
    contract_body = excluded.contract_body,
    agreed_rate_cents = excluded.agreed_rate_cents,
    status = 'pending_signatures',
    updated_at = now()
  returning id into v_contract_id;

  update public.loads
  set board_status = 'awarded', status = 'assigned', updated_at = now()
  where id = v_load.id;

  return v_contract_id;
end;
$$;

comment on function public.generate_load_contract(uuid) is
  'Creates or refreshes a load contract when bid is accepted and both parties agree.';

-- Allow verified participants to create load-specific negotiation channels (cross-company)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'channels'
  ) THEN
    DROP POLICY IF EXISTS "channels_insert_load_negotiation" ON public.channels;

    CREATE POLICY "channels_insert_load_negotiation"
    ON public.channels
    FOR INSERT
    TO authenticated
    WITH CHECK (
      load_id IS NOT NULL
      AND public.is_verified_load_board_participant()
    );
  END IF;
END $$;

-- End of load board migration