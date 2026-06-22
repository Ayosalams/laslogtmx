import type { CbleMaterial } from "../types";

/**
 * Maps material IDs to web-servable asset paths.
 * Assets are served via /api/cble-assets/ from features/cble-prep/assets/.
 */
export const CBLE_WEB_ASSET_MAP: Record<string, string> = {
  "cble-pod-001": "audio/Cracking_the_Spring_2026_CBLE.m4a",
  "cble-vid-001": "videos/Master_the_HTS.mp4",
  "cble-pdf-001": "pdfs/Chapter_84_Blueprint.pdf",
  "cble-pod-002": "audio/Your_11_Week_CBLE_Battle_Plan.m4a",
  "cble-vid-002": "videos/HTS_Logic_Puzzle.mp4",
  "cble-pdf-002": "images/2026_Customs_Broker_License_Roadmap.png",
};

export function resolveCbleWebAssetUrl(material: CbleMaterial): string | null {
  const mapped = CBLE_WEB_ASSET_MAP[material.id];
  if (mapped) return `/api/cble-assets/${mapped}`;
  if (material.assetPath) {
    const normalized = material.assetPath.replace(/^features\/cble-prep\/assets\//, "");
    return `/api/cble-assets/${normalized}`;
  }
  return null;
}