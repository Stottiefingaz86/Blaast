import { platformCoverageForOperator } from "@/lib/admin/platform-coverage";
import type { CaptureSession, Operator } from "@/lib/admin/types";
import { vpnHintForBrand, type VpnHint } from "@/lib/admin/vpn-hint";
import { OPERATOR_LOGOS } from "@/lib/marketing/operator-logos";

export type CaptureQueueStatus =
  | "todo"
  | "in_progress"
  | "captured"
  | "reviewed";

export type CaptureQueueRow = {
  rank: number;
  id: string;
  name: string;
  domain: string;
  verticals: string[];
  regions: string[];
  status: CaptureQueueStatus;
  operatorId?: string;
  desktopLabel?: string;
  mobileLabel?: string;
  /** Suggested VPN exit for capture */
  vpn: VpnHint;
};

function hostKey(hostname: string) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

/**
 * 100-site capture backlog (from OPERATOR_LOGOS / tasks/05-operator-capture-queue.md)
 * with live status from admin operators + sessions.
 */
export function buildCaptureQueue(
  operators: Operator[],
  sessions: CaptureSession[],
): CaptureQueueRow[] {
  const byHost = new Map(
    operators.map((o) => [hostKey(o.hostname), o] as const),
  );

  return OPERATOR_LOGOS.map((logo, i) => {
    const op = byHost.get(hostKey(logo.domain));
    const regions = op?.regions?.length
      ? op.regions
      : logo.regions;
    const markets = op?.markets ?? [];
    const vpn = vpnHintForBrand({
      domain: logo.domain,
      regions,
      markets,
    });

    if (!op) {
      return {
        rank: i + 1,
        id: logo.id,
        name: logo.alt,
        domain: logo.domain,
        verticals: logo.verticals,
        regions,
        status: "todo" as const,
        vpn,
      };
    }

    const opSessions = sessions.filter((s) => s.operatorId === op.id);
    const { desktop, mobile } = platformCoverageForOperator(op, opSessions);
    let status: CaptureQueueStatus = "todo";
    if (desktop.complete && mobile.complete) status = "reviewed";
    else if (desktop.complete || mobile.complete) status = "captured";
    else if (desktop.inProgress || mobile.inProgress) status = "in_progress";
    else if (opSessions.length > 0) status = "in_progress";

    return {
      rank: i + 1,
      id: logo.id,
      name: logo.alt,
      domain: logo.domain,
      verticals: logo.verticals,
      regions,
      status,
      operatorId: op.id,
      desktopLabel: desktop.session
        ? `${desktop.journeysComplete}/${desktop.journeysTotal} desktop`
        : undefined,
      mobileLabel: mobile.session
        ? `${mobile.journeysComplete}/${mobile.journeysTotal} mobile`
        : undefined,
      vpn,
    };
  });
}

export function captureQueueSummary(rows: CaptureQueueRow[]) {
  const counts = {
    todo: 0,
    in_progress: 0,
    captured: 0,
    reviewed: 0,
  };
  for (const r of rows) counts[r.status] += 1;
  return counts;
}
