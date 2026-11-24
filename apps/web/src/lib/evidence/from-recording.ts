import { coverageStepById } from "@/lib/admin/coverage-pack";
import type { CaptureSession, Operator, RecordingArtifact } from "@/lib/admin/types";
import { summarizeStructure } from "@/lib/evidence/structure-summary";
import {
  loadStructureSnapshot,
} from "@/lib/evidence/structure-persist";
import { storagePublicUrl } from "@/lib/storage/captures";
import type {
  FlowEvidence,
  StepEvidence,
  StructureCompleteness,
  UiRole,
} from "@/lib/evidence/types";

/**
 * Build FlowEvidence from an approved admin recording session.
 * Includes measured structure regions + motion hints when structure JSON exists.
 */
export async function flowEvidenceFromRecording(
  operator: Operator,
  session: CaptureSession,
  opts?: { flowId?: string; baseUrl?: string },
): Promise<FlowEvidence | null> {
  const artifacts = (session.artifacts ?? []).filter(
    (a) => a.reviewStatus === "approved",
  );
  if (!artifacts.length) return null;

  const flowFilter = opts?.flowId;
  const stepsSource = artifacts
    .filter((a) => {
      if (!flowFilter) return true;
      const cov = coverageStepById(a.coverageStepId);
      return cov?.flowId === flowFilter || a.coverageStepId.includes(flowFilter);
    })
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  if (!stepsSource.length) return null;

  const base = opts?.baseUrl?.replace(/\/$/, "") ?? "";
  const steps: StepEvidence[] = [];
  for (let index = 0; index < stepsSource.length; index++) {
    steps.push(await artifactToStep(stepsSource[index]!, index, session.id, base));
  }

  const flowId =
    flowFilter ||
    coverageStepById(stepsSource[0]!.coverageStepId)?.flowId ||
    "coverage";

  const tags = [...new Set(steps.flatMap((s) => s.tags))];

  return {
    evidenceId: `ev-rec-${session.id}-${flowId}`,
    flowId: `${operator.hostname}-${flowId}`,
    operatorSlug: operator.hostname,
    operatorName: operator.name,
    operatorTagline: operator.url,
    category: operator.products[0] || "cross_product",
    group: flowId,
    flowName: flowId.replaceAll("_", " "),
    actions: steps.map((s) => s.label),
    platform: session.platform === "mobile_web" ? "mobile" : "web",
    hasVideo: stepsSource.some((a) => Boolean(a.videoPath)),
    confidence: "reviewed",
    steps,
    tags,
    sessionId: session.id,
    libraryPath: `/admin/capture/${session.id}`,
  };
}

