"use client";

import { useEffect, useState } from "react";
import { AI_TOOLS, type AiToolMark } from "@/lib/marketing/ai-tools";
import { cn } from "@/lib/utils";

/** “…pull patterns into [logo Cursor] via MCP” with rotating AI clients. */
export function McpRotator({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const tool = AI_TOOLS[idx % AI_TOOLS.length]!;

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase("out");
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % AI_TOOLS.length);
        setPhase("in");
      }, 220);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={cn("inline-flex flex-wrap items-center justify-center gap-x-1.5", className)}>
      pull patterns into
      <AiBubble tool={tool} phase={phase} />
      via MCP
    </span>
  );
}

function AiBubble({
  tool,
  phase,
}: {
  tool: AiToolMark;
  phase: "in" | "out";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 align-middle",
        phase === "in" ? "logo-bubble-enter" : "logo-bubble-exit",
      )}
    >
      <span
        className="inline-flex size-[1.35em] items-center justify-center rounded-[22%] text-[0.7em] font-bold shadow-sm ring-1 ring-black/10"
        style={{ background: tool.bg, color: tool.fg }}
        title={tool.name}
        aria-hidden
      >
        {tool.glyph}
      </span>
      <span className="font-semibold text-neutral-800">{tool.short}</span>
    </span>
  );
}
