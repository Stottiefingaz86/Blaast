"use client";

import Link from "next/link";
import { useAccount } from "@/lib/platform/account-store";
import { PLANS, type PlanId } from "@/lib/platform/plans";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const account = useAccount();
  const plan = PLANS.find((p) => p.id === account.plan)!;
  const price =
    account.billingInterval === "yearly"
      ? plan.priceYearlyPerMonth
      : plan.priceMonthly;

  const usageLabel =
    account.creditsUsed < account.creditsAllowance * 0.5
      ? "Normal"
      : account.creditsUsed < account.creditsAllowance * 0.85
        ? "Elevated"
        : "High";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight capitalize">
        {plan.name}
      </h1>

      {account.plan !== "free" && account.plan !== "enterprise" && (
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13px] text-neutral-300">
          Your next bill of €{price ?? 0} will be charged on{" "}
          {formatDate(account.nextBillDate)} to your card ending in ••••{" "}
          {account.cardLast4}.{" "}
          <button type="button" className="underline decoration-white/30 hover:decoration-white">
            See billing details
          </button>
        </div>
      )}

      <p className="mt-6 text-3xl font-semibold tracking-tight">
        {price == null ? (
          "Custom"
        ) : (
          <>
            €{price}
            <span className="text-[15px] font-normal text-neutral-500">
              /month
            </span>
          </>
        )}
      </p>

      <p className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-neutral-400">
        Plan changes are managed by Blaast admin. Contact support if you need
        Pro, Team, or Enterprise — there is no self-serve upgrade.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center rounded-full border border-white/[0.15] px-4 text-[13px] font-medium transition-colors hover:bg-white/[0.06]"
        >
          View plan features
        </Link>
      </div>

      {/* AI credits */}
      <section className="mt-12 border-t border-white/[0.08] pt-8">
        <h2 className="text-lg font-semibold">AI usage</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          For features such as Deep Search and agent prompts
        </p>

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-neutral-300">
          <span className="mr-2 rounded-md bg-white/[0.1] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            Beta
          </span>
          Usage is unlimited during beta. Limits will apply later —{" "}
          <button type="button" className="underline decoration-white/30">
            Learn more
          </button>
        </div>

        <p className="mt-6 text-[14px]">
          Your monthly usage is{" "}
          <span className="font-semibold">
            {usageLabel} ({account.creditsUsed} credits)
          </span>
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">
          Allowance {account.creditsAllowance} · Remaining{" "}
          {account.creditsRemaining} · Resets Dec 11
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                (account.creditsUsed / Math.max(1, account.creditsAllowance)) *
                  100,
              )}%`,
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => account.addCredits(100)}
            disabled={account.plan === "free"}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-[13px] font-medium transition-all",
              account.plan === "free"
                ? "cursor-not-allowed bg-white/[0.06] text-neutral-500"
                : "bg-white/[0.1] text-white hover:bg-white/[0.14]",
            )}
          >
            Add credits
          </button>
          <button
            type="button"
            onClick={() => account.spendCredits(5)}
            className="inline-flex h-10 items-center rounded-full border border-white/[0.12] px-4 text-[13px] text-neutral-300 hover:bg-white/[0.06]"
          >
            Simulate Deep Search (−5)
          </button>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-[12px] text-neutral-500">Switch plan (demo)</p>
          <div className="flex flex-wrap gap-2">
            {(["free", "pro", "team", "enterprise"] as PlanId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => account.setPlan(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] capitalize transition-all",
                  account.plan === id
                    ? "bg-white text-neutral-950"
                    : "bg-white/[0.06] text-neutral-400 hover:text-white",
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
