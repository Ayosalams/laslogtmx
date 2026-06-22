-- =============================================================================
-- laslogTMX Carrier/Broker Verification + Rating System
-- Timestamp: 20240624000000
-- Purpose: Verified badges (manual + self-attested DOT/MC), post-load ratings,
--          fraud flag integration for company trust signals.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extend companies with verification + rating aggregates
-- -----------------------------------------------------------------------------
alter table public.companies
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'self_attested', 'admin_verified', 'flagged')),
  add column if not exists dot_mc_validated_at timestamptz,
  add column if not exists dot_mc_validation_status text not null default 'not_submitted'
    check (dot_mc_validation_status in ('not_submitted', 'valid', 'invalid_format')),
  add column if not exists verified_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists admin_verified_at timestamptz,
  add column if not exists is_fraud_flagged boolean not null default false,
  add column if not exists average_rating numeric(3, 2),
  add column if not exists rating_count integer not null default 0;

comment on column public.companies.verification_status is
  'Trust tier: unverified, self_attested (DOT/MC validated), admin_verified, or flagged.';
comment on column public.companies.is_fraud_flagged is
  'Set by admin; revokes load board access and surfaces fraud warning.';

create index if not exists idx_companies_verification_status
  on public.companies(verification_status)
  where verification_status in ('self_attested', 'admin_verified');

create index if not exists idx_companies_fraud_flagged
  on public.companies(is_fraud_flagged)
  where is_fraud_flagged = true;

-- -----------------------------------------------------------------------------
-- Extend fraud_flags for company-level fraud signals
-- -----------------------------------------------------------------------------
alter table public.fraud_flags
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists idx_fraud_flags_company_created
  on public.fraud_flags(company_id, created_at desc)
  where company_id is not null;

-- -----------------------------------------------------------------------------
-- company_ratings — one rating per load per rater company
-- -----------------------------------------------------------------------------
create table if not exists public.company_ratings (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  rater_company_id uuid not null references public.companies(id) on delete cascade,
  rated_company_id uuid not null references public.companies(id) on delete cascade,
  rater_profile_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint company_ratings_unique_per_load unique (load_id, rater_company_id),
  constraint company_ratings_no_self_rate check (rater_company_id <> rated_company_id)
);

create index if not exists idx_company_ratings_rated
  on public.company_ratings(rated_company_id, created_at desc);

comment on table public.company_ratings is
  'Post-load ratings between broker and carrier. One rating per load per rater company.';

alter table public.company_ratings enable row level security;

-- Ratings readable by verified load board participants (counterparty trust signals)
create policy "company_ratings_select_participants"
on public.company_ratings
for select
to authenticated
using (public.is_verified_load_board_participant());

-- Inserts only via security definer RPC
create policy "company_ratings_insert_rpc_only"
on public.company_ratings
for insert
to authenticated
with check (false);

