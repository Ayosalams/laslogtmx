import React from "react";
import type { CompanyPublicProfile } from "../types";
import { VerifiedBadgeWeb } from "./VerifiedBadgeWeb";
import { CompanyRatingStarsWeb } from "./CompanyRatingStarsWeb";

interface Props {
  profile: CompanyPublicProfile | null;
  label?: string;
}

export const CompanyProfileStripWeb: React.FC<Props> = ({ profile, label = "Posted by" }) => {
  if (!profile) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs text-gray-500">
        {label} <span className="font-semibold text-gray-800">{profile.name}</span>
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <VerifiedBadgeWeb
          verificationStatus={profile.verification_status}
          isLaslogVerified={profile.is_laslog_verified}
          isFraudFlagged={profile.is_fraud_flagged}
          compact
        />
        <CompanyRatingStarsWeb
          averageRating={profile.average_rating}
          ratingCount={profile.rating_count}
        />
      </div>
    </div>
  );
};