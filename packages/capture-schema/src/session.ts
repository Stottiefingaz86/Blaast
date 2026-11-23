export type CapturePlatform = "mobile_web" | "desktop_web";

export type CaptureSessionStatus =
  | "recording"
  | "review"
  | "uploading"
  | "uploaded"
  | "failed";

export type CaptureSession = {
  sessionId: string;
  /** Hostname that was granted permission, e.g. stake.com */
  allowedOrigin: string;
  platform: CapturePlatform;
  startedAt: string;
  stoppedAt?: string;
  status: CaptureSessionStatus;
  /** Optional journey label assigned at start or in review */
  journeyLabel?: string;
  operatorHint?: string;
  viewport: Viewport;
  extensionVersion: string;
  schemaVersion: typeof CAPTURE_SCHEMA_VERSION;
};

export type Viewport = {
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
};

export const CAPTURE_SCHEMA_VERSION = "1.0.0" as const;
