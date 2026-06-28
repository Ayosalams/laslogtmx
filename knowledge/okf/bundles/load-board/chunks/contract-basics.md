# Load Contract Basics (Internal Board)

**Domain:** load_board | **Updated:** 2026-06-21

## Auto-Generated Contracts

When a broker awards a bid, laslogTMX calls `generate_load_contract` to create a `load_contracts` row with:

- Broker and carrier company IDs
- Agreed rate (cents)
- Load reference and lane details
- Contract body text (stored in DB)
- Status: `pending_signature`

## Current Signature Flow

- **Web:** ContractPreview with browser print-to-PDF
- **Planned:** DocuSign / HelloSign integration
- PDF storage path field reserved for Supabase Storage bucket `load-contracts`

## Key Terms to Confirm in Chat Before Award

| Term | Why It Matters |
|------|---------------|
| Rate (all-in vs linehaul) | Avoids payment disputes |
| Detention policy | Free time + hourly rate after |
| Accessorials | Lumper, TONU, layover |
| Pickup/delivery windows | Military time in all comms |
| Equipment type | Dry van, reefer, flatbed |

## Closing a Load

Poster can close load after contract is in `awarded` or `closed` status. Closed loads are removed from active board but remain in history for expense and detention linking.