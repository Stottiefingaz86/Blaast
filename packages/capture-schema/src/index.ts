export type { Provenance, Provenanced } from "./provenance.js";
export {
  CAPTURE_SCHEMA_VERSION,
  type CapturePlatform,
  type CaptureSession,
  type CaptureSessionStatus,
  type Viewport,
} from "./session.js";
export type {
  ArtifactRef,
  CaptureStep,
  CaptureStepKind,
  RedactRegion,
  SensitiveFlag,
  StepReview,
} from "./step.js";
export {
  MAX_STRUCTURE_NODES,
  MEASURED_STYLE_KEYS,
  type BoundingBox,
  type CssVariable,
  type MeasuredStyles,
  type StructureNode,
  type StructureSnapshot,
} from "./structure.js";
export type { MotionAnimation, MotionHints } from "./motion.js";
export type { AssetRef } from "./assets.js";
export {
  FORBIDDEN_AUTOCOMPLETE,
  FORBIDDEN_INPUT_TYPES,
  SENSITIVE_URL_PATTERNS,
  flagsForUrl,
  isForbiddenInput,
} from "./security.js";
export type { BehaviourEvent, CaptureUploadBundle } from "./bundle.js";
