import React from "react";
import { formatAverageRating } from "../utils/formatRating";

interface Props {
  averageRating: number | null;
  ratingCount: number;
  size?: "sm" | "md";
}

export const CompanyRatingStarsWeb: React.FC<Props> = ({
  averageRating,
  ratingCount,
  size = "sm",
}) => {
  if (!ratingCount || averageRating == null) {
    return (
      <span className={`italic text-slate-400 ${size === "md" ? "text-sm" : "text-xs"}`}>
        No ratings yet
      </span>
    );
  }

  const rounded = Math.round(averageRating);
  const starSize = size === "md" ? "text-base" : "text-sm";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={starSize}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rounded ? "text-amber-400" : "text-slate-300"}>
            ★
          </span>
        ))}
      </span>
      <span className={`text-slate-500 ${size === "md" ? "text-sm" : "text-xs"}`}>
        {formatAverageRating(averageRating, ratingCount)}
      </span>
    </span>
  );
};