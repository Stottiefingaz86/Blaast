import type { OperatorVertical } from "@/lib/admin/types";
import type { JourneyId } from "@/lib/library/journeys";

export const PATTERN_EXTRACTOR_VERSION = "1.0.0";

export type PatternKind = "flow" | "ui_element" | "homepage_ia";

export type PatternFingerprint = {
  patternId: string;
  kind: PatternKind;
  /** e.g. homepage.casino_first, lobby.ca-lobby>ca-nav>ca-game-card */
  normalizedKey: string;
  label: string;
  operatorId: string;
  operatorSlug: string;
  operatorHostname: string;
  vertical?: OperatorVertical;
  regions?: string[];
  referenceTier?: string | null;
  evidenceIds: string[];
  tags: string[];
  journey?: JourneyId | string;
  provenance: "measured";
  extractedAt: string;
  extractorVersion: string;
};

export type PatternAggregate = {
  normalizedKey: string;
  kind: PatternKind;
  label: string;
  countOperators: number;
  operatorSlugs: string[];
  evidenceSamples: string[];
  segmentBreakdown: Partial<Record<OperatorVertical | "unknown", number>>;
  journey?: string;
};

export type PatternIndex = {
  version: string;
  updatedAt: string;
  fingerprints: PatternFingerprint[];
  aggregates: PatternAggregate[];
};
