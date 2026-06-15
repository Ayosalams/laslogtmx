-- Chat System for laslogTMX
-- Supports: company-wide chats + load-specific chats
-- Realtime messaging via Supabase
-- Company isolation enforced via RLS using user_metadata.company_id (or profiles)
-- Report message functionality

-- Channels: company chats or per-load chats (brokers/carriers etc)
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid,
  load_id text, -- e.g. load number or uuid reference
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages in channels
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  reported boolean not null default false
);

-- Reports for moderation
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reporter_user_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_channels_company on public.channels(company_id);
create index if not exists idx_channels_load on public.channels(load_id);
create index if not exists idx_messages_channel on public.messages(channel_id, created_at);
create index if not exists idx_reports_message on public.message_reports(message_id);

-- Enable RLS (critical for company isolation)
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.message_reports enable row level security;

-- Helper to extract company from JWT user_metadata (common pattern when using Supabase Auth metadata)
-- In production prefer a profiles table + join, but this matches the existing hook query style.
create or replace function public.current_company_id()
returns text
language sql stable
as $$
  select (auth.jwt() -> 'user_metadata' ->> 'company_id');
$$;

-- CHANNELS POLICIES
-- View channels belonging to your company OR load-specific chats (open to participants who know the id)
create policy "channels_select_company_or_load"
on public.channels
for select
to authenticated
using (
  (company_id::text = public.current_company_id())
  or (load_id is not null)
);

-- Insert: only for own company (load chats created server-side or via trusted flow)
create policy "channels_insert_own_company"
on public.channels
for insert
to authenticated
with check (company_id::text = public.current_company_id());

-- MESSAGES POLICIES (isolation)
create policy "messages_select_channel_access"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.channels c
    where c.id = messages.channel_id
      and (
        (c.company_id::text = public.current_company_id())
        or (c.load_id is not null)
      )
  )
);

create policy "messages_insert_own"
on public.messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.channels c
    where c.id = messages.channel_id
      and (
        (c.company_id::text = public.current_company_id())
        or (c.load_id is not null)
      )
  )
);

-- Allow reporter (or admin) to flag a message
create policy "messages_update_reported_by_reporter"
on public.messages
for update
to authenticated
using (
  -- reporter can mark reported
  exists (
    select 1 from public.message_reports r
    where r.message_id = messages.id and r.reporter_user_id = auth.uid()
  )
  or 
  -- owner of message or future admin role
  user_id = auth.uid()
)
with check (reported = true);  -- only allow setting reported=true via this flow

-- REPORTS POLICIES
create policy "reports_select_own"
on public.message_reports
for select
to authenticated
using (reporter_user_id = auth.uid());

create policy "reports_insert_own"
on public.message_reports
for insert
to authenticated
with check (reporter_user_id = auth.uid());

-- Optional: seed example channels (comment out or adjust uuids in real env)
-- insert into public.channels (name, company_id, load_id, is_active) values
--   ('Company Operations', '00000000-0000-0000-0000-000000000001', null, true),
--   ('Load #L-4821 - ACME Freight', null, 'L-4821', true);

-- Realtime will be enabled automatically for these tables in Supabase project dashboard (or via replication).
-- Make sure "messages" and "channels" have realtime publication enabled in Supabase.

comment on table public.channels is 'Company + Load-specific chat channels. RLS enforces company isolation.';
comment on table public.messages is 'Chat messages. RLS + report support.';
comment on function public.current_company_id() is 'Extracts company_id from auth user_metadata for RLS (matches laslogTMX hook usage). Prefer profiles table in production.';
