"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBidding } from "../../../../../features/load-board/hooks/useBidding";
import { VERIFIED_BADGE_LABEL } from "../../../../../features/load-board/constants";
import { formatRateCents, parseRateToCents } from "../../../../../features/load-board/utils/formatRate";
import { downloadContractPdf, buildContractPreviewHtml } from "../../../../../features/load-board/utils/generateContract";
import { useCurrentTime } from "../../../../../packages/shared/src/hooks/useCurrentTime";
import { useAuth } from "../../../../../packages/shared/src/auth/AuthContext";
import { useCompanyProfile } from "../../../../../features/verification/hooks/useCompanyProfile";
import { useCompanyRatings } from "../../../../../features/verification/hooks/useCompanyRatings";
import { CompanyProfileCardWeb } from "../../../../../features/verification/components/CompanyProfileCardWeb";
import { RateCompanyFormWeb } from "../../../../../features/verification/components/RateCompanyFormWeb";
import { DetentionTimerBannerWeb } from "../../../../../features/detention-timer/components/DetentionTimerBannerWeb";
import { useAutoDetentionOnAssignment } from "../../../../../features/detention-timer/hooks/useAutoDetentionOnAssignment";
import { useDetentionTimerWeb } from "../../../../../features/detention-timer/hooks/useDetentionTimerWeb";
import { buildDetentionClaimOcrDefaults } from "../../../../../features/detention-timer/utils/detentionUtils";
import { RECEIPT_DRAFT_KEY } from "../../../../../features/receipt-ocr/hooks/useReceiptOcrWeb";

