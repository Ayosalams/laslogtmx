-- Add detention category and load attribution to expenses

alter table public.expenses
  drop constraint if exists expenses_category_check;

alter table public.expenses
  add constraint expenses_category_check
  check (category in (
    'fuel', 'maintenance', 'tolls', 'food', 'lodging', 'supplies', 'detention', 'other'
  ));

alter table public.expenses
  add column if not exists load_id uuid references public.loads(id) on delete set null,
  add column if not exists load_number text;

create index if not exists idx_expenses_load on public.expenses(company_id, load_id);