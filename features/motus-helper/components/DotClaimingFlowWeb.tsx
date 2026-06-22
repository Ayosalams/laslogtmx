"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { useFmcsaStatus } from "../hooks/useFmcsaStatus";
import type { ClaimFlowState, FlowStep } from "../types";
import { StepIndicatorWeb } from "./MotusWebShared";

export const DotClaimingFlowWeb: React.FC = () => {
  const [state, setState] = useState<ClaimFlowState>({
    currentStep: "enter-dot",
    dotNumber: "",
    submitted: false,
  });
  const { isChecking, checkDot, clear } = useFmcsaStatus();

  const goToStep = (step: FlowStep) => setState((s) => ({ ...s, currentStep: step }));

  const handleDotSubmit = async () => {
    if (!state.dotNumber.trim()) return;
    try {
      const info = await checkDot(state.dotNumber);
      setState((s) => ({ ...s, statusInfo: info, currentStep: "verify-status" }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Unable to check DOT.");
    }
  };

  const proceedToClaim = () => {
    if (state.statusInfo?.status === "Not Found") {
      alert("DOT not found. You may need to register via the FMCSA portal first.");
      return;
    }
    goToStep("claim-account");
  };

  const submitClaim = () => {
    if (!state.contactEmail) {
      alert("Please enter a contact email.");
      return;
    }
    setState((s) => ({ ...s, submitted: true, currentStep: "confirmation" }));
  };

  const finish = () => {
    setState({ currentStep: "enter-dot", dotNumber: "", submitted: false });
    clear();
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case "enter-dot":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">Enter your DOT Number</h2>
            <p className="text-sm text-[#64748B]">7-8 digit number assigned by FMCSA</p>
            <input
              className="w-full border rounded-xl px-4 py-3"
              value={state.dotNumber}
              onChange={(e) => setState((s) => ({ ...s, dotNumber: e.target.value }))}
              placeholder="e.g. 1234567"
              maxLength={8}
            />
            <button
              type="button"
              onClick={handleDotSubmit}
              disabled={isChecking}
              className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl disabled:opacity-60"
            >
              {isChecking ? "Checking…" : "Check Status & Continue"}
            </button>
          </div>
        );

      case "verify-status":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">Verify DOT Status</h2>
            {state.statusInfo && (
              <div className="bg-white border rounded-xl p-4 space-y-1">
                <p className="font-bold text-lg">{state.statusInfo.legalName || "Unknown Carrier"}</p>
                <p className="text-sm">DOT: {state.statusInfo.dotNumber}</p>
                <p className="text-sm">Status: {state.statusInfo.status}</p>
                <p className="text-sm">Authority: {state.statusInfo.authorityStatus || "N/A"}</p>
                {state.statusInfo.outOfService && (
                  <p className="text-red-600 font-semibold text-sm">⚠ Out of Service</p>
                )}
              </div>
            )}
            <button type="button" onClick={proceedToClaim} className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl">
              Continue to Claim / Link
            </button>
            <button type="button" onClick={() => goToStep("enter-dot")} className="w-full text-sm text-[#64748B] py-2">
              Edit DOT Number
            </button>
          </div>
        );

      case "claim-account":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A]">Claim or Link DOT</h2>
            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Business email"
              type="email"
              value={state.contactEmail || ""}
              onChange={(e) => setState((s) => ({ ...s, contactEmail: e.target.value }))}
            />
            <input
              className="w-full border rounded-xl px-4 py-3"
              placeholder="Phone (optional)"
              value={state.contactPhone || ""}
              onChange={(e) => setState((s) => ({ ...s, contactPhone: e.target.value }))}
            />
            <button type="button" onClick={submitClaim} className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl">
              Submit Claim / Link Request
            </button>
            <p className="text-sm text-[#64748B]">
              This initiates the MOTUS/FMCSA linking process. You may receive a PIN via email.
            </p>
          </div>
        );

      case "confirmation":
        return (
          <div className="text-center space-y-4 py-4">
            <p className="text-5xl">✅</p>
            <h2 className="text-xl font-bold text-[#0F172A]">Request Submitted</h2>
            <p className="text-[#475569]">
              Your DOT claim / link request for {state.dotNumber} has been submitted.
            </p>
            <p className="text-sm text-[#64748B]">
              Check your email for confirmation or PIN. Track status in Documents.
            </p>
            <Link href="/motus" onClick={finish} className="inline-block w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl">
              Return to MOTUS Home
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FeatureShell title="DOT Linking Wizard" backHref="/motus" maxWidth="md">
      <StepIndicatorWeb current={state.currentStep} />
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">{renderStep()}</div>
    </FeatureShell>
  );
};