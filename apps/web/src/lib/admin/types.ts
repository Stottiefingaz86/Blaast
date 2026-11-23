export type ProductSurface =
  | "sportsbook"
  | "casino"
  | "poker"
  | "cashier"
  | "account"
  | "rewards"
  | "promotions"
  | "cross_product";

export type Platform = "mobile_web" | "desktop_web";

/** Pattern-intelligence segment — crypto vs traditional sportsbook, etc. */
export type OperatorVertical =
  | "crypto_casino"
  | "traditional_sportsbook"
  | "hybrid"
  | "other";

/** Curated reference set for “notable / best” MCP answers */
export type OperatorReferenceTier = "core" | "notable";

export type Operator = {
  id: string;
  name: string;
  /** Primary URL opened for capture */
  url: string;
  hostname: string;
  markets: string[];
  products: ProductSurface[];
  notes?: string;
  tags: string[];
  /** Segment for pattern intelligence */
  vertical?: OperatorVertical;
  /** ISO-ish region codes (may overlap markets) */
  regions?: string[];
  /** When set, included in notable_flows / “best” shortlists */
  referenceTier?: OperatorReferenceTier | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistItemKind = "screen" | "ui_element" | "state" | "note";

export type PlaybookItem = {
  id: string;
  label: string;
  kind: ChecklistItemKind;
  /** Taxonomy tags applied when this item is captured */
  tags: string[];
  hint: string;
  required: boolean;
};

export type CapturePlaybook = {
  id: string;
  title: string;
  description: string;
  products: ProductSurface[];
  /** Suggested platforms to capture */
  platforms: Platform[];
  items: PlaybookItem[];
};

export type ChecklistItemStatus = "todo" | "done" | "skipped" | "blocked";

export type CaptureSessionItem = {
  playbookItemId: string;
  status: ChecklistItemStatus;
  note?: string;
  /** How many screenshots/clips marked for this checklist row */
  captureCount: number;
  completedAt?: string;
  artifactId?: string;
};

export type GuidePhase =
  | "idle"
  | "countdown"
  | "recording"
  | "uploading"
  | "reviewing";

/** Extension polls this to sync countdown / record / stop */
export type SessionGuide = {
  currentStepId: string | null;
  phase: GuidePhase;
  countdownEndsAt?: string;
  recordingStartedAt?: string;
  maxClipSec?: number;
  commandSeq: number;
};

export type ArtifactReviewStatus = "pending" | "approved" | "rejected" | "sensitive";

/** Normalized box on the video frame (percent 0–100). */
export type CaptureRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Researcher tags while browsing — VIP block, activity feed, etc. */
export type CaptureAnnotation = {
  id: string;
  /** Short label shown in UI */
  label: string;
  /** Taxonomy / filter tag */
  tag: string;
  comment?: string;
  /** Optional ms into the clip */
  atMs?: number;
  /** Clicked / drawn area on the frame so many blocks stay distinguishable */
  region?: CaptureRegion;
  /** Admin trim window for library / MCP element delivery */
  clipWindow?: { startMs: number; endMs: number };
  /** When false, hide from public library element cards (default true) */
  publishElement?: boolean;
  /** Cached still relative to .data/captures (extracted at atMs) */
  posterPath?: string;
  /** Vision enrich — search synonyms (popular, trending, …) */
  searchSynonyms?: string[];
  /** Vision enrich — Sports / Casino / Home / … */
  enrichCategory?: string;
  enrichedAt?: string;
  enrichConfidence?: number;
  createdAt: string;
};

export type RecordingArtifact = {
  id: string;
  sessionId: string;
  coverageStepId: string;
  kind: "clip" | "still";
  capturedAt: string;
  pageUrl?: string;
  pageTitle?: string;
  viewport?: { width: number; height: number; devicePixelRatio: number };
  /** Relative to .data/captures */
  videoPath?: string;
  posterPath?: string;
  structurePath?: string;
  mimeVideo?: string;
  mimePoster?: string;
  sensitiveFlags: string[];
  reviewStatus: ArtifactReviewStatus;
  durationMs?: number;
  annotations?: CaptureAnnotation[];
  /**
   * Inclusive window shown on the public library (ms into video).
   * Trim out geo-blocks, wrong pages, browser chrome — tags stay private.
   */
  clipWindow?: { startMs: number; endMs: number };
};

export type CaptureSession = {
  id: string;
  operatorId: string;
  playbookId: string;
  platform: Platform;
  market?: string;
  status: "in_progress" | "review" | "done" | "abandoned";
  startedAt: string;
  updatedAt: string;
  items: CaptureSessionItem[];
  /** Freeform session notes */
  notes?: string;
  /** Guided wizard sync for extension */
  guide?: SessionGuide;
  artifacts?: RecordingArtifact[];
  /**
   * Tags added before/during a beat, keyed by coverageStepId.
   * Merged onto the artifact when the clip uploads.
   */
  liveAnnotations?: Record<string, CaptureAnnotation[]>;
};

export type AdminStore = {
  operators: Operator[];
  sessions: CaptureSession[];
};
