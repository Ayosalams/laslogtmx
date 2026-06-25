import React from 'react';
import { MATCH_REASON_LABELS } from '../../../packages/shared/src/notifications/constants';
import type { LoadMatchReason } from '../../../packages/shared/src/notifications/types';

export function LoadMatchBadgeWeb({ reasons }: { reasons: LoadMatchReason[] }) {
  if (reasons.length === 0) return null;
  const primary = reasons[0];
  const label = MATCH_REASON_LABELS[primary];
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
      {reasons.length > 1 ? `${label} +${reasons.length - 1}` : label}
    </span>
  );
}