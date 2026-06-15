-- =============================================================================
-- Subscription tiers for company-level feature gating (CBLE Prep, etc.)
-- Timestamp: 20240618000000
-- =============================================================================

alter table public.companies
  add column if not exists subscription_tier text not null default 'starter'
    check (subscription_tier in ('starter', 'pro', 'pro_broker', 'enterprise')),
  add column if not exists billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly', 'yearly'));

comment on column public.companies.subscription_tier is
  'Company subscription tier. CBLE Prep requires pro_broker or enterprise.';
comment on column public.companies.billing_interval is
  'Billing cadence. Annual pro_broker unlocks full CBLE Prep library.';

create index if not exists idx_companies_subscription_tier
  on public.companies(subscription_tier);