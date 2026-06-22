"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CBLE_INCLUDED_VALUE } from "../../../packages/shared/src/constants/subscription";
import { useSettings } from "../../../packages/shared/src/context/SettingsContext";
import { formatMessageTime } from "../../../packages/shared/src/utils/formatTime";
import { FeatureShell } from "../../../packages/shared/components/FeatureShell";
import { CbleMaterialViewerWeb } from "./CbleMaterialViewerWeb";
import {
  CBLE_CATEGORIES,
  CBLE_DISCLAIMER_FULL,
  CBLE_DISCLAIMER_SHORT,
  CBLE_PLACEHOLDER_MATERIALS,
  CBLE_PRONUNCIATION_NOTE,
} from "../constants";
import { canAccessMaterial, useCbleAccess } from "../hooks/useCbleAccess";
import type { CbleCategoryId, CbleMaterial } from "../types";

const TYPE_ICONS: Record<CbleMaterial["type"], string> = {
  podcast: "🎧",
  video: "▶️",
  pdf: "📄",
  quiz: "✓",
};

export const CbleLibraryWeb: React.FC = () => {
  const { isMilitaryTime } = useSettings();
  const access = useCbleAccess();
  const [selectedCategory, setSelectedCategory] = useState<CbleCategoryId | "all">("all");
  const [selectedMaterial, setSelectedMaterial] = useState<CbleMaterial | null>(null);

  const filteredMaterials = useMemo(() => {
    if (selectedCategory === "all") return CBLE_PLACEHOLDER_MATERIALS;
    return CBLE_PLACEHOLDER_MATERIALS.filter((m) => m.categoryId === selectedCategory);
  }, [selectedCategory]);

  return (
    <FeatureShell
      title="CBLE Prep"
      subtitle="Customs Broker License Exam — Internal Library"
      backHref="/"
      backLabel="← Home"
      maxWidth="xl"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-[10px] font-bold tracking-wide text-amber-900">DISCLAIMER</p>
        <p className="text-xs text-amber-900 mt-1 leading-relaxed">{CBLE_DISCLAIMER_FULL}</p>
        <p className="text-xs text-amber-800 mt-2 italic">{CBLE_PRONUNCIATION_NOTE}</p>
      </div>

      {access.isLocked ? (
        <div className="bg-white border-2 border-[#00bfff] rounded-2xl p-5">
          <p className="font-semibold text-red-800">Pro Broker Required</p>
          <p className="text-sm text-[#475569] mt-2 leading-relaxed">
            CBLE Prep is included with Pro Broker and Enterprise plans. Annual Pro Broker subscribers
            receive the full library (${CBLE_INCLUDED_VALUE} value included free).
          </p>
          <p className="text-sm text-[#00bfff] font-medium mt-3">{access.upgradeMessage}</p>
          <Link href="/pricing" className="inline-block mt-4 text-sm font-semibold text-[#00bfff] hover:underline">
            View Plans →
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Your Access</p>
          <p className="font-semibold text-emerald-700 mt-1">{access.accessSummary}</p>
          {access.hasPreviewAccess && (
            <p className="text-sm text-emerald-600 mt-2">
              Preview materials unlocked. Upgrade to annual billing for the complete library.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-[#1E293B] mb-2">Categories</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              selectedCategory === "all"
                ? "bg-[#00bfff] border-[#00bfff] text-white"
                : "bg-white border-[#E2E8F0] text-[#475569]"
            }`}
          >
            All
          </button>
          {CBLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                selectedCategory === cat.id
                  ? "bg-[#00bfff] border-[#00bfff] text-white"
                  : "bg-white border-[#E2E8F0] text-[#475569]"
              }`}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1E293B] mb-3">Materials</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredMaterials.map((material) => {
            const unlocked = canAccessMaterial(material.requiresFullAccess, access);
            const updatedTime = formatMessageTime(material.updatedAt, isMilitaryTime);

            return (
              <button
                key={material.id}
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && setSelectedMaterial(material)}
                className={`text-left bg-white border rounded-xl p-4 transition-colors ${
                  unlocked
                    ? "border-[#E2E8F0] hover:border-[#00bfff]"
                    : "border-[#00bfff] opacity-65 cursor-not-allowed"
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-xl">{TYPE_ICONS[material.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E293B] truncate">{material.title}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {material.type.toUpperCase()}
                      {material.durationMinutes ? ` • ${material.durationMinutes} min` : ""}
                      {" • Updated "}
                      {updatedTime}
                    </p>
                  </div>
                  {!unlocked && <span className="text-lg">🔒</span>}
                </div>
                <p className="text-sm text-[#475569] mt-2 line-clamp-2">{material.description}</p>
                <p className="text-[10px] text-amber-800 italic mt-2">{CBLE_DISCLAIMER_SHORT}</p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMaterial && (
        <CbleMaterialViewerWeb
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}

      <p className="text-[11px] text-[#64748B] text-center bg-gray-50 rounded-xl p-3">
        Materials stream from features/cble-prep/assets/ via the web asset API. Upload to Supabase Storage for production CDN.
      </p>
    </FeatureShell>
  );
};