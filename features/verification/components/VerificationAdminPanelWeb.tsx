"use client";

import React, { useState } from "react";
import { useVerificationAdmin } from "../hooks/useVerificationAdmin";
import { FRAUD_FLAG_REASONS, VERIFICATION_STATUS_LABELS } from "../constants";
import { VerifiedBadgeWeb } from "./VerifiedBadgeWeb";
import { CompanyRatingStarsWeb } from "./CompanyRatingStarsWeb";
import { formatAverageRating } from "../utils/formatRating";

export const VerificationAdminPanelWeb: React.FC = () => {
  const { companies, loading, updatingId, error, verifyCompany, flagCompany } = useVerificationAdmin();
  const [flagReason, setFlagReason] = useState<Record<string, string>>({});

  if (loading) {
    return <p className="text-gray-500 py-8 text-center">Loading companies…</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Company Verification</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Verify carriers/brokers or flag suspicious companies. Flags write to fraud_flags.
      </p>

      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="space-y-4">
        {companies.map((co) => (
          <div key={co.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-bold text-gray-900">{co.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {co.company_type} • DOT {co.dot_number ?? "—"} • MC {co.mc_number ?? "—"}
                </p>
              </div>
              <VerifiedBadgeWeb
                verificationStatus={co.verification_status}
                isLaslogVerified={co.is_laslog_verified}
                isFraudFlagged={co.is_fraud_flagged}
              />
            </div>

            <CompanyRatingStarsWeb averageRating={co.average_rating} ratingCount={co.rating_count} />

            <p className="text-xs text-gray-500">
              Status: {VERIFICATION_STATUS_LABELS[co.verification_status]} •{" "}
              {formatAverageRating(co.average_rating, co.rating_count)}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={updatingId === co.id}
                onClick={() => verifyCompany(co.id, true)}
                className="flex-1 text-sm font-semibold py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                Verify
              </button>
              <button
                type="button"
                disabled={updatingId === co.id}
                onClick={() => verifyCompany(co.id, false)}
                className="flex-1 text-sm font-semibold py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Unverify
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {FRAUD_FLAG_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFlagReason((prev) => ({ ...prev, [co.id]: reason }))}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                    flagReason[co.id] === reason
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  {reason.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={updatingId === co.id || !flagReason[co.id]}
              onClick={() => flagCompany(co.id, flagReason[co.id] ?? "other")}
              className="w-full text-sm font-semibold py-2 rounded-lg bg-red-50 text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Flag for Fraud
            </button>
          </div>
        ))}

        {companies.length === 0 && (
          <p className="text-center text-gray-500 py-8">No companies found.</p>
        )}
      </div>
    </div>
  );
};