import type { McpClientId } from "@/components/marketing/ai-client-logo";

export type McpClientSetup = {
  id: McpClientId;
  name: string;
  /** Where to paste the config */
  where: string;
  /** Short steps shown above the snippet */
  steps: string[];
  /** Filename hint (optional) */
  fileHint?: string;
  /** Build pasteable config for this client */
  snippet: (endpoint: string) => string;
};

const cursorLike = (endpoint: string) =>
  `{
  "mcpServers": {
    "blaast": {
      "url": "${endpoint}"
    }
  }
}`;

const vscodeSnippet = (endpoint: string) =>
  `{
  "servers": {
    "blaast": {
      "type": "http",
      "url": "${endpoint}"
    }
  }
}`;

const chatgptSnippet = (endpoint: string) =>
  `Server URL (Custom GPT / Actions / Connectors):

${endpoint}

Method: Streamable HTTP MCP
Name: Blaast`;

const codexSnippet = (endpoint: string) =>
  `# ~/.codex/config.toml  (or project .codex/config.toml)

[mcp_servers.blaast]
url = "${endpoint}"`;

export const MCP_CLIENT_SETUPS: McpClientSetup[] = [
  {
    id: "cursor",
    name: "Cursor",
    where: "Cursor Settings → MCP → Add new MCP server",
    fileHint: "~/.cursor/mcp.json  or  .cursor/mcp.json",
    steps: [
      "Open Cursor Settings → MCP",
      "Add a new server and paste the JSON below",
      "Save, then ask Cursor to search Blaast screens or flows",
    ],
    snippet: cursorLike,
  },
  {
    id: "claude",
    name: "Claude",
    where: "Claude Desktop → Settings → Developer → Edit Config",
    fileHint: "claude_desktop_config.json",
    steps: [
      "Open Claude Desktop → Settings → Developer",
      "Edit Config and merge the JSON below into mcpServers",
      "Restart Claude Desktop",
    ],
    snippet: cursorLike,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    where: "ChatGPT → Settings → Connectors (or Custom GPT Actions)",
    steps: [
      "In ChatGPT Pro/Team, open Settings → Connectors (or create a Custom GPT)",
      "Add an MCP / remote server with the Streamable HTTP URL below",
      "Name it Blaast and enable it in the chat",
    ],
    snippet: chatgptSnippet,
  },
  {
    id: "vscode",
    name: "VS Code",
    where: "VS Code → MCP servers (GitHub Copilot / MCP extension)",
    fileHint: ".vscode/mcp.json",
    steps: [
      "Create .vscode/mcp.json in your workspace (or use the MCP panel)",
      "Paste the JSON below",
      "Reload the window, then call Blaast tools from Copilot Chat",
    ],
    snippet: vscodeSnippet,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    where: "Windsurf → Settings → Cascade → MCP Servers",
    fileHint: "~/.codeium/windsurf/mcp_config.json",
    steps: [
      "Open Windsurf Settings → Cascade → MCP Servers",
      "Add a server and paste the JSON below",
      "Restart Cascade if the tools do not appear",
    ],
    snippet: cursorLike,
  },
  {
    id: "codex",
    name: "Codex",
    where: "OpenAI Codex CLI / IDE → MCP config",
    fileHint: "~/.codex/config.toml",
    steps: [
      "Open your Codex config (CLI or IDE MCP settings)",
      "Add the blaast server block below",
      "Restart Codex, then ask it to search Blaast evidence",
    ],
    snippet: codexSnippet,
  },
];

export function setupForClient(id: McpClientId): McpClientSetup {
  return (
    MCP_CLIENT_SETUPS.find((s) => s.id === id) ?? MCP_CLIENT_SETUPS[0]!
  );
}
