"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  creditsForPlan,
  type PlanId,
} from "@/lib/platform/plans";

const STORAGE_KEY = "blaast.demo.account";

export type McpToolId =
  | "claude-code"
  | "claude"
  | "cursor"
  | "codex"
  | "chatgpt"
  | "manus"
  | "grok"
  | "figma"
  | "v0";

export type McpConnection = {
  id: string;
  toolId: McpToolId;
  label: string;
  connectedAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
};

export type ScimConfig = {
  enabled: boolean;
  endpoint: string;
  bearerHint: string;
  lastSyncAt: string | null;
};

export type AccountState = {
  plan: PlanId;
  billingInterval: "yearly" | "quarterly";
  creditsUsed: number;
  creditsBonus: number;
  nextBillDate: string;
  cardLast4: string;
  connections: McpConnection[];
  members: TeamMember[];
  scim: ScimConfig;
};

type AccountApi = AccountState & {
  ready: boolean;
  creditsAllowance: number;
  creditsRemaining: number;
  /** Platform Capture Desk / ops — owner or admin team role */
  isAdmin: boolean;
  self: TeamMember | null;
  setPlan: (plan: PlanId) => void;
  setBillingInterval: (v: "yearly" | "quarterly") => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  connectMcp: (toolId: McpToolId, label: string) => void;
  disconnectMcp: (id: string) => void;
  inviteMember: (email: string) => void;
  removeMember: (id: string) => void;
  setScimEnabled: (enabled: boolean) => void;
  rotateScimToken: () => void;
};

function resolveSelf(members: TeamMember[]): TeamMember | null {
  return (
    members.find((m) => m.email === "you@blaast.app") ??
    members.find((m) => m.name === "You") ??
    members[0] ??
    null
  );
}

const DEFAULT: AccountState = {
  plan: "free",
  billingInterval: "yearly",
  creditsUsed: 0,
  creditsBonus: 0,
  nextBillDate: "2027-02-11",
  cardLast4: "0000",
  connections: [],
  members: [
    {
      id: "m1",
      name: "You",
      email: "you@blaast.app",
      role: "member",
    },
  ],
  scim: {
    enabled: false,
    endpoint: "https://api.blaast.app/scim/v2",
    bearerHint: "blst_scim_••••••••",
    lastSyncAt: null,
  },
};

const AccountContext = createContext<AccountApi | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const creditsAllowance = creditsForPlan(state.plan) + state.creditsBonus;
  const creditsRemaining = Math.max(0, creditsAllowance - state.creditsUsed);

  const setPlan = useCallback((plan: PlanId) => {
    setState((s) => ({
      ...s,
      plan,
      creditsUsed: Math.min(s.creditsUsed, creditsForPlan(plan) + s.creditsBonus),
    }));
  }, []);

  const setBillingInterval = useCallback((billingInterval: "yearly" | "quarterly") => {
    setState((s) => ({ ...s, billingInterval }));
  }, []);

  const addCredits = useCallback((amount: number) => {
    setState((s) => ({ ...s, creditsBonus: s.creditsBonus + amount }));
  }, []);

  const spendCredits = useCallback((amount: number) => {
    let ok = false;
    setState((s) => {
      const allowance = creditsForPlan(s.plan) + s.creditsBonus;
      if (allowance - s.creditsUsed < amount) return s;
      ok = true;
      return { ...s, creditsUsed: s.creditsUsed + amount };
    });
    return ok;
  }, []);

  const connectMcp = useCallback((toolId: McpToolId, label: string) => {
    setState((s) => ({
      ...s,
      connections: [
        ...s.connections,
        {
          id: `mcp_${Date.now()}`,
          toolId,
          label,
          connectedAt: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
  }, []);

  const disconnectMcp = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      connections: s.connections.filter((c) => c.id !== id),
    }));
  }, []);

  const inviteMember = useCallback((email: string) => {
    setState((s) => ({
      ...s,
      members: [
        ...s.members,
        {
          id: `m_${Date.now()}`,
          name: email.split("@")[0] ?? "Member",
          email,
          role: "member",
        },
      ],
    }));
  }, []);

  const removeMember = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id || m.role === "owner"),
    }));
  }, []);

  const setScimEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({
      ...s,
      scim: {
        ...s.scim,
        enabled,
        lastSyncAt: enabled ? new Date().toISOString() : s.scim.lastSyncAt,
      },
    }));
  }, []);

  const rotateScimToken = useCallback(() => {
    setState((s) => ({
      ...s,
      scim: {
        ...s.scim,
        bearerHint: `blst_scim_${Math.random().toString(36).slice(2, 10)}••••`,
        lastSyncAt: new Date().toISOString(),
      },
    }));
  }, []);

  const self = useMemo(() => resolveSelf(state.members), [state.members]);
  /** Demo localStorage only — never use for capture desk / publish gates. */
  const isAdmin = self?.role === "owner" || self?.role === "admin";

  const value = useMemo<AccountApi>(
    () => ({
      ...state,
      ready,
      creditsAllowance,
      creditsRemaining,
      isAdmin,
      self,
      setPlan,
      setBillingInterval,
      addCredits,
      spendCredits,
      connectMcp,
      disconnectMcp,
      inviteMember,
      removeMember,
      setScimEnabled,
      rotateScimToken,
    }),
    [
      state,
      ready,
      creditsAllowance,
      creditsRemaining,
      isAdmin,
      self,
      setPlan,
      setBillingInterval,
      addCredits,
      spendCredits,
      connectMcp,
      disconnectMcp,
      inviteMember,
      removeMember,
      setScimEnabled,
      rotateScimToken,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return ctx;
}

/** Safe for chrome that may render outside settings (avatar menu). */
export function useAccountOptional() {
  return useContext(AccountContext);
}

export const MCP_CATALOG: {
  id: McpToolId;
  name: string;
  icon: string;
}[] = [
  { id: "claude-code", name: "Claude Code", icon: "✦" },
  { id: "claude", name: "Claude", icon: "✦" },
  { id: "cursor", name: "Cursor", icon: "⬚" },
  { id: "codex", name: "Codex", icon: "⌘" },
  { id: "chatgpt", name: "ChatGPT", icon: "◎" },
  { id: "manus", name: "Manus", icon: "✋" },
  { id: "grok", name: "Grok", icon: "⧸" },
  { id: "figma", name: "Figma", icon: "▣" },
  { id: "v0", name: "v0", icon: "v0" },
];
