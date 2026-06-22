"use client";

import React, { useState } from "react";
import { useCompanyVerification } from "../hooks/useCompanyVerification";

export const SelfAttestFormWeb: React.FC = () => {
  const { company, isVerified, selfAttest, submitting, error, message } = useCompanyVerification();
  const [dot, setDot] = useState(company?.dot_number ?? "");
  const [mc, setMc] = useState(company?.mc_number ?? "");

  if (isVerified) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p className="font-bold text-emerald-700">Your company is laslogTMX Verified.</p>
        {company?.dot_number && (
          <p className="text-sm text-emerald-600 mt-1">DOT {company.dot_number}</p>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    await selfAttest({ dot_number: dot, mc_number: mc || undefined });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900">Verify Your Company</h3>
        <p className="text-sm text-gray-500 mt-1">
          Self-attest your DOT/MC numbers. Format is validated; admin may review flagged accounts.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase text-gray-500">DOT Number</span>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={dot}
          onChange={(e) => setDot(e.target.value)}
          placeholder="6–8 digits"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase text-gray-500">MC Number (optional)</span>
        <input
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={mc}
          onChange={(e) => setMc(e.target.value)}
          placeholder="MC-123456"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-60"
      >
        {submitting ? "Verifying…" : "Submit DOT/MC Verification"}
      </button>
    </div>
  );
};