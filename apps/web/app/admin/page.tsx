"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../../packages/shared/src/auth/AuthContext";
import { useSettings } from "../../../../packages/shared/src/context/SettingsContext";
import { useCurrentTime } from "../../../../packages/shared/src/hooks/useCurrentTime";
import { formatMessageTime } from "../../../../packages/shared/src/utils/formatTime";
import { getTierLabel } from "../../../../packages/shared/src/constants/subscription";
import { useAdminAccess } from "../../../../features/admin/hooks/useAdminAccess";
import { useSupportTicketQueue } from "../../../../features/admin/hooks/useSupportTicketQueue";
import { useCbleContentAdmin } from "../../../../features/admin/hooks/useCbleContentAdmin";
import { useUserManagement } from "../../../../features/admin/hooks/useUserManagement";
import {
  ADMIN_TABS,
  TICKET_ACTIONS,
  TICKET_STATUS_LABELS,
} from "../../../../features/admin/constants";
import { CBLE_CATEGORIES } from "../../../../features/cble-prep/constants";
import type { AdminTabId } from "../../../../features/admin/types";
import type { CbleMaterialType, CbleCategoryId } from "../../../../features/cble-prep/types";
import { VerificationAdminPanelWeb } from "../../../../features/verification/components/VerificationAdminPanelWeb";

function formatAmount(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function shortTicketId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAdminAccess();
  const { company } = useAuth();
  const currentTime = useCurrentTime();
  const { isMilitaryTime } = useSettings();
  const [activeTab, setActiveTab] = useState<AdminTabId>("tickets");

  const tickets = useSupportTicketQueue(company?.id);
  const cble = useCbleContentAdmin();
  const users = useUserManagement(company?.id);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<CbleMaterialType>("pdf");
  const [formCategory, setFormCategory] = useState<CbleCategoryId>("customs_law");
  const [formFullAccess, setFormFullAccess] = useState(true);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-500">
        Verifying access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
        <p className="text-gray-500 mt-3">
          The Admin Dashboard is only available to users with the admin role.
        </p>
        <Link href="/" className="inline-block mt-6 text-[#1E40AF] hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const handleAddMaterial = async () => {
    if (!formTitle.trim()) {
      setFormMessage("Title is required.");
      return;
    }
    const result = await cble.addMaterial({
      title: formTitle,
      description: formDesc,
      type: formType,
      categoryId: formCategory,
      requiresFullAccess: formFullAccess,
    });
    setFormMessage(result.error ?? "Material added to library (draft).");
    if (!result.error) {
      setFormTitle("");
      setFormDesc("");
    }
  };

  return (
    <div className="flex flex-col gap-0 -m-4">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">laslogTMX Operations</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-[#1E40AF] tabular-nums">
          {currentTime}
        </span>
      </div>

      <div className="bg-white border-b border-gray-200 flex">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#1E40AF] text-[#1E40AF]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full">
        {activeTab === "tickets" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Support Tickets & Refunds</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Review refund requests for {company?.name ?? "your company"}.
            </p>
            {tickets.error && <p className="text-red-700 text-sm mb-4">{tickets.error}</p>}
            {tickets.tickets.length === 0 && !tickets.loading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="font-medium text-gray-800">No tickets in queue</p>
                <p className="text-sm text-gray-500 mt-2">
                  Refund requests from chat will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          #{shortTicketId(ticket.id)}
                        </span>
                        {ticket.escalated_to_admin && (
                          <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Escalated
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatMessageTime(ticket.created_at, isMilitaryTime)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-semibold text-[#1E40AF]">
                        {ticket.company_name ?? "Company"}
                      </span>
                      <span className="text-lg font-bold">{formatAmount(ticket.amount_cents)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {TICKET_STATUS_LABELS[ticket.status]}
                    </p>
                    {ticket.reason && (
                      <p className="text-sm text-gray-500 italic mt-2">{ticket.reason}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {TICKET_ACTIONS.map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          disabled={ticket.status === action.status || tickets.updatingId === ticket.id}
                          onClick={() => tickets.updateTicketStatus(ticket.id, action.status)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                            action.variant === "danger"
                              ? "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
                              : action.variant === "primary"
                                ? "bg-indigo-50 border-indigo-200 text-[#1E40AF] hover:bg-indigo-100"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "cble" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">CBLE Content Management</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Upload training materials and configure tier access.
            </p>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Upload New Material</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Placeholder upload — assets will sync to Supabase Storage when backend is wired.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Title</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Material title"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Type</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CbleMaterialType)}
                  >
                    <option value="podcast">Podcast</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500">Description</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[72px]"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500">Category</label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CbleCategoryId)}
                >
                  {CBLE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFullAccess}
                  onChange={(e) => setFormFullAccess(e.target.checked)}
                  className="rounded border-gray-300 text-[#1E40AF]"
                />
                <span className="text-sm text-gray-700">
                  Full library access required (annual Pro Broker)
                </span>
              </label>
              {formMessage && <p className="text-sm text-[#1E40AF] mt-3">{formMessage}</p>}
              <button
                type="button"
                onClick={handleAddMaterial}
                disabled={cble.saving}
                className="mt-4 bg-[#1E40AF] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-800 disabled:opacity-60"
              >
                {cble.saving ? "Saving…" : "Add Material"}
              </button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-3">
              Library Materials ({cble.materials.length})
            </h3>
            <div className="space-y-3">
              {cble.materials.map((material) => {
                const category = CBLE_CATEGORIES.find((c) => c.id === material.categoryId);
                return (
                  <div
                    key={material.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{material.title}</span>
                      {material.isDraft && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {material.type.toUpperCase()} • {category?.title} •{" "}
                      {formatMessageTime(material.updatedAt, isMilitaryTime)}
                    </p>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={material.requiresFullAccess}
                        onChange={() => cble.toggleTierAccess(material.id)}
                        className="rounded border-gray-300 text-[#1E40AF]"
                      />
                      <span className="text-xs text-gray-600">
                        {material.requiresFullAccess
                          ? "Annual Pro Broker required"
                          : "Preview (monthly OK)"}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "verification" && <VerificationAdminPanelWeb />}

        {activeTab === "users" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">View company details and team members.</p>

            {(users.company ?? company) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
                <h3 className="text-xl font-bold text-[#1E40AF]">
                  {(users.company ?? company)!.name}
                </h3>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Plan</p>
                    <p className="text-sm font-semibold mt-1">
                      {getTierLabel((users.company ?? company)!.subscription_tier)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Billing</p>
                    <p className="text-sm font-semibold mt-1">
                      {(users.company ?? company)!.billing_interval === "yearly"
                        ? "Annual"
                        : "Monthly"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Users</p>
                    <p className="text-sm font-semibold mt-1">{users.users.length}</p>
                  </div>
                </div>
              </div>
            )}

            {users.error && <p className="text-red-700 text-sm mb-4">{users.error}</p>}

            <div className="space-y-2">
              {users.users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-[#1E40AF] font-bold text-sm">
                    {(user.full_name ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.full_name ?? "Unnamed User"}</p>
                    <p className="text-xs text-gray-500">{user.phone ?? "No phone on file"}</p>
                  </div>
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-indigo-50 text-[#1E40AF]">
                    {user.role}
                  </span>
                </div>
              ))}
              {users.users.length === 0 && !users.loading && (
                <p className="text-center text-gray-500 py-8">No users found for this company.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}