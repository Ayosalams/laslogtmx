-- =============================================================================
-- laslogTMX Smart Load Matching Notifications
-- Timestamp: 20240623000000
-- Purpose: Preferred cities/routes, rate alerts, internal board cross-tenant
--          matching, and external load ingestion (Make.com placeholder).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extend notification_settings for smart load matching
-- -----------------------------------------------------------------------------
alter table public.notification_settings
  add column if not exists preferred_routes jsonb not null default '[]'::jsonb,
  add column if not exists min_rate_cents integer check (min_rate_cents is null or min_rate_cents > 0),
  add column if not exists rate_alert_enabled boolean not null default false,
  add column if not exists external_loads_enabled boolean not null default false;

comment on column public.notification_settings.preferred_routes is
  'JSON array of {origin, destination} lane pairs for route-based load match alerts.';
comment on column public.notification_settings.min_rate_cents is
  'Minimum rate threshold (cents). Used when rate_alert_enabled is true.';
comment on column public.notification_settings.rate_alert_enabled is
  'When true, alert on loads meeting or exceeding min_rate_cents.';
comment on column public.notification_settings.external_loads_enabled is
  'When true, user receives alerts from external load feeds via Make.com webhook.';

-- -----------------------------------------------------------------------------
-- Helper: evaluate whether a load matches user preferences
-- -----------------------------------------------------------------------------
create or replace function public.load_matches_preferences(
  p_origin text,
  p_destination text,
  p_rate_cents integer,
  p_preferred_cities text[],
  p_preferred_routes jsonb,
  p_min_rate_cents integer,
  p_rate_alert_enabled boolean
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_origin_lower text := lower(coalesce(p_origin, ''));
  v_dest_lower text := lower(coalesce(p_destination, ''));
  v_city text;
  v_route jsonb;
  v_matched boolean := false;
  v_reason text := null;
  v_rate_ok boolean := false;
begin
  if cardinality(coalesce(p_preferred_cities, '{}')) > 0 then
    foreach v_city in array p_preferred_cities
    loop
      if v_origin_lower like '%' || lower(v_city) || '%'
         or v_dest_lower like '%' || lower(v_city) || '%' then
        v_matched := true;
        v_reason := 'city';
        exit;
      end if;
    end loop;
  end if;

  if not v_matched and coalesce(jsonb_array_length(p_preferred_routes), 0) > 0 then
    for v_route in select * from jsonb_array_elements(p_preferred_routes)
    loop
      if v_origin_lower like '%' || lower(coalesce(v_route->>'origin', '')) || '%'
         and v_dest_lower like '%' || lower(coalesce(v_route->>'destination', '')) || '%' then
        v_matched := true;
        v_reason := 'route';
        exit;
      end if;
    end loop;
  end if;

  if coalesce(p_rate_alert_enabled, false)
     and p_min_rate_cents is not null
     and coalesce(p_rate_cents, 0) >= p_min_rate_cents then
    v_rate_ok := true;
    if not v_matched then
      v_matched := true;
      v_reason := 'rate';
    end if;
  end if;

  return jsonb_build_object(
    'matched', v_matched,
    'match_reason', v_reason,
    'rate_ok', v_rate_ok
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Improved load match trigger (internal board cross-tenant + rate alerts)
-- -----------------------------------------------------------------------------
create or replace function public.trg_notify_load_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_match jsonb;
  v_title text;
  v_body text;
  v_reason text;
begin
  if new.is_internal_board = true then
    if new.board_status not in ('open', 'bidding') then
      return new;
    end if;
  end if;

  for v_profile in
    select
      ns.user_id,
      ns.preferred_cities,
      ns.preferred_routes,
      ns.min_rate_cents,
      ns.rate_alert_enabled,
      p.company_id as user_company_id
    from public.notification_settings ns
    join public.profiles p on p.id = ns.user_id
    join public.companies c on c.id = p.company_id
    where coalesce((ns.enabled_types ->> 'load_match')::boolean, true) = true
      and p.company_id is not null
      and c.is_active = true
      and c.is_laslog_verified = true
      and (new.is_internal_board = false or p.company_id <> new.company_id)
      and (
        cardinality(ns.preferred_cities) > 0
        or coalesce(jsonb_array_length(ns.preferred_routes), 0) > 0
        or (ns.rate_alert_enabled = true and ns.min_rate_cents is not null)
      )
  loop
    v_match := public.load_matches_preferences(
      new.origin,
      new.destination,
      new.rate_cents,
      v_profile.preferred_cities,
      v_profile.preferred_routes,
      v_profile.min_rate_cents,
      v_profile.rate_alert_enabled
    );

    if coalesce((v_match->>'matched')::boolean, false) then
      v_reason := v_match->>'match_reason';

      if v_reason = 'rate' then
        v_title := 'Rate alert: ' || new.load_number;
      else
        v_title := 'Load match: ' || new.load_number;
      end if;

      v_body := coalesce(new.origin, 'TBD') || ' → ' || coalesce(new.destination, 'TBD');
      if new.rate_cents is not null then
        v_body := v_body || ' • $' || trim(to_char(new.rate_cents::numeric / 100, 'FM999,999,990.00'));
      end if;

      perform public.enqueue_notification(
        v_profile.user_id,
        v_profile.user_company_id,
        'load_match',
        v_title,
        v_body,
        jsonb_build_object(
          'load_id', new.id,
          'load_number', new.load_number,
          'match_reason', v_reason,
          'rate_cents', new.rate_cents,
          'source', case when new.is_internal_board then 'internal_board' else 'company' end
        )
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_load_match_notify on public.loads;
create trigger on_load_match_notify
  after insert or update of board_status, origin, destination, rate_cents on public.loads
  for each row
  when (
    new.is_internal_board = true
    and new.board_status in ('open', 'bidding')
  )
  execute procedure public.trg_notify_load_match();

-- Keep company-scoped matching for non-internal operational loads
drop trigger if exists on_load_match_notify_company on public.loads;
create trigger on_load_match_notify_company
  after insert on public.loads
  for each row
  when (new.is_internal_board = false)
  execute procedure public.trg_notify_load_match();

-- -----------------------------------------------------------------------------
-- External load match (Make.com placeholder webhook target)
-- -----------------------------------------------------------------------------
create or replace function public.process_external_load_match(
  p_origin text,
  p_destination text,
  p_rate_cents integer default null,
  p_load_ref text default null,
  p_equipment text default null,
  p_source text default 'make_com'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_match jsonb;
  v_title text;
  v_body text;
  v_reason text;
  v_count integer := 0;
  v_ref text := coalesce(nullif(trim(p_load_ref), ''), 'EXT-' || upper(substr(md5(random()::text), 1, 8)));
begin
  for v_profile in
    select
      ns.user_id,
      ns.preferred_cities,
      ns.preferred_routes,
      ns.min_rate_cents,
      ns.rate_alert_enabled,
      p.company_id as user_company_id
    from public.notification_settings ns
    join public.profiles p on p.id = ns.user_id
    join public.companies c on c.id = p.company_id
    where ns.external_loads_enabled = true
      and coalesce((ns.enabled_types ->> 'load_match')::boolean, true) = true
      and p.company_id is not null
      and c.is_active = true
      and c.is_laslog_verified = true
      and (
        cardinality(ns.preferred_cities) > 0
        or coalesce(jsonb_array_length(ns.preferred_routes), 0) > 0
        or (ns.rate_alert_enabled = true and ns.min_rate_cents is not null)
      )
  loop
    v_match := public.load_matches_preferences(
      p_origin,
      p_destination,
      p_rate_cents,
      v_profile.preferred_cities,
      v_profile.preferred_routes,
      v_profile.min_rate_cents,
      v_profile.rate_alert_enabled
    );

    if coalesce((v_match->>'matched')::boolean, false) then
      v_reason := v_match->>'match_reason';

      if v_reason = 'rate' then
        v_title := 'External rate alert: ' || v_ref;
      else
        v_title := 'External load match: ' || v_ref;
      end if;

      v_body := coalesce(p_origin, 'TBD') || ' → ' || coalesce(p_destination, 'TBD');
      if p_rate_cents is not null then
        v_body := v_body || ' • $' || trim(to_char(p_rate_cents::numeric / 100, 'FM999,999,990.00'));
      end if;
      if p_equipment is not null then
        v_body := v_body || ' • ' || p_equipment;
      end if;

      if public.enqueue_notification(
        v_profile.user_id,
        v_profile.user_company_id,
        'load_match',
        v_title,
        v_body,
        jsonb_build_object(
          'load_ref', v_ref,
          'match_reason', v_reason,
          'rate_cents', p_rate_cents,
          'source', p_source,
          'external', true
        )
      ) is not null then
        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  return v_count;
end;
$$;

comment on function public.process_external_load_match is
  'Matches external load data against user preferences. Called by Make.com webhook via service role.';

grant execute on function public.process_external_load_match(text, text, integer, text, text, text) to service_role;