"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/library/session";
import { useAccountOptional } from "@/lib/platform/account-store";
import { planAllowsMcp, type PlanId } from "@/lib/platform/plans";

export const MCP_UPGRADE_MESSAGE =
  "Your plan is Free — upgrade to Pro to use MCP prompts and connect agents.";

/** Effective plan: auth session wins over demo account store. */
export function useEffectivePlan(): PlanId {
  const { user } = useSession();
  const account = useAccountOptional();
  return (user?.plan ?? account?.plan ?? "free") as PlanId;
}

export function useMcpAccess() {
  const plan = useEffectivePlan();
  const router = useRouter();
  const allowed = planAllowsMcp(plan);

  return useMemo(
    () => ({
      plan,
      allowed,
      message: MCP_UPGRADE_MESSAGE,
      /** Lock handler — send free users to pricing */
      requireMcp: (onAllowed?: () => void) => {
        if (allowed) {
          onAllowed?.();
          return true;
        }
        router.push("/pricing?upgrade=mcp");
        return false;
      },
    }),
    [allowed, plan, router],
  );
}
