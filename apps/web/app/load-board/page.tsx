"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLoadBoard } from "../../../../features/load-board/hooks/useLoadBoard";
import { useLoadMatchNotifications } from "../../../../features/load-board/hooks/useLoadMatchNotifications";
import { useMatchedLoads } from "../../../../features/load-board/hooks/useMatchedLoads";
import { LoadMatchBadgeWeb } from "../../../../features/load-board/components/LoadMatchBadgeWeb";
import { EQUIPMENT_TYPES, VERIFIED_BADGE_LABEL } from "../../../../features/load-board/constants";
import { formatRateCents, parseRateToCents } from "../../../../features/load-board/utils/formatRate";
import { useCurrentTime } from "../../../../packages/shared/src/hooks/useCurrentTime";
import { showLocalNotification } from "../../lib/showLocalNotification";
import { useCompanyProfiles } from "../../../../features/verification/hooks/useCompanyProfile";
import { CompanyProfileStripWeb } from "../../../../features/verification/components/CompanyProfileStripWeb";

export default function LoadBoardPage() {
  const currentTime = useCurrentTime();
  const { loads, myPostedLoads, loading, posting, access, refresh, postLoad } = useLoadBoard();
  const { matchMap, matchCount, hasPreferences } = useMatchedLoads(loads);
  const { profiles: brokerProfiles } = useCompanyProfiles(loads.map((l) => l.company_id));

  useLoadMatchNotifications((title, body, data) => {
    showLocalNotification(title, body, data);
  });
  const [showForm, setShowForm] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState<string>(EQUIPMENT_TYPES[0]);
  const [rate, setRate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handlePost = async () => {
    const rateCents = parseRateToCents(rate);
    if (!origin.trim() || !destination.trim() || !rateCents) {
      setMessage("Origin, destination, and rate are required.");
      return;
    }
    const result = await postLoad({
      load_number: "",
      origin: origin.trim(),
      destination: destination.trim(),
      equipment,
      rate_cents: rateCents,
      pickup_date: new Date(Date.now() + 86400000).toISOString(),
      delivery_date: new Date(Date.now() + 172800000).toISOString(),
    });
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(`Posted ${result.load?.load_number}`);
    setShowForm(false);
    setOrigin("");
    setDestination("");
    setRate("");
  };

  if (!access.canAccess) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-8 bg-white rounded-2xl border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Internal Load Board</h1>
        <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wide bg-amber-50 text-amber-800 px-3 py-1 rounded-full">
          {VERIFIED_BADGE_LABEL} Required
        </span>
        <p className="mt-4 text-gray-600">{access.gateMessage}</p>
        <p className="mt-3 text-sm text-gray-400 italic">
          Internal feature only — not a public load board.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">
            ← Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Internal Load Board</h1>
          <p className="text-sm text-gray-500 mt-1">
            {access.canPost ? "Post & manage loads" : "View matching loads & bid"}
          </p>
        </div>
        <span className="text-xs font-semibold tabular-nums bg-sky-50 text-[#00bfff] px-3 py-1 rounded-full">
          {currentTime}
        </span>
      </div>

      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <span className="text-xs font-bold text-emerald-700">{VERIFIED_BADGE_LABEL}</span>
        <p className="text-sm text-emerald-800">
          Internal laslogTMX network — verified carriers & brokers only.
        </p>
      </div>

      {message && (
        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">{message}</p>
      )}

      {access.canPost && (
        <div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="w-full sm:w-auto bg-[#00bfff] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90"
          >
            {showForm ? "Cancel" : "+ Post New Load"}
          </button>
          {showForm && (
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Origin</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2" value={origin} onChange={(e) => setOrigin(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Destination</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Equipment</span>
                <select className="mt-1 w-full border rounded-lg px-3 py-2" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-gray-500">Rate (USD)</span>
                <input className="mt-1 w-full border rounded-lg px-3 py-2" value={rate} onChange={(e) => setRate(e.target.value)} />
              </label>
              <button
                type="button"
                onClick={handlePost}
                disabled={posting}
                className="sm:col-span-2 bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-60"
              >
                {posting ? "Posting…" : "Post to Internal Board"}
              </button>
            </div>
          )}
        </div>
      )}

      {access.canPost && myPostedLoads.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Your Posted Loads</h2>
          <div className="grid gap-3">
            {myPostedLoads.map((load) => (
              <Link key={load.id} href={`/load-board/${load.id}`} className="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#00bfff]">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">{load.load_number}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{VERIFIED_BADGE_LABEL}</span>
                </div>
                <p className="font-semibold text-gray-800 mt-1">{load.origin} → {load.destination}</p>
                <p className="text-[#00bfff] font-bold mt-2">{formatRateCents(load.rate_cents)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {access.canBid && hasPreferences && matchCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {matchCount} load{matchCount === 1 ? "" : "s"} match your smart alert preferences
          </p>
          <Link href="/settings/notifications" className="text-sm text-[#00bfff] hover:underline">
            Edit alerts
          </Link>
        </div>
      )}

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Available Loads</h2>
          <div className="flex items-center gap-3">
            <Link href="/settings/notifications" className="text-sm text-gray-500 hover:text-[#00bfff]">
              Match settings
            </Link>
            <button type="button" onClick={refresh} className="text-sm text-[#00bfff] hover:underline">
              Refresh
            </button>
          </div>
        </div>
        {loading && loads.length === 0 ? (
          <p className="text-gray-500">Loading…</p>
        ) : loads.length === 0 ? (
          <p className="text-gray-400">No matching loads right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {loads.map((load) => (
              <Link key={load.id} href={`/load-board/${load.id}`} className="block bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#00bfff]">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-gray-900">{load.load_number}</span>
                  <div className="flex items-center gap-2">
                    {matchMap[load.id] && <LoadMatchBadgeWeb reasons={matchMap[load.id]} />}
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{VERIFIED_BADGE_LABEL}</span>
                  </div>
                </div>
                <p className="font-semibold text-gray-800 mt-1">{load.origin} → {load.destination}</p>
                <p className="text-sm text-gray-500 mt-1">{load.equipment}</p>
                <p className="text-[#00bfff] font-bold mt-2">{formatRateCents(load.rate_cents)}</p>
                <CompanyProfileStripWeb profile={brokerProfiles[load.company_id] ?? null} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}