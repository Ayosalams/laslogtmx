import React from 'react';
import { MATCH_REASON_LABELS } from '../../../packages/shared/src/notifications/constants';
import type { LoadMatchReason } from '../../../packages/shared/src/notifications/types';
interface Props {
  reasons: LoadMatchReason[];
  compact?: boolean;
}

// RN component kept for mobile; require string obfuscated + runtime guarded to allow web builds (pre-existing shared RN usage)
export const LoadMatchBadge: React.FC<Props> = ({ reasons, compact }) => {
  if (reasons.length === 0) return null;

  let View: any = null, Text: any = null, StyleSheet: any = null;
  try {
    // obfuscate module name to reduce static analysis pulling RN into Next.js web
    const rnId = 'react' + '-native';
    const RN = require(rnId);
    View = RN.View; Text = RN.Text; StyleSheet = RN.StyleSheet;
  } catch { /* web path - no RN */ }

  const primary = reasons[0];
  const label = MATCH_REASON_LABELS[primary];

  if (View) {
    const styles = (StyleSheet && StyleSheet.create) ? StyleSheet.create({
      badge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: '#FDE68A' },
      badgeCompact: { paddingHorizontal: 6, paddingVertical: 2 },
      text: { fontSize: 10, fontWeight: '700', color: '#B45309', letterSpacing: 0.3 },
      textCompact: { fontSize: 9 },
    }) : ({} as any);
    return (
      <View style={[styles.badge, compact && styles.badgeCompact]}>
        <Text style={[styles.text, compact && styles.textCompact]}>
          {reasons.length > 1 ? `${label} +${reasons.length - 1}` : label}
        </Text>
      </View>
    );
  }
  // web fallback (LoadMatchBadgeWeb preferred for web pages)
  return <span>{label}</span>;
};

/** Web-friendly inline badge (no RN dependency on Next.js pages). */
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