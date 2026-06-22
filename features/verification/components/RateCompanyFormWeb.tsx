"use client";

import React, { useState } from "react";
import { useCompanyRatings } from "../hooks/useCompanyRatings";
import { RATING_LABELS } from "../constants";

interface Props {
  loadId: string;
  ratedCompanyName: string;
  onRated?: () => void;
}

export const RateCompanyFormWeb: React.FC<Props> = ({ loadId, ratedCompanyName, onRated }) => {
  const { submitRating, submitting, error } = useCompanyRatings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return;
    const result = await submitRating({ load_id: loadId, rating, comment });
    if (result.success) {
      setDone(true);
      onRated?.();
    }
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p className="font-semibold text-emerald-700">Thank you for rating {ratedCompanyName}.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">Rate {ratedCompanyName}</h3>
        <p className="text-sm text-gray-500 mt-1">How was your experience on this load?</p>
      </div>

      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="flex-1 flex flex-col items-center py-2 rounded-lg hover:bg-gray-50"
          >
            <span className={`text-2xl ${n <= rating ? "text-amber-400" : "text-slate-300"}`}>★</span>
            <span className="text-[9px] text-gray-400 mt-1">{RATING_LABELS[n]}</span>
          </button>
        ))}
      </div>

      <textarea
        className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
      />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || rating < 1}
        className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Rating"}
      </button>
    </div>
  );
};