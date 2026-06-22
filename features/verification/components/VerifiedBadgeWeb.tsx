import React from "react";
import type { VerificationStatus } from "../types";
import {
  VERIFIED_BADGE_LABEL,
  ADMIN_VERIFIED_LABEL,
  FRAUD_FLAG_LABEL,
  UNVERIFIED_LABEL,
} from "../constants";

interface Props {
  verificationStatus?: VerificationStatus;
  isLaslogVerified?: boolean;
  isFraudFlagged?: boolean;
  compact?: boolean;
}

function resolveClasses(
  status: VerificationStatus | undefined,
  isVerified: boolean,
  isFlagged: boolean
): { label: string; className: string } {
  if (isFlagged || status === "flagged") {
    return {
      label: FRAUD_FLAG_LABEL,
      className: "bg-red-50 text-red-800 border-red-100",
    };
  }
  if (status === "admin_verified") {
    return {
      label: ADMIN_VERIFIED_LABEL,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }
  if (status === "self_attested" || isVerified) {
    return {
      label: VERIFIED_BADGE_LABEL,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }
  return {
    label: UNVERIFIED_LABEL,
    className: "bg-slate-100 text-slate-500 border-slate-200",
  };
}

export const VerifiedBadgeWeb: React.FC<Props> = ({
  verificationStatus,
  isLaslogVerified = false,
  isFraudFlagged = false,
  compact = false,
}) => {
  const badge = resolveClasses(verificationStatus, isLaslogVerified, isFraudFlagged);

  return (
    <span
      className={`inline-block font-bold uppercase tracking-wide border rounded-full ${
        compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
      } ${badge.className}`}
    >
      {badge.label}
    </span>
  );
};