"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminPrimaryBtn } from "@/components/admin/admin-ui";
import { PlatformCoverageBoard } from "@/components/admin/platform-coverage-board";
import { COVERAGE_PACK_ID } from "@/lib/admin/coverage-pack";
import type { PlatformCoverage } from "@/lib/admin/platform-coverage";
import type { CapturePlaybook, Platform } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export function StartCaptureForm({
  operatorId,
  playbooks,
  markets,
  platformCoverage,
}: {
  operatorId: string;
  playbooks: CapturePlaybook[];
  markets: string[];
  platformCoverage: {
    desktop: PlatformCoverage;
    mobile: PlatformCoverage;
  };
}) {
  const router = useRouter();
  const addons = useMemo(
    () => playbooks.filter((p) => p.id !== COVERAGE_PACK_ID),
    [playbooks],
  );

  const [mode, setMode] = useState<"brand" | "addon">("brand");
  const [addonId, setAddonId] = useState(addons[0]?.id ?? "");
  const [addonPlatform, setAddonPlatform] =
    useState<Platform>("desktop_web");
  const [market, setMarket] = useState(markets[0] ?? "");
  const [pending, setPending] = useState(false);

  async function startSession(opts: {
    playbookId: string;
    platform: Platform;
  }) {
    setPending(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          playbookId: opts.playbookId,
          platform: opts.platform,
          market: market || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const label =
        opts.platform === "mobile_web" ? "Mobile" : "Desktop";
      toast.success(
        opts.playbookId === COVERAGE_PACK_ID
          ? `${label} E2E journeys — capture window opening`
          : `Add-on · ${label} — capture window opening`,
      );
      router.push(`/admin/capture/${data.session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PlatformCoverageBoard
        desktop={platformCoverage.desktop}
        mobile={platformCoverage.mobile}
        onStartDesktop={() =>
          void startSession({
            playbookId: COVERAGE_PACK_ID,
            platform: "desktop_web",
          })
        }
        onStartMobile={() =>
          void startSession({
            playbookId: COVERAGE_PACK_ID,
            platform: "mobile_web",
          })
        }
      />

      <div className="flex flex-col gap-4 rounded-[20px] border border-black/[0.06] bg-white p-6">
        <div>
          <h2 className="text-[15px] font-semibold">More options</h2>
          <p className="mt-1 text-[13px] text-neutral-500">
            Market for the next session, or an add-on flow (VIP, cashier gap)
            after brand E2E is underway.
          </p>
        </div>

        <div className="flex gap-2 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setMode("brand")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              mode === "brand"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            Brand (use cards above)
          </button>
          <button
            type="button"
            onClick={() => setMode("addon")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              mode === "addon"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            Add-on flow
          </button>
        </div>

        {mode === "brand" ? (
          <p className="text-[13px] text-neutral-500">
            Use <strong className="font-medium text-neutral-800">Start Desktop E2E</strong>{" "}
            / <strong className="font-medium text-neutral-800">Start Mobile E2E</strong>{" "}
            above. Set market below if needed — it applies to the next start.
          </p>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-950">
            Add-ons only after brand E2E is underway. Prefer finishing Place a
            bet / Casino / Deposit on Desktop and Mobile first.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {mode === "addon" && (
            <>
              <div className="flex flex-col gap-2">
                <Label className="text-[12px] text-neutral-500">Add-on pack</Label>
                <Select
                  value={addonId}
                  onValueChange={(v) => v && setAddonId(v)}
                >
                  <SelectTrigger className="w-full rounded-xl border-neutral-200">
                    <SelectValue placeholder="Choose add-on" />
                  </SelectTrigger>
                  <SelectContent>
                    {addons.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[12px] text-neutral-500">Platform</Label>
                <Select
                  value={addonPlatform}
                  onValueChange={(v) => v && setAddonPlatform(v as Platform)}
                >
                  <SelectTrigger className="w-full rounded-xl border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop_web">Desktop web</SelectItem>
                    <SelectItem value="mobile_web">Mobile web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-neutral-500">Market</Label>
            <Select
              value={market || "__none"}
              onValueChange={(v) => {
                if (!v) return;
                setMarket(v === "__none" ? "" : v);
              }}
            >
              <SelectTrigger className="w-full rounded-xl border-neutral-200">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Any / unset</SelectItem>
                {markets.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "addon" && (
          <button
            type="button"
            disabled={pending || !addonId}
            onClick={() =>
              void startSession({
                playbookId: addonId,
                platform: addonPlatform,
              })
            }
            className={adminPrimaryBtn("w-fit disabled:opacity-50")}
          >
            {pending ? "Starting…" : "Start add-on"}
          </button>
        )}
      </div>
    </div>
  );
}
