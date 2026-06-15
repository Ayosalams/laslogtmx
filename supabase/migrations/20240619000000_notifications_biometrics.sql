-- =============================================================================
-- laslogTMX Smart Notifications + Biometric Fraud Signals
-- Timestamp: 20240619000000
-- Purpose: In-app/push notifications with user preferences, company isolation,
--          and biometric success/failure in signup risk assessment.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NOTIFICATION SETTINGS (per user, company-scoped via RLS)
-- -----------------------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  preferred_cities text[] not null default '{}',
  enabled_types jsonb not null default '{
    "load_match": true,
    "chat_message": true,
    "load_status": true,
    "motus_update": true,
    "cble_material": true
  }'::jsonb,
  quiet_hours_start time,
  quiet_hours_end time,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notification_settings is
  'Per-user notification preferences. preferred_cities powers load_match alerts. quiet_hours suppresses non-urgent pushes.';

drop trigger if exists update_notification_settings_updated_at on public.notification_settings;
create trigger update_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute procedure public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- IN-APP NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in (
    'load_match', 'chat_message', 'load_status', 'motus_update', 'cble_material'
  )),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_company
  on public.notifications (company_id, created_at desc);

comment on table public.notifications is
  'In-app notification inbox. Company-isolated via RLS. Push delivery uses push_subscriptions.';

-- -----------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS (Expo + Web Push)
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  platform text not null check (platform in ('expo', 'web')),
  token text not null,
  endpoint text,
  p256dh text,
  auth_key text,
  device_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, token)
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Device push tokens. Expo uses token column; Web Push uses endpoint + p256dh + auth_key.';

drop trigger if exists update_push_subscriptions_updated_at on public.push_subscriptions;
create trigger update_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute procedure public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- MOTUS + CBLE tables for smart notification triggers
-- -----------------------------------------------------------------------------
create table if not exists public.motus_submissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  dot_number text not null,
  submission_type text not null,
  file_name text,
  status text not null default 'Pending' check (status in (
    'Pending', 'Under Review', 'Approved', 'Rejected', 'Needs Additional Info'
  )),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_motus_submissions_updated_at on public.motus_submissions;
create trigger update_motus_submissions_updated_at
  before update on public.motus_submissions
  for each row execute procedure public.update_updated_at_column();

create table if not exists public.cble_materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  category text,
  material_type text check (material_type in ('podcast', 'video', 'pdf')),
  is_global boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.cble_materials is
  'CBLE library items. is_global=true notifies all companies with cble_material enabled.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.motus_submissions enable row level security;
