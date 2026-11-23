/** MCP clients we mention on the lander — rotate in “into X via MCP”. */
export type AiToolMark = {
  id: string;
  name: string;
  /** Short label under bubble */
  short: string;
  /** Tailwind / inline bg for the mark tile */
  bg: string;
  fg: string;
  /** Letter or short glyph when no SVG */
  glyph: string;
};

export const AI_TOOLS: AiToolMark[] = [
  {
    id: "cursor",
    name: "Cursor",
    short: "Cursor",
    bg: "#000000",
    fg: "#ffffff",
    glyph: "⌘",
  },
  {
    id: "claude",
    name: "Claude",
    short: "Claude",
    bg: "#D4A27F",
    fg: "#1a1a1a",
    glyph: "✦",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    short: "Claude Code",
    bg: "#C4A484",
    fg: "#1a1a1a",
    glyph: "⌘",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    short: "ChatGPT",
    bg: "#10A37F",
    fg: "#ffffff",
    glyph: "◎",
  },
  {
    id: "vscode",
    name: "VS Code",
    short: "VS Code",
    bg: "#007ACC",
    fg: "#ffffff",
    glyph: "{}",
  },
  {
    id: "codex",
    name: "Codex",
    short: "Codex",
    bg: "#1a1a1a",
    fg: "#ffffff",
    glyph: "◆",
  },
];
