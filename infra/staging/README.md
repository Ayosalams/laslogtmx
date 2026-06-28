# laslogtmx-dev Staging Environment

Staging host: **dev.laslogtmx.com**  
Cloudflare Pages project: **laslogtmx-dev**  
Git branch: **develop**

## Quick Setup

1. **Supabase staging project** — create a separate project (not production). Apply all migrations, then run `supabase/seed.staging.sql`.
2. **Cloudflare Pages** — create project `laslogtmx-dev` (see root `README.md` for exact dashboard settings).
3. **Environment variables** — copy `infra/staging/laslogtmx-dev.env.example` into the CF dashboard. Use Stripe **test** keys only.
4. **Supabase Auth** — add `https://dev.laslogtmx.com/**` to Redirect URLs and Site URL override if needed.
5. **Deploy** — push to `develop`; CF builds from monorepo root with `npm run build:web`.

## Seed Data

| Company | Tier | Type | Purpose |
|---------|------|------|---------|
| Staging Carrier Alpha | pro | carrier | Verified carrier, operational loads |
| Staging Broker Beta | pro_broker | broker | Internal board poster, bidding demo |
| Staging Mixed Logistics | enterprise | mixed | Negotiating load demo |
| Staging Starter Fleet | starter | carrier | Unverified / limited tier demo |
| Staging Flagged Co | starter | broker | Fraud-flagged demo (no board access) |

Loads prefixed `STG-OP-*` are operational TMS loads. `STG-IB-*` are internal board loads across open/bidding/negotiating/closed states.

## Local Staging Dev

```bash
cp infra/staging/laslogtmx-dev.env.example .env.local
# Fill in staging Supabase + Stripe test keys manually
npm run dev:web
```