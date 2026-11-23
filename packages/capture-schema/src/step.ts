import type { Viewport } from "./session.js";
import type { StructureSnapshot } from "./structure.js";
import type { MotionHints } from "./motion.js";
import type { AssetRef } from "./assets.js";

export type CaptureStepKind = "screenshot" | "manual_import";

/**
 * One ordered step in a capture session (Mobbin "screen in a flow").
 * Binary blobs are referenced by localId until upload assigns storage keys.
 */
export type CaptureStep = {
  stepId: string;
  sessionId: string;
  index: number;
  kind: CaptureStepKind;
  capturedAt: string;
  page: {
    url: string;
    title: string;
  };
  viewport: Viewport;
  /** Local or remote screenshot reference */
  screenshot: ArtifactRef;
  structure?: StructureSnapshot;
  motion?: MotionHints;
  assets?: AssetRef[];
  /** Researcher paint-redact regions in % of image (0–100) */
  redactions?: RedactRegion[];
  review: StepReview;
};

export type ArtifactRef = {
  localId: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "video/webm";
  byteLength?: number;
  /** Set after upload */
  storageKey?: string;
};

export type RedactRegion = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  reason: "pii" | "payment" | "credentials" | "other";
};

export type StepReview = {
  approvedForUpload: boolean;
  notes?: string;
  sensitiveFlags: SensitiveFlag[];
};

export type SensitiveFlag =
  | "password_field_present"
  | "payment_field_present"
  | "otp_field_present"
  | "url_looks_cashier"
  | "url_looks_kyc"
  | "manual_redact_required";
