import type { Metadata } from "next";
import { McpLanding } from "@/components/marketing/mcp-landing";

export const metadata: Metadata = {
  title: "Blaast MCP — Operator screens & flows for agents",
  description:
    "Connect Cursor, Claude, and other agents to Blaast’s iGaming UI library via MCP.",
};

export default function McpPage() {
  return <McpLanding />;
}
