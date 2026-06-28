# Smart Load Matching Preferences

**Domain:** load_board | **Updated:** 2026-06-22

## How Matching Works

laslogTMX internal load board matches new broker posts against carrier notification preferences:

- **City match** — origin or destination contains a preferred city
- **Route match** — origin AND destination match a saved lane
- **Rate alert** — posted rate meets or exceeds `min_rate_cents` threshold

Matches trigger `load_match` notifications in real time via Supabase.

## Setting Preferences

Navigate to **Settings → Notifications → Load Match** and configure:

1. Preferred cities (e.g., "Dallas", "Chicago")
2. Preferred routes (origin → destination pairs)
3. Minimum rate (cents) with rate alerts enabled

## External Loads (Make.com)

External loads from Make.com webhooks send notification-only alerts — they do not create board entries. Carriers see origin, destination, rate, and source label.

## Best Practices

- Keep city names broad ("Atlanta" not "Atlanta, GA 30301") for wider matching
- Set realistic rate floors to reduce alert fatigue
- Review match badges on LoadCard before bidding — badge shows city/route/rate reasons