export default function LoadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loadId = typeof params.id === "string" ? params.id : undefined;
  const currentTime = useCurrentTime();
  const { profile } = useAuth();
  const {
    load,
    bids,
    contract,
    loading,
    submitting,
    generating,
    access,
    isPoster,
    myBid,
    acceptedBid,
    submitBid,
    updateBidStatus,
    generateContract,
  } = useBidding(loadId);

  const { profile: brokerProfile, refresh: refreshBroker } = useCompanyProfile(load?.company_id);
  const { profile: carrierProfile, refresh: refreshCarrier } = useCompanyProfile(
    contract?.carrier_company_id
  );
  const { closeLoad, submitting: closingLoad } = useCompanyRatings();
  const {
    session: detentionSession,
    isActive: detentionActive,
    startTimer,
    buildClaimDraft,
  } = useDetentionTimerWeb();

  const isCarrierAssigned =
    contract?.carrier_company_id === profile?.company_id ||
    (acceptedBid?.status === "accepted" && acceptedBid.company_id === profile?.company_id);

  useAutoDetentionOnAssignment({
    load,
    contract,
    myBid: acceptedBid ?? myBid,
    carrierCompanyId: profile?.company_id,
    isActive: detentionActive,
    session: detentionSession,
    startTimer,
    enabled: isCarrierAssigned,
  });

  const startDetentionClaim = useCallback(() => {
    const claim = buildClaimDraft();
    if (!claim) return;
    sessionStorage.setItem(
      RECEIPT_DRAFT_KEY,
      JSON.stringify({
        imageUrl: null,
        ocrResult: buildDetentionClaimOcrDefaults(claim),
        manual: true,
        detentionContext: {
          loadNumber: claim.loadNumber,
          loadId: claim.loadId,
          facility: claim.facility,
        },
        detentionClaim: true,
      })
    );
    router.push("/receipts/correct");
  }, [buildClaimDraft, router]);

  const ratedCompanyName =
    profile?.company_id === load?.company_id
      ? carrierProfile?.name ?? "Carrier"
      : brokerProfile?.name ?? "Broker";
  const canRate = Boolean(load && contract && ["closed", "awarded"].includes(load.board_status));
  const canCloseLoad =
    isPoster && load && !["closed", "cancelled"].includes(load.board_status) && contract;

  const [rate, setRate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  const handleBid = async () => {
    if (!load) return;
    const rateCents = parseRateToCents(rate);
    if (!rateCents) {
      setMsg("Enter a valid bid rate.");
      return;
    }
    const result = await submitBid({ load_id: load.id, rate_cents: rateCents, notes });
    if (result.error) {
      setMsg(result.error.message);
      return;
    }
    setMsg("Bid submitted.");
    setRate("");
    setNotes("");
  };

  if (!access.canAccess) {
    return <p className="mt-12 text-center text-gray-500">Internal load board access required.</p>;
  }

  if (loading || !load) {
    return <p className="mt-12 text-center text-gray-500">Loading load details…</p>;
  }

  return (
    <div className="flex flex-col gap-6 mt-4 max-w-3xl">
      <div className="flex justify-between items-center">
        <Link href="/load-board" className="text-[#00bfff] font-semibold hover:underline">
          ← Load Board
        </Link>
        <span className="text-xs font-semibold tabular-nums bg-sky-50 text-[#00bfff] px-3 py-1 rounded-full">
          {currentTime}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          {VERIFIED_BADGE_LABEL}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{load.load_number}</h1>
        <p className="text-lg font-semibold text-gray-800 mt-1">
          {load.origin} → {load.destination}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500 font-semibold">Rate</p>
            <p className="font-bold text-[#00bfff]">{formatRateCents(load.rate_cents)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-semibold">Equipment</p>
            <p className="font-semibold">{load.equipment ?? "TBD"}</p>
          </div>
        </div>
      </div>

      {isCarrierAssigned && (
        <DetentionTimerBannerWeb
          compact={detentionActive}
          presetLoadNumber={load.load_number}
          presetLoadId={load.id}
          onGenerateClaim={detentionActive ? startDetentionClaim : undefined}
          onScanExpense={detentionActive ? () => router.push("/receipts") : undefined}
        />
      )}

      {brokerProfile && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Broker Profile</h2>
          <CompanyProfileCardWeb profile={brokerProfile} />
        </section>
      )}

      {carrierProfile && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Carrier Profile</h2>
          <CompanyProfileCardWeb profile={carrierProfile} />
        </section>
      )}

      {canCloseLoad && (
        <button
          type="button"
          onClick={async () => {
            if (!load) return;
            const result = await closeLoad(load.id);
            setMsg(result.error ?? "Load marked complete. You can now rate your counterparty.");
          }}
          disabled={closingLoad}
          className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {closingLoad ? "Closing…" : "Mark Load Complete"}
        </button>
      )}

      {canRate && load && (
        <RateCompanyFormWeb
          loadId={load.id}
          ratedCompanyName={ratedCompanyName}
          onRated={() => {
            refreshBroker();
            refreshCarrier();
          }}
        />
      )}

      {msg && <p className="text-sm bg-gray-50 border rounded-lg p-3">{msg}</p>}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
          Bids ({bids.length})
        </h2>
        {bids.length === 0 ? (
          <p className="text-gray-400">No bids yet.</p>
        ) : (
          <div className="grid gap-3">
            {bids.map((bid) => (
              <div key={bid.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="font-bold text-[#00bfff]">{formatRateCents(bid.rate_cents)}</p>
                  <p className="text-sm text-gray-500 capitalize">{bid.status}</p>
                  {bid.notes && <p className="text-sm text-gray-600 mt-1">{bid.notes}</p>}
                </div>
                {isPoster && bid.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateBidStatus(bid.id, "accepted")}
                      className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBidStatus(bid.id, "rejected")}
                      className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {bid.status === "accepted" && !contract && (
                  <button
                    type="button"
                    onClick={() => generateContract(bid.id)}
                    disabled={generating}
                    className="bg-sky-50 text-[#00bfff] text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    {generating ? "Generating…" : "Generate Contract"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {access.canBid && !isPoster && !myBid && load.board_status !== "awarded" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 grid gap-3">
          <h2 className="font-bold text-gray-900">Submit Bid</h2>
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Your rate (USD)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <textarea
            className="border rounded-lg px-3 py-2"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={handleBid}
            disabled={submitting}
            className="bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Bid"}
          </button>
        </div>
      )}

      {myBid && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-bold text-[#00bfff]">Your Bid</p>
          <p className="text-xl font-bold text-gray-900">{formatRateCents(myBid.rate_cents)}</p>
          <p className="text-sm text-gray-500 capitalize">Status: {myBid.status}</p>
        </div>
      )}

      {contract && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {VERIFIED_BADGE_LABEL}
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-3">Freight Contract</h2>
          <p className="text-sm text-gray-500 font-mono">{contract.contract_number}</p>
          <p className="text-lg font-bold text-[#00bfff] mt-2">
            Agreed Rate: {formatRateCents(contract.agreed_rate_cents)}
          </p>
          <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
            {contract.contract_body}
          </pre>
          <div className="mt-6 grid sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Broker Signature</p>
              <div className="border-b border-gray-900 h-8 mt-2" />
              <p className="text-xs text-gray-400 mt-1">
                {contract.broker_signed_at ? `Signed ${contract.broker_signed_at}` : "Awaiting signature"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Carrier Signature</p>
              <div className="border-b border-gray-900 h-8 mt-2" />
              <p className="text-xs text-gray-400 mt-1">
                {contract.carrier_signed_at ? `Signed ${contract.carrier_signed_at}` : "Awaiting signature"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const html = buildContractPreviewHtml(
                load,
                { id: contract.bid_id, load_id: contract.load_id, company_id: contract.carrier_company_id, bidder_profile_id: "", rate_cents: contract.agreed_rate_cents, notes: null, status: "accepted", negotiation_channel_id: null, created_at: contract.created_at, updated_at: contract.updated_at },
                { brokerName: "Broker", carrierName: "Carrier" },
                contract.contract_number
              );
              downloadContractPdf(html, `${contract.contract_number}.pdf`);
            }}
            className="mt-4 w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl"
          >
            Download / Print PDF
          </button>
        </div>
      )}
    </div>
  );
}