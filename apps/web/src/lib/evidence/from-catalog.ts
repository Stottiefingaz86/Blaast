import {
  getFlow,
  type CatalogFlow,
  type CatalogOperator,
  type FlowStep,
  type SurfaceKind,
} from "@/lib/library/catalog";
import type {
  FlowEvidence,
  StepEvidence,
  StepObservation,
  UiRole,
} from "@/lib/evidence/types";

/** Map demo catalog flow → typed evidence (confidence: demo until capture fills artifacts). */
export function loadFlowEvidence(flowId: string): FlowEvidence | null {
  const hit = getFlow(flowId);
  if (!hit) return null;
  return enrichCatalogFlow(hit.operator, hit.flow);
}

export function enrichCatalogFlow(
  operator: CatalogOperator,
  flow: CatalogFlow,
): FlowEvidence {
  const steps = flow.steps.map((step, index) =>
    enrichStep(step, index, operator, flow),
  );

  return {
    evidenceId: `ev-demo-${flow.id}`,
    flowId: flow.id,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    operatorTagline: operator.tagline,
    category: operator.category,
    group: flow.group,
    flowName: flow.name,
    actions: [...flow.actions],
    platform: operator.platform,
    hasVideo: flow.hasVideo,
    confidence: "demo",
    steps,
    tags: [flow.group, flow.name, operator.category].map((t) =>
      t.toLowerCase().replace(/\s+/g, "_"),
    ),
    libraryPath: `/flows/${flow.id}`,
  };
}

function enrichStep(
  step: FlowStep,
  index: number,
  operator: CatalogOperator,
  flow: CatalogFlow,
): StepEvidence {
  const roles = inferRoles(step.label, step.kind, flow);
  const observations: StepObservation[] = roles.map((role) => ({
    role,
    note: roleNote(role, step, operator),
    provenance: "inferred" as const,
  }));

  return {
    stepId: step.id,
    index,
    label: step.label,
    surfaceKind: step.kind,
    tags: [step.kind, flow.group].map((t) => t.toLowerCase()),
    goals: stepGoals(step, flow, index),
    observations,
    layoutNotes: layoutNotesFor(step, operator, flow, roles),
    artifacts: flow.hasVideo
      ? [
          {
            kind: "video_frame",
            provenance: "unavailable",
          },
        ]
      : [
          {
            kind: "screenshot",
            provenance: "unavailable",
          },
        ],
  };
}

function inferRoles(
  label: string,
  kind: SurfaceKind,
  flow: CatalogFlow,
): UiRole[] {
  const l = label.toLowerCase();
  const roles: UiRole[] = [];

  if (/header|nav|home|lobby/.test(l)) roles.push("header", "nav");
  if (/ladder|price|back|lay|exchange/.test(l)) roles.push("odds_ladder", "odds_button");
  if (/odds|market|event|lines|in-play|live/.test(l)) {
    if (!roles.includes("odds_button")) roles.push("odds_button");
  }
  if (/betslip|ticket|stake/.test(l)) roles.push("betslip", "cta_primary");
  if (/confirm|matched|receipt|placed/.test(l)) roles.push("receipt", "cta_primary");
  if (/deposit|wallet|cashier|pay/.test(l)) roles.push("wallet", "form", "cta_primary");
  if (/login|register|kyc|account/.test(l) || kind === "account") {
    roles.push("form");
  }
  if (/casino|game/.test(l) || kind === "casino") roles.push("game_grid");
  if (/search/.test(l)) roles.push("search");
  if (/modal|sheet|dialog/.test(l)) roles.push("modal");

  if (roles.length === 0) {
    if (kind === "sportsbook") roles.push("odds_button", "nav");
    else if (kind === "cashier") roles.push("wallet", "form");
    else if (kind === "casino") roles.push("game_grid");
    else roles.push("other");
  }

  if (flow.actions.includes("Confirming") && /confirm|ticket|stake|matched/.test(l)) {
    if (!roles.includes("cta_primary")) roles.push("cta_primary");
  }

  return [...new Set(roles)];
}

function roleNote(
  role: UiRole,
  step: FlowStep,
  operator: CatalogOperator,
): string {
  const map: Record<UiRole, string> = {
    header: `${operator.platform} top chrome with brand mark area and primary nav — adapt spacing, do not copy mark.`,
    nav: `Primary navigation / rail for ${step.kind} surfaces.`,
    odds_ladder: `Dense price ladder (back/lay or multi-line odds) — emphasize scanability and selection affordance.`,
    odds_button: `Tappable odds / price control that advances the bet journey.`,
    betslip: `Persistent or sheet betslip summarizing selection, stake, and potential return.`,
    cta_primary: `Primary confirm / place action — high contrast, single dominant action.`,
    cta_secondary: `Secondary dismiss / edit action near primary.`,
    form: `Form fields for amount, credentials, or method — never capture secrets in evidence.`,
    wallet: `Balance / funding context near stake or deposit controls.`,
    game_grid: `Game or tile grid for discovery.`,
    feed: `Activity or activity-style list.`,
    modal: `Modal or bottom sheet over base surface.`,
    tab_bar: `Segmented or tab navigation between sections.`,
    receipt: `Post-confirm state: matched bet, ticket id, or success summary.`,
    search: `Search / filter control for markets or games.`,
    other: `Supporting UI for this step.`,
  };
  return map[role];
}

function stepGoals(
  step: FlowStep,
  flow: CatalogFlow,
  index: number,
): string[] {
  const l = step.label.toLowerCase();
  const goals: string[] = [];

  if (index === 0) goals.push("Orient the user in the product surface and offer a clear next selection.");
  if (/market|event|home|lobby|lines/.test(l)) {
    goals.push("Present selectable markets or events without cluttering the primary action.");
  }
  if (/ladder|odds|ticket|betslip/.test(l)) {
    goals.push("Make selection state obvious and keep stake / confirm within reach.");
  }
  if (/confirm|matched|receipt/.test(l)) {
    goals.push("Confirm outcome and show status the user can trust (matched, pending, failed).");
  }
  if (/deposit|wallet/.test(l)) {
    goals.push("Collect funding method and amount with clear trust cues; no secret capture.");
  }
  if (goals.length === 0) {
    goals.push(`Advance the “${flow.name}” journey through “${step.label}”.`);
  }
  if (flow.actions.length) {
    goals.push(`Support actions: ${flow.actions.join(", ")}.`);
  }
  return goals;
}

function layoutNotesFor(
  step: FlowStep,
  operator: CatalogOperator,
  flow: CatalogFlow,
  roles: UiRole[],
): string[] {
  const notes: string[] = [
    `Platform: ${operator.platform}. Surface: ${step.kind}.`,
    `Treat observations as ${flow.hasVideo ? "video-journey inferred" : "screen inferred"} demo evidence — replace with measured capture when available.`,
  ];

  if (roles.includes("odds_ladder")) {
    notes.push(
      "Two-column or multi-depth price presentation; selection highlight should survive scroll.",
    );
  }
  if (roles.includes("betslip")) {
    notes.push(
      operator.platform === "mobile"
        ? "Mobile: betslip as bottom sheet or sticky footer over content."
        : "Web: side panel or docked betslip beside markets.",
    );
  }
  if (roles.includes("cta_primary")) {
    notes.push("One primary CTA per viewport; secondary actions visually quieter.");
  }
  if (roles.includes("wallet")) {
    notes.push("Show balance near stake; payment entry screens must stay out of shared evidence.");
  }

  notes.push(
    "Do not copy logos, proprietary illustrations, or trademarked copy — adapt pattern to the customer design system.",
  );
  return notes;
}
