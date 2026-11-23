/** Blaast platform offerings — Mobbin-parity tiers, iGaming content labels. */

export type PlanId = "free" | "pro" | "team" | "enterprise";

export type FeatureValue = boolean | string;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  popular?: boolean;
  priceMonthly: number | null;
  priceYearlyPerMonth: number | null;
  seats: string;
  cta: string;
  highlights: string[];
};

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Browse a limited library.",
    priceMonthly: 0,
    priceYearlyPerMonth: 0,
    seats: "1 member",
    cta: "Get started",
    highlights: ["Limited operators", "Max 3 collections", "Best-effort support"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For individuals and freelancers.",
    popular: true,
    priceMonthly: 15,
    priceYearlyPerMonth: 10,
    seats: "1 member only",
    cta: "Upgrade to Pro",
    highlights: [
      "All operators & web",
      "Flows & animations",
      "Unlimited collections",
      "AI credits",
      "Deep Search",
      "MCP",
      "Hide screen footers",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For teams and agencies.",
    priceMonthly: 24,
    priceYearlyPerMonth: 16,
    seats: "1 or more members",
    cta: "Upgrade to Team",
    highlights: [
      "Everything in Pro",
      "Invite teammates",
      "Shared collections & comments",
      "Team management",
      "Centralized billing",
      "2× AI credits",
      "API access",
      "Slack (Soon)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For advanced usage and scale.",
    priceMonthly: null,
    priceYearlyPerMonth: null,
    seats: "Unlimited members",
    cta: "Contact us",
    highlights: [
      "Everything in Team",
      "Advanced security",
      "Priority support",
      "Privacy controls",
      "SAML & SCIM",
      "Invoice / PO billing",
      "Early access tools",
    ],
  },
];

export type MatrixRow = {
  key: string;
  label: string;
  hint?: string;
  values: Record<PlanId, FeatureValue>;
};

export type MatrixSection = {
  id: string;
  title: string;
  rows: MatrixRow[];
};

/** Full Mobbin-style comparison — Blaast iGaming labels. */
export const FEATURE_MATRIX: MatrixSection[] = [
  {
    id: "content",
    title: "Content",
    rows: [
      {
        key: "operators",
        label: "Operators",
        values: { free: "Limited", pro: true, team: true, enterprise: true },
      },
      {
        key: "web",
        label: "Web",
        values: { free: "Limited", pro: true, team: true, enterprise: true },
      },
      {
        key: "flows",
        label: "Flows",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
      {
        key: "animations",
        label: "Animations",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
      {
        key: "search",
        label: "Search",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
      {
        key: "igaming_plus",
        label: "iGaming+",
        hint: "Deeper sportsbook / casino / cashier packs",
        values: {
          free: false,
          pro: false,
          team: "Add-on",
          enterprise: "Add-on",
        },
      },
    ],
  },
  {
    id: "features",
    title: "Features",
    rows: [
      {
        key: "collections",
        label: "Collections",
        values: { free: "Max 3", pro: true, team: true, enterprise: true },
      },
      {
        key: "copy_download",
        label: "Copy & download",
        values: { free: "Limited", pro: true, team: true, enterprise: true },
      },
      {
        key: "version_history",
        label: "Version history",
        values: { free: "Limited", pro: true, team: true, enterprise: true },
      },
      {
        key: "hide_footers",
        label: "Hide screen footers",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    rows: [
      {
        key: "ai_credits",
        label: "AI credits",
        hint: "Used for Deep Search and agent prompts",
        values: { free: false, pro: "300", team: "600", enterprise: "Custom" },
      },
      {
        key: "deep_search",
        label: "Deep Search",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
      {
        key: "mcp",
        label: "MCP",
        hint: "Connect Cursor, Claude, ChatGPT, and more",
        values: { free: false, pro: true, team: true, enterprise: true },
      },
      {
        key: "api",
        label: "API access",
        hint: "Build on Blaast APIs for your own apps and tools",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
    ],
  },
  {
    id: "collaboration",
    title: "Collaboration",
    rows: [
      {
        key: "invite",
        label: "Invite team members",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
      {
        key: "shared_collections",
        label: "Shared collections",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
      {
        key: "comments",
        label: "Comments & mentions",
        values: {
          free: false,
          pro: "Just you",
          team: true,
          enterprise: true,
        },
      },
      {
        key: "slack",
        label: "Slack integration",
        values: {
          free: false,
          pro: false,
          team: "Soon",
          enterprise: "Soon",
        },
      },
    ],
  },
  {
    id: "admin",
    title: "Admin & security",
    rows: [
      {
        key: "team_mgmt",
        label: "Team management",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
      {
        key: "central_billing",
        label: "Centralized billing",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
      {
        key: "soc2",
        label: "SOC 2 reports",
        values: { free: false, pro: false, team: true, enterprise: true },
      },
      {
        key: "advanced_security",
        label: "Advanced security",
        values: { free: false, pro: false, team: false, enterprise: true },
      },
      {
        key: "privacy",
        label: "Privacy controls",
        values: { free: false, pro: false, team: false, enterprise: true },
      },
      {
        key: "saml_scim",
        label: "SAML & SCIM",
        hint: "SSO + automated user provisioning",
        values: { free: false, pro: false, team: false, enterprise: true },
      },
      {
        key: "invoice",
        label: "Invoice / PO billing",
        values: { free: false, pro: false, team: false, enterprise: true },
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    rows: [
      {
        key: "email",
        label: "Email support",
        values: {
          free: "Best effort",
          pro: true,
          team: true,
          enterprise: true,
        },
      },
      {
        key: "priority",
        label: "Priority support",
        values: { free: false, pro: false, team: false, enterprise: true },
      },
    ],
  },
  {
    id: "other",
    title: "Other",
    rows: [
      {
        key: "invite_earn",
        label: "Invite & earn rewards",
        values: { free: false, pro: true, team: false, enterprise: false },
      },
    ],
  },
];

export function creditsForPlan(plan: PlanId): number {
  switch (plan) {
    case "pro":
      return 300;
    case "team":
      return 600;
    case "enterprise":
      return 5000;
    default:
      return 0;
  }
}

export function planAllowsMcp(plan: PlanId): boolean {
  return plan !== "free";
}

export function planAllowsScim(plan: PlanId): boolean {
  return plan === "enterprise";
}

export function planAllowsApi(plan: PlanId): boolean {
  return plan === "team" || plan === "enterprise";
}