alter table public.cble_materials enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
on public.notification_settings for select to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
on public.notification_settings for insert to authenticated
with check (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
on public.notification_settings for update to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id())
with check (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "notifications_select_own_company" on public.notifications;
create policy "notifications_select_own_company"
on public.notifications for select to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id())
with check (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions for select to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "push_subscriptions_upsert_own" on public.push_subscriptions;
create policy "push_subscriptions_upsert_own"
on public.push_subscriptions for insert to authenticated
with check (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions for update to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id())
with check (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
on public.push_subscriptions for delete to authenticated
using (user_id = auth.uid() and company_id = public.get_my_company_id());

drop policy if exists "motus_submissions_select_company" on public.motus_submissions;
create policy "motus_submissions_select_company"
on public.motus_submissions for select to authenticated
using (company_id = public.get_my_company_id());

drop policy if exists "motus_submissions_insert_company" on public.motus_submissions;
create policy "motus_submissions_insert_company"
on public.motus_submissions for insert to authenticated
with check (company_id = public.get_my_company_id() and submitted_by = auth.uid());

drop policy if exists "motus_submissions_update_company" on public.motus_submissions;
create policy "motus_submissions_update_company"
on public.motus_submissions for update to authenticated
using (company_id = public.get_my_company_id())
with check (company_id = public.get_my_company_id());

drop policy if exists "cble_materials_select_authenticated" on public.cble_materials;
create policy "cble_materials_select_authenticated"
on public.cble_materials for select to authenticated
using (is_global = true or company_id = public.get_my_company_id());

-- -----------------------------------------------------------------------------
-- SMART NOTIFICATION HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.is_in_quiet_hours(
  p_start time,
  p_end time,
  p_now time default localtime
)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_start is null or p_end is null then
    return false;
  end if;
  if p_start < p_end then
    return p_now >= p_start and p_now < p_end;
  else
    return p_now >= p_start or p_now < p_end;
  end if;
end;
$$;

create or replace function public.should_notify_user(
  p_user_id uuid,
  p_type text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings public.notification_settings%rowtype;
begin
  select * into v_settings
  from public.notification_settings
  where user_id = p_user_id;

  if not found then
    return true;
  end if;

  if coalesce((v_settings.enabled_types ->> p_type)::boolean, true) = false then
    return false;
  end if;

  if public.is_in_quiet_hours(v_settings.quiet_hours_start, v_settings.quiet_hours_end) then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_company_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_company_id is null or p_user_id is null then
    return null;
  end if;

  if not public.should_notify_user(p_user_id, p_type) then
    return null;
  end if;

  insert into public.notifications (user_id, company_id, type, title, body, data)
  values (p_user_id, p_company_id, p_type, p_title, p_body, p_data)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.enqueue_notification is
  'Inserts in-app notification if user preferences allow. Respects quiet hours and type toggles.';

grant execute on function public.enqueue_notification(uuid, uuid, text, text, text, jsonb) to authenticated;

-- Notify all company members except excluded user
create or replace function public.notify_company_members(
  p_company_id uuid,
  p_exclude_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  for v_profile in
    select id from public.profiles
    where company_id = p_company_id
      and id <> coalesce(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  loop
    perform public.enqueue_notification(
      v_profile.id, p_company_id, p_type, p_title, p_body, p_data
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- TRIGGERS: chat message, load status, load match, motus, cble
-- -----------------------------------------------------------------------------
create or replace function public.trg_notify_new_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel public.channels%rowtype;
  v_sender_name text;
begin
  select * into v_channel from public.channels where id = new.channel_id;
  if not found or v_channel.company_id is null then
    return new;
  end if;

  select coalesce(full_name, 'Team member') into v_sender_name
  from public.profiles where id = new.user_id;

  perform public.notify_company_members(
    v_channel.company_id,
    new.user_id,
    'chat_message',
    'New message in ' || v_channel.name,
    left(new.content, 120),
    jsonb_build_object('channel_id', new.channel_id, 'message_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row
  when (new.is_system is distinct from true)
  execute procedure public.trg_notify_new_chat_message();

create or replace function public.trg_notify_load_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    perform public.notify_company_members(
      new.company_id,
      null,
      'load_status',
      'Load ' || new.load_number || ' updated',
      'Status changed to ' || new.status,
      jsonb_build_object('load_id', new.id, 'load_number', new.load_number, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_load_status_notify on public.loads;
create trigger on_load_status_notify
  after update on public.loads
  for each row execute procedure public.trg_notify_load_status_change();

create or replace function public.trg_notify_load_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_city text;
  v_origin_lower text;
  v_dest_lower text;
begin
  v_origin_lower := lower(coalesce(new.origin, ''));
  v_dest_lower := lower(coalesce(new.destination, ''));

  for v_profile in
    select ns.user_id, ns.preferred_cities
    from public.notification_settings ns
    where ns.company_id = new.company_id
      and coalesce((ns.enabled_types ->> 'load_match')::boolean, true) = true
      and cardinality(ns.preferred_cities) > 0
  loop
    foreach v_city in array v_profile.preferred_cities
    loop
      if v_origin_lower like '%' || lower(v_city) || '%'
         or v_dest_lower like '%' || lower(v_city) || '%' then
        perform public.enqueue_notification(
          v_profile.user_id,
          new.company_id,
          'load_match',
          'Load match: ' || new.load_number,
          coalesce(new.origin, 'TBD') || ' → ' || coalesce(new.destination, 'TBD'),
          jsonb_build_object('load_id', new.id, 'load_number', new.load_number, 'matched_city', v_city)
        );
        exit;
      end if;
    end loop;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_load_match_notify on public.loads;
create trigger on_load_match_notify
  after insert on public.loads
  for each row execute procedure public.trg_notify_load_match();

create or replace function public.trg_notify_motus_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_company_members(
      new.company_id,
      new.submitted_by,
      'motus_update',
      'MOTUS submission received',
      new.submission_type || ' for DOT ' || new.dot_number,
      jsonb_build_object('submission_id', new.id, 'status', new.status)
    );
  elsif old.status is distinct from new.status then
    perform public.notify_company_members(
      new.company_id,
      null,
      'motus_update',
      'MOTUS status: ' || new.status,
      new.submission_type || ' (DOT ' || new.dot_number || ')',
      jsonb_build_object('submission_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_motus_notify on public.motus_submissions;
create trigger on_motus_notify
  after insert or update on public.motus_submissions
  for each row execute procedure public.trg_notify_motus_update();

create or replace function public.trg_notify_cble_material()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  for v_profile in
    select p.id, p.company_id
    from public.profiles p
    where p.company_id is not null
      and (new.is_global = true or p.company_id = new.company_id)
  loop
    perform public.enqueue_notification(
      v_profile.id,
      v_profile.company_id,
      'cble_material',
      'New CBLE material',
      new.title,
      jsonb_build_object('material_id', new.id, 'category', new.category)
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_cble_material_notify on public.cble_materials;
create trigger on_cble_material_notify
  after insert on public.cble_materials
  for each row execute procedure public.trg_notify_cble_material();

-- -----------------------------------------------------------------------------
-- BIOMETRIC FRAUD SIGNALS (extend assess_signup_risk + record_signup_fraud)
-- -----------------------------------------------------------------------------
create or replace function public.assess_signup_risk(
  p_email text,
  p_ip text default null,
  p_fingerprint text default null,
  p_biometric_status text default null
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

  if v_email ~ '^(test|temp|fake|spam|abuse|admin|noreply)\+?[0-9]*@' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'suspicious_local_part');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  end if;

  if v_email ~ '\+[0-9]{2,}@' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'plus_alias_pattern');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  end if;

  -- Biometric signals
  if p_biometric_status = 'failure' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'biometric_failed');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  elsif p_biometric_status = 'cancelled' then
    v_should_flag := true;
    v_reasons := array_append(v_reasons, 'biometric_cancelled');
    if v_risk_level = 'low' then
      v_risk_level := 'medium';
    end if;
  elsif p_biometric_status = 'unavailable' or p_biometric_status = 'skipped' then
    v_reasons := array_append(v_reasons, 'biometric_skipped');
  elsif p_biometric_status = 'success' then
    v_reasons := array_append(v_reasons, 'biometric_verified');
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'risk_level', v_risk_level,
    'reasons', v_reasons,
    'should_flag', v_should_flag
  );
end;
$$;

create or replace function public.record_signup_fraud(
  p_email text,
  p_ip text default null,
  p_fingerprint text default null,
  p_risk_level text default 'low',
  p_reasons text[] default '{}',
  p_biometric_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_reason text;
  v_fp_reason text;
begin
  insert into public.fraud_flags (email, ip, fingerprint, reason)
  values (
    v_email,
    nullif(trim(p_ip), ''),
    nullif(trim(p_fingerprint), ''),
    'signup_attempt'
  );

  if p_biometric_status is not null and p_biometric_status <> '' then
    v_fp_reason := case p_biometric_status
      when 'success' then 'biometric:success'
      when 'failure' then 'biometric:failure'
      when 'cancelled' then 'biometric:cancelled'
      else 'biometric:' || p_biometric_status
    end;
    insert into public.fraud_flags (email, ip, fingerprint, reason)
    values (v_email, nullif(trim(p_ip), ''), nullif(trim(p_fingerprint), ''), v_fp_reason);
  end if;

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

grant execute on function public.assess_signup_risk(text, text, text, text) to anon, authenticated;
grant execute on function public.record_signup_fraud(text, text, text, text, text[], text) to anon, authenticated;

-- Default notification settings when user joins a company
create or replace function public.ensure_notification_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.company_id is not null and (old.company_id is distinct from new.company_id) then
    insert into public.notification_settings (user_id, company_id)
    values (new.id, new.company_id)
    on conflict (user_id) do update
      set company_id = excluded.company_id,
          updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_notification_settings on public.profiles;
create trigger on_profile_notification_settings
  after insert or update of company_id on public.profiles
  for each row execute procedure public.ensure_notification_settings();