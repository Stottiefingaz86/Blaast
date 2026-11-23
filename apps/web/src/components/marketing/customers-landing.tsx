"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/marketing/site-nav";

const STORIES = [
  {
    brand: "CURSOR",
    line: "How product teams offload the 20% of pattern research to Blaast.",
  },
  {
    brand: "Studio",
    line: "How a solo designer shipped betslip iterations without hiring.",
  },
  {
    brand: "Operator",
    line: "How a casino product team studied flows they couldn't open in-market.",
  },
];

export function CustomersLanding() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-neutral-950">
      <div className="mx-auto max-w-[1200px] px-3 pt-3 pb-16">
        <div className="overflow-hidden rounded-[28px] bg-white">
          <MarketingNav solid />
          <div className="px-6 py-16 text-center sm:px-12">
            <h1 className="animate-fade-up text-3xl font-semibold tracking-tight sm:text-4xl">
              Trusted by teams that build world-class iGaming products.
            </h1>
            <Link
              href="/login"
              className="animate-fade-up stagger-1 mt-6 inline-flex h-10 items-center rounded-full bg-neutral-100 px-5 text-[13px] font-medium transition-colors hover:bg-neutral-200"
            >
              Read stories
            </Link>
            <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
              {STORIES.map((s, i) => (
                <article
                  key={s.brand}
                  className={`animate-fade-up group rounded-2xl border border-neutral-100 bg-neutral-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg stagger-${i + 1}`}
                >
                  <p className="text-[13px] font-semibold tracking-wide uppercase">
                    {s.brand}
                  </p>
                  <p className="mt-8 text-[15px] leading-snug text-neutral-700">
                    {s.line}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
