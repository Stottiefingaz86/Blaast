import type { CaptureSession } from "./session.js";
import type { CaptureStep } from "./step.js";

/**
 * Upload payload: JSON manifest + binary parts referenced by localId.
 * Extension writes this after review; API stores blobs then persists steps.
 */
export type CaptureUploadBundle = {
  schemaVersion: "1.0.0";
  session: CaptureSession;
  steps: CaptureStep[];
  /** Map localId → filename inside the multipart upload */
  files: { localId: string; fileName: string; mimeType: string }[];
};

export type BehaviourEvent = {
  at: string;
  type: "click" | "spa_navigation" | "resize" | "visibility";
  /** Selector hint only — no field values */
  targetHint?: string;
  url?: string;
  viewportWidth?: number;
  viewportHeight?: number;
};
