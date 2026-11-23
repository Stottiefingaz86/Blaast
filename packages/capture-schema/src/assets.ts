import type { Provenance } from "./provenance.js";

export type AssetRef = {
  assetId: string;
  kind: "img" | "background" | "svg" | "icon" | "font" | "other";
  /** Page URL of the asset when known */
  sourceUrl?: string;
  contentHash?: string;
  mimeType?: string;
  byteLength?: number;
  storageKey?: string;
  rightsStatus: "uncleared" | "internal_only" | "cleared" | "rejected";
  provenance: Provenance;
};
