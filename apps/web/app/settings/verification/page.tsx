"use client";

import React from "react";
import Link from "next/link";
import { SelfAttestFormWeb } from "../../../../../features/verification/components/SelfAttestFormWeb";
import { VerifiedBadgeWeb } from "../../../../../features/verification/components/VerifiedBadgeWeb";
import { CompanyRatingStarsWeb } from "../../../../../features/verification/components/CompanyRatingStarsWeb";
import { useAuth } from "../../../../../packages/shared/src/auth/AuthContext";

export default function VerificationSettingsPage() {
  const { company } = useAuth();

  return (
    <div className="flex flex-col gap-6 mt-8 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-gray-500 hover:text-gray-800">
          ← Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Company Verification</h1>
      </div>

      {company && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900">{company.name}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{company.company_type ?? "carrier"}</p>
            </div>
            <VerifiedBadgeWeb
              verificationStatus={company.verification_status}
              isLaslogVerified={company.is_laslog_verified}
              isFraudFlagged={company.is_fraud_flagged}
            />
          </div>
          <CompanyRatingStarsWeb
            averageRating={company.average_rating ?? null}
            ratingCount={company.rating_count ?? 0}
            size="md"
          />
          {company.is_fraud_flagged && (
            <p className="text-sm font-semibold text-red-700">
              Your company has been flagged. Contact laslogTMX support.
            </p>
          )}
        </div>
      )}

      <SelfAttestFormWeb />
    </div>
  );
}