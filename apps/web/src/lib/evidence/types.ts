/**
 * Flow evidence contracts — bridge capture-schema concepts to library prompts.
 * Provenance mirrors packages/capture-schema (measured | observed | inferred).
 */

export type EvidenceConfidence = "demo" | "reviewed" | "draft";

export type ProvenanceLabel = "measured" | "observed" | "inferred" | "unavailable";

export type UiRole =
  | "header"
  | "nav"
  | "odds_ladder"
  | "odds_button"
  | "betslip"
  | "cta_primary"
  | "cta_secondary"
  | "form"
  | "wallet"
  | "game_grid"
  | "feed"
  | "modal"
  | "tab_bar"
  | "receipt"
  | "search"
  | "other";

export type ArtifactRef = {
  kind: "screenshot" | "video_frame" | "video";
  url?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp" | "video/webm";
  provenance: ProvenanceLabel;
};

export type StepObservation = {
  role: UiRole;
  note: string;
  provenance: ProvenanceLabel;
};

/** Compact measured layout for agent handoff (from structure snapshot). */
export type StructureRegion = {
  role: string;
  selectorHint: string;
  box: { x: number; y: number; width: number; height: number };
  textPreview?: string;
  styles?: Record<string, string>;
};

export type MotionHintSummary = {
  name: string;
  durationMs?: number;
  easing?: string;
  iterationCount?: string;
  source: string;
  targetHint?: string;
};

export type StepEvidence = {
  stepId: string;
  index: number;
  label: string;
  surfaceKind: string;
  /** Coverage / taxonomy tags (loader, betslip, …) */
  tags: string[];
  goals: string[];
  observations: StepObservation[];
  layoutNotes: string[];
  structureRegions?: StructureRegion[];
  motionHints?: MotionHintSummary[];
  coverageStepId?: string;
  artifacts: ArtifactRef[];
};

export type FlowEvidence = {
  evidenceId: string;
  flowId: string;
  operatorSlug: string;
  operatorName: string;
  operatorTagline: string;
  category: string;
  group: string;
  flowName: string;
  actions: string[];
  platform: "mobile" | "web";
  hasVideo: boolean;
  confidence: EvidenceConfidence;
  steps: StepEvidence[];
  tags: string[];
  sessionId?: string;
  libraryPath: string;
};

/** Flat searchable unit for MCP (one capture beat or catalog screen). */
export type EvidenceSearchHit = {
  id: string;
  kind: "screen" | "ui_element" | "flow_beat" | "flow";
  title: string;
  operator: string;
  operatorSlug: string;
  tags: string[];
  platform: "mobile" | "web";
  hasVideo: boolean;
  hasMotion: boolean;
  hasStructure: boolean;
  confidence: EvidenceConfidence;
  evidenceId: string;
  flowId?: string;
  coverageStepId?: string;
  posterUrl?: string;
  videoUrl?: string;
  structureUrl?: string;
  adminPath?: string;
  /** Element clip: ms into source video */
  atMs?: number;
  /** Element clip: % box on frame (Mobbin-style region) */
  region?: { x: number; y: number; w: number; h: number };
  annotationId?: string;
  /** Optional tighter window for frontend / MCP (admin trim) */
  clipWindow?: { startMs: number; endMs: number };
};

export type ReplicatePromptSource = "llm" | "evidence_template";

export type ReplicatePromptCitation = {
  stepId: string;
  label: string;
  roles: UiRole[];
};

export type ReplicatePromptResult = {
  prompt: string;
  source: ReplicatePromptSource;
  model?: string;
  evidenceId: string;
  flowId: string;
  citations: ReplicatePromptCitation[];
  generatedAt: string;
};
