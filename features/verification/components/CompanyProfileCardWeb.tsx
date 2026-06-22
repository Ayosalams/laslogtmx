import React from "react";
import type { CompanyPublicProfile } from "../types";
import { VerifiedBadgeWeb } from "./VerifiedBadgeWeb";
import { CompanyRatingStarsWeb } from "./CompanyRatingStarsWeb";

interface Props {
  profile: CompanyPublicProfile;
  showDotMc?: boolean;
}

export const CompanyProfileCardWeb: React.FC<Props> = ({ profile, showDotMc = true }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-bold text-[#00bfff] text-lg">{profile.name}</h3>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{profile.company_type}</p>
        </div>
        <VerifiedBadgeWeb
          verificationStatus={profile.verification_status}
          isLaslogVerified={profile.is_laslog_verified}
          isFraudFlagged={profile.is_fraud_flagged}
        />
      </div>

      <CompanyRatingStarsWeb
        averageRating={profile.average_rating}
        ratingCount={profile.rating_count}
        size="md"
      />

      {showDotMc && (profile.dot_number || profile.mc_number) && (
        <div className="flex gap-4 text-xs text-gray-500 tabular-nums">
          {profile.dot_number && <span>DOT {profile.dot_number}</span>}
          {profile.mc_number && <span>MC {profile.mc_number}</span>}
        </div>
      )}

      {profile.is_fraud_flagged && (
        <p className="text-sm font-semibold text-red-700">
          This company has been flagged for review. Proceed with caution.
        </p>
      )}
    </div>
  );
};