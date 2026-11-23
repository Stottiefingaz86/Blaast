"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Check, Info } from "lucide-react";
import { MarketingNav } from "@/components/marketing/site-nav";
import {
  FEATURE_MATRIX,
  PLANS,
  type FeatureValue,
  type PlanId,
} from "@/lib/platform/plans";
import { useSession } from "@/lib/library/session";
import { cn } from "@/lib/utils";

export function PricingLanding() {
  const [interval, setInterval] = useState<"yearly" | "quarterly">("yearly");
  const { loggedIn } = useSession();
  /** No self-serve upgrade — request access / see current plan */
  const ctaHref = loggedIn ? "/settings/billing" : "/login?mode=signup";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-white/[0.06] bg-white text-neutral-950">
        <MarketingNav solid />
      </div>

      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <h1 className="animate-fade-up text-4xl font-semibold tracking-tight sm:text-5xl">
            Design like a Pro.
          </h1>
          <p className="animate-fade-up stagger-1 mx-auto mt-4 max-w-xl text-[15px] text-neutral-400">
            Full access to operators & web, unlimited collections, MCP, AI
            credits, and more. Paid plans are assigned by Blaast — no
            self-serve checkout yet.
          </p>

          <div className="animate-fade-up stagger-2 mt-8 inline-flex items-center rounded-full bg-white/[0.08] p-1">
            {(["yearly", "quarterly"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setInterval(v)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-medium capitalize transition-all",
                  interval === v
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:text-white",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          {interval === "yearly" && (
            <p className="mt-2 text-[12px] text-emerald-400/90">
              Save 33% on a yearly subscription
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.filter((p) => p.id !== "free").map((plan, i) => {
            const price =
              interval === "yearly"
                ? plan.priceYearlyPerMonth
                : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className={cn(
                  "animate-fade-up relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1",
                  plan.popular
                    ? "border-white/30 bg-white/[0.06]"
                    : "border-white/[0.08] bg-white/[0.02]",
                  `stagger-${i + 1}`,
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-950 uppercase">
                    Popular
                  </span>
                )}
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 text-[13px] text-neutral-400">
                  {plan.tagline}
                </p>
                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  {price == null ? (
                    "Custom"
                  ) : (
                    <>
                      €{price}
                      <span className="text-[13px] font-normal text-neutral-500">
                        {plan.id === "team"
                          ? " / member / month"
                          : " / month"}
                        {interval === "yearly" ? ", billed yearly" : ""}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-2 text-[12px] text-neutral-500">{plan.seats}</p>
                <ul className="mt-5 flex-1 space-y-2 text-[13px] text-neutral-300">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ctaHref}
                  className={cn(
                    "mt-6 inline-flex h-11 items-center justify-center rounded-full text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]",
                    plan.popular
                      ? "bg-white text-neutral-950"
                      : "border border-white/[0.15] text-white hover:bg-white/[0.06]",
                  )}
                >
                  {loggedIn ? "View my plan" : "Request access"}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Full matrix */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Compare plans
          </h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Feature
                  </th>
                  {(["free", "pro", "team", "enterprise"] as PlanId[]).map(
                    (id) => (
                      <th
                        key={id}
                        className="px-3 py-3 text-center font-semibold capitalize"
                      >
                        {id}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((section) => (
                  <Fragment key={section.id}>
                    <tr className="bg-white/[0.02]">
                      <td
                        colSpan={5}
                        className="px-4 py-2.5 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 text-neutral-300">
                          <span className="inline-flex items-center gap-1.5">
                            {row.label}
                            {row.hint && (
                              <span
                                title={row.hint}
                                className="cursor-help text-neutral-600"
                              >
                                <Info className="size-3.5" />
                              </span>
                            )}
                          </span>
                        </td>
                        {(["free", "pro", "team", "enterprise"] as PlanId[]).map(
                          (id) => (
                            <td key={id} className="px-3 py-3 text-center">
                              <Cell value={row.values[id]} />
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-center text-[12px] text-neutral-600">
          Demo pricing UI — Stripe checkout not wired yet. Plan & credits persist
          locally in settings after login.
        </p>
      </main>
    </div>
  );
}

function Cell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/[0.08] text-emerald-400">
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-neutral-700">—</span>;
  }
  return <span className="text-neutral-300">{value}</span>;
}
