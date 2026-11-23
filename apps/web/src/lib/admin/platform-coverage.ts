import {
  COVERAGE_PACK_ID,
  coverageJourneyProgress,
  coverageStepsForProducts,
  missingRequiredJourneySteps,
} from "@/lib/admin/coverage-pack";
import type {
  CaptureSession,
  Operator,
  Platform,
} from "@/lib/admin/types";

export type PlatformCoverage = {
  platform: Platform;
  label: "Desktop" | "Mobile";
  /** Latest brand-coverage session for this platform, if any */
  session: CaptureSession | null;
  journeysComplete: number;
  journeysTotal: number;
  requiredDone: number;
  requiredTotal: number;
  /** Session marked done and no missing required steps */
  complete: boolean;
  inProgress: boolean;
};

function statusMap(session: CaptureSession) {
  const m = new Map<string, string>();
  for (const row of session.items) m.set(row.playbookItemId, row.status);
  return m;
}

function summarize(
  platform: Platform,
  label: "Desktop" | "Mobile",
  operator: Operator,
  sessions: CaptureSession[],
): PlatformCoverage {
  const brandSessions = sessions
    .filter(
      (s) =>
        s.playbookId === COVERAGE_PACK_ID &&
        s.platform === platform &&
        s.status !== "abandoned",
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const session = brandSessions[0] ?? null;
  const steps = coverageStepsForProducts(operator.products);

  if (!session) {
    const requiredTotal = steps.filter((s) => s.required).length;
    const journeys = coverageJourneyProgress(steps, new Map());
    return {
      platform,
      label,
      session: null,
      journeysComplete: 0,
      journeysTotal: journeys.length,
      requiredDone: 0,
      requiredTotal,
      complete: false,
      inProgress: false,
    };
  }

  const statuses = statusMap(session);
  const journeys = coverageJourneyProgress(steps, statuses);
  const required = steps.filter((s) => s.required);
  const requiredDone = required.length - missingRequiredJourneySteps(steps, statuses).length;
  const journeysComplete = journeys.filter((j) => j.complete).length;
  const stepsComplete =
    missingRequiredJourneySteps(steps, statuses).length === 0;
  const complete =
    (session.status === "done" || session.status === "review") && stepsComplete;

  return {
    platform,
    label,
    session,
    journeysComplete,
    journeysTotal: journeys.length,
    requiredDone,
    requiredTotal: required.length,
    complete,
    inProgress: session.status === "in_progress" || session.status === "review",
  };
}

/** Dual desktop/mobile brand E2E scoreboard for an operator. */
export function platformCoverageForOperator(
  operator: Operator,
  sessions: CaptureSession[],
): { desktop: PlatformCoverage; mobile: PlatformCoverage } {
  return {
    desktop: summarize("desktop_web", "Desktop", operator, sessions),
    mobile: summarize("mobile_web", "Mobile", operator, sessions),
  };
}
