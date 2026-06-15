-- =============================================================================
-- laslogTMX Expenses + Receipt OCR
-- Timestamp: 20240620000000
-- Purpose: Company-isolated expense tracking with receipt OCR metadata.
-- =============================================================================

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  merchant text not null,
  category text not null check (category in (
    'fuel', 'maintenance', 'tolls', 'food', 'lodging', 'supplies', 'other'
  )),
  expense_date date not null,
  expense_time text, -- military HH:MM when captured
  receipt_image_url text,
  notes text,
  ocr_raw_text text,
  user_confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.expenses is 'Driver/carrier expenses with mandatory OCR correction before save. Strict company isolation via RLS.';

create index if not exists idx_expenses_company on public.expenses(company_id);
create index if not exists idx_expenses_company_date on public.expenses(company_id, expense_date desc);
create index if not exists idx_expenses_category on public.expenses(company_id, category);

create trigger update_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.update_updated_at_column();

-- Receipt images bucket (private, company-scoped paths)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

alter table public.expenses enable row level security;

create policy "expenses_select_own_company"
on public.expenses
for select
to authenticated
using (company_id = public.get_my_company_id());

create policy "expenses_insert_own_company"
on public.expenses
for insert
to authenticated
with check (company_id = public.get_my_company_id());

create policy "expenses_update_own_company"
on public.expenses
for update
to authenticated
using (company_id = public.get_my_company_id())
with check (company_id = public.get_my_company_id());

create policy "expenses_delete_own_company"
on public.expenses
for delete
to authenticated
using (company_id = public.get_my_company_id());

-- Storage policies: receipts/{company_id}/{filename}
create policy "receipts_select_own_company"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = public.get_my_company_id()::text
);

create policy "receipts_insert_own_company"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = public.get_my_company_id()::text
);

create policy "receipts_delete_own_company"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = public.get_my_company_id()::text
);