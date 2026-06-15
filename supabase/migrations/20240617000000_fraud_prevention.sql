-- =============================================================================
-- laslogTMX Fraud Prevention (lean rules for one-man shop)
-- Timestamp: 20240617000000
-- Purpose: Track signup risk signals, enforce velocity limits, flag abuse.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FRAUD FLAGS
-- -----------------------------------------------------------------------------
create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  email text,
  ip text,
  fingerprint text,
  reason text not null,
  created_at timestamptz not null default now()
);

comment on table public.fraud_flags is
  'Signup fraud signals and attempt log. reason=signup_attempt rows power velocity checks.';

create index if not exists idx_fraud_flags_email_created
  on public.fraud_flags (lower(email), created_at desc)
  where reason = 'signup_attempt';

create index if not exists idx_fraud_flags_ip_created
  on public.fraud_flags (ip, created_at desc)
  where reason = 'signup_attempt' and ip is not null;

create index if not exists idx_fraud_flags_fingerprint_created
  on public.fraud_flags (fingerprint, created_at desc)
  where reason = 'signup_attempt' and fingerprint is not null;

create index if not exists idx_fraud_flags_high_risk_created
  on public.fraud_flags (created_at desc)
  where reason like 'high_risk:%';

alter table public.fraud_flags enable row level security;

-- No direct client access; all writes go through security definer RPCs.
-- Service role / dashboard used for ops review.
create policy "fraud_flags_service_role_only"
on public.fraud_flags
for all
to authenticated, anon
using (false)
with check (false);

-- -----------------------------------------------------------------------------
-- HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.fraud_email_domain(p_email text)
returns text
language sql
immutable
as $$
  select lower(split_part(trim(p_email), '@', 2));
$$;

create or replace function public.fraud_is_disposable_email(p_email text)
returns boolean
language sql
immutable
as $$
  select public.fraud_email_domain(p_email) = any (array[
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamailblock.com',
    'tempmail.com',
    'throwaway.email',
    'yopmail.com',
    '10minutemail.com',
    'trashmail.com',
    'getnada.com',
    'sharklasers.com',
    'maildrop.cc',
    'dispostable.com',
    'fakeinbox.com',
    'mailnesia.com',
    'temp-mail.org',
    'emailondeck.com'
  ]);
$$;

create or replace function public.fraud_count_signups_today(
  p_email text default null,
  p_ip text default null,
  p_fingerprint text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.fraud_flags
  where reason = 'signup_attempt'
    and created_at >= now() - interval '24 hours'
    and (
      (p_email is not null and lower(email) = lower(trim(p_email)))
      or (p_ip is not null and ip = p_ip)
      or (p_fingerprint is not null and fingerprint = p_fingerprint)
    );
$$;

-- -----------------------------------------------------------------------------
-- RISK ASSESSMENT (callable by anon before signup)
-- Returns JSON: { allowed, risk_level, reasons, should_flag }
-- -----------------------------------------------------------------------------
create or replace function public.assess_signup_risk(
  p_email text,
  p_ip text default null,
  p_fingerprint text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_reasons text[] := '{}';
  v_risk_level text := 'low';
  v_allowed boolean := true;
  v_should_flag boolean := false;
  v_email_count integer;
  v_ip_count integer;
  v_fp_count integer;
begin
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object(
      'allowed', false,
      'risk_level', 'high',
      'reasons', array['invalid_email'],
      'should_flag', true
    );
  end if;

  select count(*)::integer into v_email_count
  from public.fraud_flags
  where reason = 'signup_attempt'
    and created_at >= now() - interval '24 hours'
    and lower(email) = v_email;

  if v_email_count >= 2 then
    v_allowed := false;
    v_risk_level := 'high';
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'velocity_exceeded:email');
  end if;

  if p_ip is not null and p_ip <> '' and p_ip <> 'unknown' then
    select count(*)::integer into v_ip_count
    from public.fraud_flags
    where reason = 'signup_attempt'
      and created_at >= now() - interval '24 hours'
      and ip = p_ip;

    if v_ip_count >= 2 then
      v_allowed := false;
      v_risk_level := 'high';
      v_should_flag := true;
      v_reasons := array_append(v_reasons, 'velocity_exceeded:ip');
    end if;
  end if;

  if p_fingerprint is not null and p_fingerprint <> '' then
    select count(*)::integer into v_fp_count
    from public.fraud_flags
    where reason = 'signup_attempt'
      and created_at >= now() - interval '24 hours'
      and fingerprint = p_fingerprint;

    if v_fp_count >= 2 then
      v_allowed := false;
      v_risk_level := 'high';
      v_should_flag := true;
      v_reasons := array_append(v_reasons, 'velocity_exceeded:fingerprint');
    end if;
  end if;

  if public.fraud_is_disposable_email(v_email) then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'disposable_email');
    if v_risk_level = 'low' then
      v_risk_level := 'high';
    end if;
  end if;

  -- Obvious throwaway local-part patterns
  if v_email ~ '^(test|temp|fake|spam|abuse|admin|noreply)\+?[0-9]*@' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'suspicious_local_part');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  end if;

  -- Plus-alias farming (e.g. user+1@, user+2@)
  if v_email ~ '\+[0-9]{2,}@' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'plus_alias_pattern');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'risk_level', v_risk_level,
    'reasons', v_reasons,
    'should_flag', v_should_flag
  );
end;
$$;

comment on function public.assess_signup_risk is
  'Pre-signup risk gate. Blocks when velocity >= 2 per email/IP/fingerprint in 24h. Flags disposable/suspicious emails.';

grant execute on function public.assess_signup_risk(text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RECORD SIGNUP ATTEMPT + HIGH-RISK FLAGS (callable by anon after signup)
-- -----------------------------------------------------------------------------
create or replace function public.record_signup_fraud(
  p_email text,
  p_ip text default null,
  p_fingerprint text default null,
  p_risk_level text default 'low',
  p_reasons text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_reason text;
begin
  insert into public.fraud_flags (email, ip, fingerprint, reason)
  values (v_email, nullif(trim(p_ip), ''), nullif(trim(p_fingerprint), ''), 'signup_attempt');

  if p_risk_level in ('medium', 'high') or coalesce(array_length(p_reasons, 1), 0) > 0 then
    foreach v_reason in array coalesce(p_reasons, '{}')
    loop
      if v_reason not like 'velocity_exceeded:%' then
        insert into public.fraud_flags (email, ip, fingerprint, reason)
        values (v_email, nullif(trim(p_ip), ''), nullif(trim(p_fingerprint), ''), 'high_risk:' || v_reason);
      end if;
    end loop;

    if p_risk_level = 'high' and coalesce(array_length(p_reasons, 1), 0) = 0 then
      insert into public.fraud_flags (email, ip, fingerprint, reason)
      values (v_email, nullif(trim(p_ip), ''), nullif(trim(p_fingerprint), ''), 'high_risk:elevated');
    end if;
  end if;
end;
$$;

comment on function public.record_signup_fraud is
  'Logs every signup attempt and inserts high_risk:* rows for manual review / Make.com alerts.';

grant execute on function public.record_signup_fraud(text, text, text, text, text[]) to anon, authenticated;