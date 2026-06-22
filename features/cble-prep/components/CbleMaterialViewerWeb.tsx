"use client";

import React from "react";
import Link from "next/link";
import { CBLE_DISCLAIMER_SHORT } from "../constants";
import { resolveCbleWebAssetUrl } from "../utils/cbleWebAssets";
import type { CbleMaterial } from "../types";

interface Props {
  material: CbleMaterial;
  onClose: () => void;
}

export const CbleMaterialViewerWeb: React.FC<Props> = ({ material, onClose }) => {
  const assetUrl = resolveCbleWebAssetUrl(material);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#E2E8F0]">
          <div className="min-w-0">
            <p className="font-bold text-lg text-[#0F172A]">{material.title}</p>
            <p className="text-sm text-[#64748B] mt-1">
              {material.type.toUpperCase()}
              {material.durationMinutes ? ` • ${material.durationMinutes} min` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] font-bold text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm text-[#475569] leading-relaxed">{material.description}</p>
          <p className="text-xs text-amber-800 italic mt-3">{CBLE_DISCLAIMER_SHORT}</p>

          {!assetUrl ? (
            <div className="mt-6 bg-gray-50 border border-[#E2E8F0] rounded-xl p-6 text-center">
              <p className="font-semibold text-[#0F172A]">Asset not yet available</p>
              <p className="text-sm text-[#64748B] mt-2">
                Upload content to features/cble-prep/assets/ to enable playback.
              </p>
            </div>
          ) : material.type === "video" ? (
            <video
              key={assetUrl}
              controls
              className="w-full mt-6 rounded-xl bg-black max-h-[50vh]"
              src={assetUrl}
            >
              <track kind="captions" />
            </video>
          ) : material.type === "podcast" ? (
            <audio key={assetUrl} controls className="w-full mt-6" src={assetUrl}>
              <track kind="captions" />
            </audio>
          ) : material.type === "pdf" && assetUrl.endsWith(".pdf") ? (
            <iframe
              title={material.title}
              src={assetUrl}
              className="w-full mt-6 rounded-xl border border-[#E2E8F0] min-h-[60vh]"
            />
          ) : material.type === "pdf" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={assetUrl}
              alt={material.title}
              className="w-full mt-6 rounded-xl border border-[#E2E8F0] object-contain max-h-[60vh]"
            />
          ) : (
            <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-sm text-[#0F172A]">
                Interactive {material.type} viewer coming soon.
              </p>
              <Link href={assetUrl} target="_blank" className="text-sm text-[#00bfff] font-semibold mt-2 inline-block hover:underline">
                Open asset →
              </Link>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#00bfff] text-white font-semibold py-3 rounded-xl hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};