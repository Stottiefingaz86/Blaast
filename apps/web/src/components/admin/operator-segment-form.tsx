"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminOutlineBtn,
  adminPrimaryBtn,
} from "@/components/admin/admin-ui";
import type {
  Operator,
  OperatorReferenceTier,
  OperatorVertical,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const VERTICAL_OPTIONS: { id: OperatorVertical; label: string }[] = [
  { id: "crypto_casino", label: "Crypto casino" },
  { id: "traditional_sportsbook", label: "Traditional sportsbook" },
  { id: "hybrid", label: "Hybrid" },
  { id: "other", label: "Other" },
];

const TIER_OPTIONS: { id: OperatorReferenceTier | ""; label: string }[] = [
  { id: "", label: "Not in reference set" },
  { id: "notable", label: "Notable" },
  { id: "core", label: "Core" },
];

export function OperatorSegmentForm({ operator }: { operator: Operator }) {
  const router = useRouter();
  const [vertical, setVertical] = useState<OperatorVertical>(
    operator.vertical ?? "other",
  );
  const [referenceTier, setReferenceTier] = useState<
    OperatorReferenceTier | ""
  >(operator.referenceTier ?? "");
  const [regions, setRegions] = useState(
    (operator.regions ?? operator.markets ?? []).join(", "),
  );
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/operators/${operator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical,
          referenceTier: referenceTier || null,
          regions: regions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Segment saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-black/[0.06] bg-white p-6">
      <h2 className="text-[13px] font-semibold">Pattern intelligence</h2>
      <p className="mt-1 text-[12px] text-neutral-500">
        Vertical + reference tier power MCP most_used / notable_flows answers.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {VERTICAL_OPTIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVertical(v.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                vertical === v.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIER_OPTIONS.map((t) => (
            <button
              key={t.id || "none"}
              type="button"
              onClick={() => setReferenceTier(t.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                referenceTier === t.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-neutral-500">
          Regions (comma-separated)
          <input
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            className="h-9 rounded-xl border border-neutral-200 px-3 text-[13px] text-neutral-900"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => void save()}
            className={adminPrimaryBtn("disabled:opacity-50")}
          >
            {pending ? "Saving…" : "Save segment"}
          </button>
          <button
            type="button"
            className={adminOutlineBtn()}
            onClick={() => {
              setVertical(operator.vertical ?? "other");
              setReferenceTier(operator.referenceTier ?? "");
              setRegions((operator.regions ?? operator.markets ?? []).join(", "));
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
