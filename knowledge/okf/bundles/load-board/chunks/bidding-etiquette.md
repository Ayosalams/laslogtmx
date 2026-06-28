# Internal Load Board Bidding Etiquette

**Domain:** load_board | **Updated:** 2026-06-21

## Who Can Bid

Only **laslogTMX Verified** carriers with Pro Carrier (or higher) subscription and `company_type` carrier or mixed may submit bids. Brokers post; carriers bid — no public access.

## Bid Submission Rules

1. One active bid per carrier per load (update replaces previous bid)
2. Include realistic rate and equipment type
3. Use load-specific chat for negotiation — keep terms in writing
4. Do not share broker contact info outside laslogTMX channels

## Negotiation Flow

1. Carrier submits bid via BidForm
2. Broker reviews bids on LoadDetail screen
3. Both parties negotiate in the load-specific chat channel
4. Broker awards bid → `generate_load_contract` RPC creates contract record
5. Contract preview available; PDF via browser print (e-sign provider planned)

## Rate Guidance

- Check your `min_rate_cents` alert threshold before low-balling
- Factor detention risk — use detention timer data when building claims
- Verified broker ratings visible on CompanyProfileStrip — review before accepting

## Rejected Bids

Brokers may reject or ignore bids without obligation. Carriers should not repost identical bids more than twice without new terms.