async function artifactToStep(
  art: RecordingArtifact,
  index: number,
  sessionId: string,
  base: string,
): Promise<StepEvidence> {
  const cov = coverageStepById(art.coverageStepId);
  const label = cov?.instruction ?? art.coverageStepId;
  const annotationTags = (art.annotations ?? []).flatMap((a) => [
    a.tag,
    ...(a.label ? [a.label.toLowerCase().replace(/\s+/g, "_")] : []),
  ]);
  const tags = [...new Set([...(cov?.tags ?? []), ...annotationTags])];
  const posterUrl = art.posterPath
    ? `${base}/api/admin/sessions/${sessionId}/artifacts/${art.id}?file=poster`
    : undefined;
  const videoUrl = art.videoPath
    ? `${base}/api/admin/sessions/${sessionId}/artifacts/${art.id}?file=video`
    : undefined;
  let structureRegions: StepEvidence["structureRegions"];
  let motionHints: StepEvidence["motionHints"];
  const layoutNotes: string[] = [];

  if (art.pageUrl) layoutNotes.push(`Captured at ${art.pageUrl}`);
  if (art.viewport) {
    layoutNotes.push(
      `Viewport ${art.viewport.width}×${art.viewport.height} @${art.viewport.devicePixelRatio}x`,
    );
  }
  for (const a of art.annotations ?? []) {
    const when =
      a.atMs != null ? ` @${Math.round(a.atMs / 1000)}s` : "";
    const box = a.region
      ? ` region ${Math.round(a.region.x)}%,${Math.round(a.region.y)}% ${Math.round(a.region.w)}×${Math.round(a.region.h)}%`
      : "";
    layoutNotes.push(
      a.comment
        ? `Tag “${a.label}”${when}${box}: ${a.comment}`
        : `Tagged: ${a.label}${when}${box}`,
    );
  }

  let completeness: StructureCompleteness = {
    kind: art.structurePath ? "unreadable" : "missing",
    source: "none",
    highFidelityCapable: false,
    hasStyles: false,
    hasMotion: false,
    hasViewport: Boolean(art.viewport),
    nodeCount: 0,
    structureUrl: art.structurePath
      ? storagePublicUrl(art.structurePath.replace(/^\//, "")) || undefined
      : undefined,
  };

  if (art.structurePath) {
    const loaded = await loadStructureSnapshot(art.structurePath);
    completeness = {
      kind: loaded.ok
        ? loaded.kind
        : loaded.error?.includes("malform") || loaded.error?.includes("must be")
          ? "unreadable"
          : loaded.kind === "missing"
            ? "missing"
            : "unreadable",
      source: loaded.source,
      highFidelityCapable: loaded.highFidelityCapable,
      hasStyles: false,
      hasMotion: false,
      hasViewport: Boolean(
        art.viewport ||
          (loaded.raw &&
            typeof loaded.raw === "object" &&
            (loaded.raw as { viewport?: unknown }).viewport),
      ),
      nodeCount: 0,
      error: loaded.error,
      structureUrl: completeness.structureUrl,
    };

    if (loaded.ok && loaded.raw) {
      const summary = summarizeStructure(loaded.raw);
      structureRegions = summary.regions;
      motionHints = summary.motionHints;
      const nodes = Array.isArray((loaded.raw as { nodes?: unknown }).nodes)
        ? ((loaded.raw as { nodes: unknown[] }).nodes)
        : [];
      completeness.nodeCount = nodes.length;
      completeness.hasStyles = nodes.some(
        (n) =>
          n &&
          typeof n === "object" &&
          (n as { styles?: unknown }).styles &&
          typeof (n as { styles: unknown }).styles === "object",
      );
      completeness.hasMotion = Boolean(motionHints?.length);
      completeness.kind = loaded.kind;
      completeness.highFidelityCapable = loaded.highFidelityCapable;

      layoutNotes.push(
        `Structure: ${loaded.kind} via ${loaded.source}` +
          (loaded.highFidelityCapable ? " (high-fidelity capable)" : " (not high-fidelity)"),
      );
      if (summary.tokenHints.length) {
        layoutNotes.push(
          `CSS variables (sample): ${summary.tokenHints.slice(0, 8).join("; ")}`,
        );
      }
      if (motionHints?.length) {
        layoutNotes.push(
          `Measured motion: ${motionHints
            .slice(0, 5)
            .map(
              (m) =>
                `${m.name}${m.durationMs != null ? ` ${m.durationMs}ms` : ""}${m.easing ? ` ${m.easing}` : ""}`,
            )
            .join("; ")}`,
        );
      }
      if (loaded.kind === "synthetic") {
        layoutNotes.push(
          "Structure is synthetic_fallback — do not treat as High Fidelity measured CSS",
        );
      }
    } else {
      layoutNotes.push(
        `Structure unavailable: ${loaded.error || "unreadable"} (source=${loaded.source})`,
      );
    }
  } else {
    layoutNotes.push("Structure: missing");
  }

  const roles: UiRole[] = inferRoles(tags);

  return {
    stepId: art.id,
    index,
    label,
    surfaceKind: cov?.taxonomy ?? "screen",
    tags,
    coverageStepId: art.coverageStepId,
    goals: [label],
    observations: roles.map((role) => ({
      role,
      note: cov?.hint || label,
      provenance: "measured" as const,
    })),
    layoutNotes,
    structureRegions,
    motionHints,
    structureCompleteness: completeness,
    artifacts: [
      ...(posterUrl
        ? [
            {
              kind: "screenshot" as const,
              url: posterUrl,
              mimeType: "image/png" as const,
              provenance: "measured" as const,
            },
          ]
        : []),
      ...(videoUrl
        ? [
            {
              kind: "video" as const,
              url: videoUrl,
              mimeType: "video/webm" as const,
              provenance: "measured" as const,
            },
          ]
        : []),
    ],
  };
}

function inferRoles(tags: string[]): UiRole[] {
  const roles: UiRole[] = [];
  const t = tags.join(" ");
  if (/betslip/.test(t)) roles.push("betslip");
  if (/odds/.test(t)) roles.push("odds_button");
  if (/header/.test(t)) roles.push("header");
  if (/tab_bar|nav|side/.test(t)) roles.push("tab_bar");
  if (/game|casino|lobby/.test(t)) roles.push("game_grid");
  if (/feed|activity/.test(t)) roles.push("feed");
  if (/cashier|deposit|payment/.test(t)) roles.push("form");
  if (/search/.test(t)) roles.push("search");
  if (!roles.length) roles.push("other");
  return roles;
}
