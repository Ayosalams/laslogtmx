"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "../../../../packages/shared/src/context/SettingsContext";
import { useAuth } from "../../../../packages/shared/src/auth/AuthContext";
import { useCbleAccess } from "../../../../features/cble-prep/hooks/useCbleAccess";
import { getTierLabel } from "../../../../packages/shared/src/constants/subscription";

export default function SettingsPage() {
  const { isMilitaryTime, toggleMilitaryTime } = useSettings();
  const { profile, company, isAuthenticated } = useAuth();
  const cbleAccess = useCbleAccess();

  const tierLabel = getTierLabel(company?.subscription_tier);
  const billingLabel =
    company?.billing_interval === "yearly" ? "Annual" : "Monthly";

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/" className="text-gray-500 hover:text-gray-800">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {isAuthenticated && profile && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            {profile.full_name ?? "User"} • {profile.role}
          </p>
          {company && (
            <p className="text-sm text-gray-500 mt-1">{company.name}</p>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Subscription & Access</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Plan Tier
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {isAuthenticated && company ? tierLabel : "—"}
            </p>
            {company?.billing_interval && (
              <p className="text-sm text-gray-500 mt-1">{billingLabel} billing</p>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              CBLE Prep Access
            </p>
            <p
              className={`text-lg font-semibold mt-1 ${
                cbleAccess.hasFullAccess
                  ? "text-emerald-700"
                  : cbleAccess.hasPreviewAccess
                    ? "text-amber-700"
                    : "text-gray-500"
              }`}
            >
              {isAuthenticated && company
                ? cbleAccess.accessLevel === "full"
                  ? "Full Library"
                  : cbleAccess.accessLevel === "preview"
                    ? "Preview"
                    : "Not Available"
                : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-1">{cbleAccess.accessSummary}</p>
          </div>
        </div>
        {!cbleAccess.hasAccess && isAuthenticated && (
          <p className="mt-4 text-sm text-gray-600">
            <Link href="/pricing" className="text-[#00bfff] hover:underline">
              View Pro Broker plans
            </Link>{" "}
            to unlock CBLE Prep (internal training only).
          </p>
        )}
      </div>

      <Link
        href="/settings/verification"
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-[#00bfff]/40 transition"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Company Verification</h2>
          <p className="text-sm text-gray-500">
            Self-attest DOT/MC, view trust badge, and ratings.
          </p>
        </div>
        <span className="text-gray-400 text-xl">›</span>
      </Link>

      <Link
        href="/settings/notifications"
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-[#00bfff]/40 transition"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-500">
            Preferred cities, alert types, quiet hours, and web push.
          </p>
        </div>
        <span className="text-gray-400 text-xl">›</span>
      </Link>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Military Time Display</h2>
          <p className="text-sm text-gray-500">Use 24-hour time format across the application.</p>
        </div>
        <button
          onClick={toggleMilitaryTime}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isMilitaryTime ? "bg-blue-500" : "bg-gray-300"
          }`}
        >
          <span className="sr-only">Toggle Military Time</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isMilitaryTime ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}