-- -----------------------------------------------------------------------------
-- Cross-tenant read: verified company profiles on internal load board
-- -----------------------------------------------------------------------------
create policy "companies_select_load_board_peers"
on public.companies
for select
to authenticated
using (
  public.is_verified_load_board_participant()
  and is_laslog_verified = true
  and is_fraud_flagged = false
);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_admin_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.validate_dot_mc_format(
  p_dot_number text,
  p_mc_number text default null
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_dot text := regexp_replace(trim(coalesce(p_dot_number, '')), '[^0-9]', '', 'g');
  v_mc text := upper(regexp_replace(trim(coalesce(p_mc_number, '')), '[^A-Z0-9]', '', 'g'));
begin
  if v_dot = '' or length(v_dot) < 6 or length(v_dot) > 8 then
    return jsonb_build_object('valid', false, 'reason', 'invalid_dot_format');
  end if;

  if p_mc_number is not null and trim(p_mc_number) <> '' then
    if v_mc !~ '^MC[0-9]{5,7}$' then
      return jsonb_build_object('valid', false, 'reason', 'invalid_mc_format');
    end if;
  end if;

  return jsonb_build_object('valid', true, 'dot_normalized', v_dot, 'mc_normalized', v_mc);
end;
$$;

create or replace function public.refresh_company_rating_stats(p_company_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.companies c
  set
    average_rating = sub.avg_rating,
    rating_count = sub.cnt
  from (
    select
      rated_company_id,
      round(avg(rating)::numeric, 2) as avg_rating,
      count(*)::integer as cnt
    from public.company_ratings
    where rated_company_id = p_company_id
    group by rated_company_id
  ) sub
  where c.id = p_company_id;
$$;

-- -----------------------------------------------------------------------------
-- Self-attest DOT/MC (owner/dispatcher on own company)
-- -----------------------------------------------------------------------------
create or replace function public.self_attest_dot_mc(
  p_dot_number text,
  p_mc_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid := public.get_my_company_id();
  v_validation jsonb;
  v_dot text;
  v_mc text;
begin
  if v_company_id is null then
    return jsonb_build_object('success', false, 'error', 'no_company');
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.company_id = v_company_id
      and p.role in ('owner', 'dispatcher', 'admin')
  ) then
    return jsonb_build_object('success', false, 'error', 'insufficient_role');
  end if;

  v_validation := public.validate_dot_mc_format(p_dot_number, p_mc_number);
  if not (v_validation->>'valid')::boolean then
    update public.companies
    set dot_mc_validation_status = 'invalid_format'
    where id = v_company_id;

    return jsonb_build_object(
      'success', false,
      'error', v_validation->>'reason'
    );
  end if;

  v_dot := v_validation->>'dot_normalized';
  v_mc := nullif(v_validation->>'mc_normalized', '');

  -- DOT uniqueness check (exclude own company)
  if exists (
    select 1 from public.companies
    where dot_number = v_dot and id <> v_company_id
  ) then
    insert into public.fraud_flags (email, company_id, reason)
    select p.email, v_company_id, 'company_fraud:duplicate_dot'
    from public.profiles p where p.id = auth.uid();

    return jsonb_build_object('success', false, 'error', 'duplicate_dot');
  end if;

  update public.companies
  set
    dot_number = v_dot,
    mc_number = case when v_mc is not null then v_mc else mc_number end,
    dot_mc_validation_status = 'valid',
    dot_mc_validated_at = now(),
    verification_status = 'self_attested',
    is_laslog_verified = true,
    is_fraud_flagged = false
  where id = v_company_id;

  return jsonb_build_object(
    'success', true,
    'verification_status', 'self_attested',
    'is_laslog_verified', true
  );
end;
$$;

grant execute on function public.self_attest_dot_mc(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Admin verify / unverify company
-- -----------------------------------------------------------------------------
create or replace function public.admin_verify_company(
  p_company_id uuid,
  p_verified boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_profile() then
    return jsonb_build_object('success', false, 'error', 'admin_required');
  end if;

  if p_verified then
    update public.companies
    set
      verification_status = 'admin_verified',
      is_laslog_verified = true,
      is_fraud_flagged = false,
      admin_verified_at = now(),
      verified_by_profile_id = auth.uid()
    where id = p_company_id;
  else
    update public.companies
    set
      verification_status = 'unverified',
      is_laslog_verified = false,
      admin_verified_at = null,
      verified_by_profile_id = null
    where id = p_company_id;
  end if;

  return jsonb_build_object('success', true, 'verified', p_verified);
end;
$$;

grant execute on function public.admin_verify_company(uuid, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Admin flag company (fraud integration)
-- -----------------------------------------------------------------------------
create or replace function public.admin_flag_company(
  p_company_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text := trim(coalesce(p_reason, 'unspecified'));
begin
  if not public.is_admin_profile() then
    return jsonb_build_object('success', false, 'error', 'admin_required');
  end if;

  if v_reason = '' then
    v_reason := 'unspecified';
  end if;

  update public.companies
  set
    verification_status = 'flagged',
    is_fraud_flagged = true,
    is_laslog_verified = false
  where id = p_company_id;

  insert into public.fraud_flags (company_id, reason)
  values (p_company_id, 'company_flag:' || v_reason);

  return jsonb_build_object('success', true, 'flagged', true);
end;
$$;

grant execute on function public.admin_flag_company(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Close internal board load (enables rating)
-- -----------------------------------------------------------------------------
create or replace function public.close_load_board_load(p_load_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_load public.loads%rowtype;
begin
  select * into v_load from public.loads where id = p_load_id;

  if v_load.id is null then
    return jsonb_build_object('success', false, 'error', 'load_not_found');
  end if;

  if v_load.company_id <> public.get_my_company_id() then
    return jsonb_build_object('success', false, 'error', 'broker_only');
  end if;

  if not v_load.is_internal_board then
    return jsonb_build_object('success', false, 'error', 'not_internal_board');
  end if;

  update public.loads
  set board_status = 'closed', status = 'delivered'
  where id = p_load_id;

  return jsonb_build_object('success', true, 'board_status', 'closed');
end;
$$;

grant execute on function public.close_load_board_load(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Submit rating after load completion
-- -----------------------------------------------------------------------------
create or replace function public.submit_company_rating(
  p_load_id uuid,
  p_rating smallint,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rater_company uuid := public.get_my_company_id();
  v_load public.loads%rowtype;
  v_contract public.load_contracts%rowtype;
  v_rated_company uuid;
begin
  if v_rater_company is null then
    return jsonb_build_object('success', false, 'error', 'no_company');
  end if;

  if p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('success', false, 'error', 'invalid_rating');
  end if;

  select * into v_load from public.loads where id = p_load_id;
  if v_load.id is null or not v_load.is_internal_board then
    return jsonb_build_object('success', false, 'error', 'load_not_found');
  end if;

  if v_load.board_status not in ('closed', 'awarded') then
    return jsonb_build_object('success', false, 'error', 'load_not_complete');
  end if;

  select * into v_contract from public.load_contracts where load_id = p_load_id;
  if v_contract.id is null or v_contract.status not in ('signed', 'pending_signatures') then
    return jsonb_build_object('success', false, 'error', 'contract_required');
  end if;

  if v_rater_company = v_load.company_id then
    v_rated_company := v_contract.carrier_company_id;
  elsif v_rater_company = v_contract.carrier_company_id then
    v_rated_company := v_load.company_id;
  else
    return jsonb_build_object('success', false, 'error', 'not_participant');
  end if;

  insert into public.company_ratings (
    load_id, rater_company_id, rated_company_id, rater_profile_id, rating, comment
  )
  values (p_load_id, v_rater_company, v_rated_company, auth.uid(), p_rating, nullif(trim(p_comment), ''))
  on conflict (load_id, rater_company_id) do update
  set rating = excluded.rating, comment = excluded.comment;

  perform public.refresh_company_rating_stats(v_rated_company);

  return jsonb_build_object('success', true, 'rated_company_id', v_rated_company);
end;
$$;

grant execute on function public.submit_company_rating(uuid, smallint, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Public company profile (limited fields for load board / chat)
-- -----------------------------------------------------------------------------
create or replace function public.get_company_public_profile(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company public.companies%rowtype;
begin
  if not public.is_verified_load_board_participant() then
    return jsonb_build_object('error', 'access_denied');
  end if;

  select * into v_company from public.companies where id = p_company_id;
  if v_company.id is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  return jsonb_build_object(
    'id', v_company.id,
    'name', v_company.name,
    'company_type', v_company.company_type,
    'dot_number', v_company.dot_number,
    'mc_number', v_company.mc_number,
    'verification_status', v_company.verification_status,
    'is_laslog_verified', v_company.is_laslog_verified,
    'is_fraud_flagged', v_company.is_fraud_flagged,
    'dot_mc_validation_status', v_company.dot_mc_validation_status,
    'average_rating', v_company.average_rating,
    'rating_count', v_company.rating_count
  );
end;
$$;

grant execute on function public.get_company_public_profile(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Admin list all companies for verification dashboard
-- -----------------------------------------------------------------------------
create or replace function public.admin_list_companies_for_verification()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_profile() then
    return jsonb_build_object('error', 'admin_required');
  end if;

  return (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'dot_number', c.dot_number,
        'mc_number', c.mc_number,
        'company_type', c.company_type,
        'verification_status', c.verification_status,
        'is_laslog_verified', c.is_laslog_verified,
        'is_fraud_flagged', c.is_fraud_flagged,
        'average_rating', c.average_rating,
        'rating_count', c.rating_count
      ) order by c.name
    ), '[]'::jsonb)
    from public.companies c
  );
end;
$$;

grant execute on function public.admin_list_companies_for_verification() to authenticated;

-- Sync existing verified companies to self_attested for seed data
update public.companies
set
  verification_status = case
    when is_fraud_flagged then 'flagged'
    when is_laslog_verified then 'self_attested'
    else 'unverified'
  end,
  dot_mc_validation_status = case
    when dot_number is not null and is_laslog_verified then 'valid'
    else dot_mc_validation_status
  end
where verification_status = 'unverified' and is_laslog_verified = true;