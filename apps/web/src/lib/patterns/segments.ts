import type { Operator, OperatorVertical } from "@/lib/admin/types";

export function operatorVertical(op: Operator): OperatorVertical {
  return op.vertical ?? "other";
}

export function operatorRegions(op: Operator): string[] {
  return op.regions?.length ? op.regions : op.markets ?? [];
}

export function isNotableOperator(op: Operator): boolean {
  return op.referenceTier === "notable" || op.referenceTier === "core";
}

export function slugFromHostname(hostname: string) {
  return hostname.replace(/\./g, "-");
}
