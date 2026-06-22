import type { BoardLoad, LoadBid } from '../types';
import { formatRateCents } from './formatRate';

export interface ContractParties {
  brokerName: string;
  brokerDot?: string | null;
  carrierName: string;
  carrierDot?: string | null;
}

export function buildContractPreviewHtml(
  load: BoardLoad,
  bid: LoadBid,
  parties: ContractParties,
  contractNumber: string
): string {
  const rate = formatRateCents(bid.rate_cents);
  const generated = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${contractNumber}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #0F172A; max-width: 720px; margin: 40px auto; padding: 24px; line-height: 1.6; }
    h1 { font-size: 22px; color: #00BFFF; border-bottom: 2px solid #00BFFF; padding-bottom: 8px; }
    .badge { display: inline-block; background: #D1FAE5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px; }
    .section { margin: 20px 0; }
    .label { font-weight: 700; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .sig-block { margin-top: 48px; border-top: 1px solid #E2E8F0; padding-top: 24px; }
    .sig-line { border-bottom: 1px solid #0F172A; height: 32px; margin: 8px 0 24px; }
    .muted { color: #64748B; font-size: 13px; }
  </style>
</head>
<body>
  <div class="badge">laslogTMX Verified — Internal Contract</div>
  <h1>Freight Transportation Agreement</h1>
  <p class="muted">Contract ${contractNumber} · Generated ${generated} UTC</p>

  <div class="section">
    <div class="label">Parties</div>
    <p><strong>Broker:</strong> ${parties.brokerName} (DOT ${parties.brokerDot ?? 'N/A'})</p>
    <p><strong>Carrier:</strong> ${parties.carrierName} (DOT ${parties.carrierDot ?? 'N/A'})</p>
  </div>

  <div class="section">
    <div class="label">Load Details</div>
    <p><strong>Load #:</strong> ${load.load_number}</p>
    <p><strong>Origin:</strong> ${load.origin ?? 'TBD'}</p>
    <p><strong>Destination:</strong> ${load.destination ?? 'TBD'}</p>
    <p><strong>Equipment:</strong> ${load.equipment ?? 'TBD'}</p>
    <p><strong>Commodity:</strong> ${load.commodity ?? 'General Freight'}</p>
    <p><strong>Agreed Rate:</strong> ${rate}</p>
  </div>

  <div class="section">
    <div class="label">Terms</div>
    <ol>
      <li>This contract governs an internal laslogTMX Verified load only.</li>
      <li>Carrier shall transport freight per agreed schedule and equipment.</li>
      <li>Broker shall remit payment per standard laslogTMX internal terms.</li>
      <li>Disputes resolved through laslogTMX internal mediation.</li>
    </ol>
  </div>

  <div class="sig-block">
    <div class="label">E-Signature Placeholders</div>
    <p>Broker Signature</p>
    <div class="sig-line"></div>
    <p>Date: _______________</p>
    <p style="margin-top:24px">Carrier Signature</p>
    <div class="sig-line"></div>
    <p>Date: _______________</p>
  </div>
</body>
</html>`;
}

/** Trigger browser PDF download via print dialog (web only). */
export function downloadContractPdf(html: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
  // Filename hint for user save dialog
  win.document.title = filename;
}