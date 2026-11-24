"use client";

import Link from "next/link";
import {
  LibraryOverlay,
  OverlayFaq,
  OverlayStepCards,
} from "@/components/library/library-overlay";

const STEPS = [
  {
    title: "Browse published brands",
    body: "Open Library to explore Winna, Rainbet and other captured operators — screens, UI and flows with real video.",
  },
  {
    title: "Open flows & UI in theater",
    body: "Click a flow or UI element to open the Mobbin-style stage with step navigation and copyable agent prompts.",
  },
  {
    title: "Save on tiles",
    body: "Hover any brand tile and use the bookmark to favourites or a personal collection on this device.",
  },
];

const FAQ = [
  {
    q: "Where do the videos come from?",
    a: "Human-led captures published by Blaast curators. Only reviewed clips appear in the library — never passwords, cookies or payment data.",
  },
  {
    q: "How do I capture a new brand?",
    a: "Staff with Capture access use Admin → brand desk → Record. Follow the VPN hint for that operator’s region before sharing the window.",
  },
  {
    q: "What is the agent prompt?",
    a: "A rights-aware brief you can paste into Cursor or your design agent to rebuild a pattern under your own design system — not a copy of competitor assets.",
  },
  {
    q: "Are favourites synced to the cloud?",
    a: "Not yet. Favourites and collections stay private on this browser. Cloud sync lands with team workspaces.",
  },
];

export function KnowledgeBaseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <LibraryOverlay
      open={open}
      onClose={onClose}
      size="wide"
      title="Help center"
      subtitle="How Blaast works"
    >
      <div className="space-y-8 pb-2">
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#a3a3a3]">
          Short guide for the library, theater viewers and capture. For billing
          or team seats, use Settings.
        </p>

        <OverlayStepCards steps={STEPS} />

        <div className="flex flex-wrap gap-2">
          {(
            [
              { href: "/library", label: "Open library" },
              { href: "/settings/mcp", label: "MCP setup" },
              { href: "/settings/billing", label: "Billing" },
            ] as const
          ).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-full border border-white/[0.12] px-4 text-[12px] font-medium text-[#cfcfcf] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <OverlayFaq items={FAQ} />
      </div>
    </LibraryOverlay>
  );
}
