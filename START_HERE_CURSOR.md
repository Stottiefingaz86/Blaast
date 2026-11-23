# START HERE — Cursor kickoff

You are Principal Engineer working on iGaming Intelligence. READ `PRD.md`, `.cursor/rules/*.mdc`, and `tasks/00-repository-audit.md` before touching code.

## First instruction (paste into Cursor Agent)
We are starting iGaming Intelligence. Two existing repositories, Scuup and Design Agent, may contain reusable infrastructure and design governance. FIRST inspect the workspace and locate both repos. If absent, stop and request paths. Follow `tasks/00-repository-audit.md`. Do not write application code, change either repository, install dependencies, run migrations, or fabricate existing capabilities. Produce the specified audit documents with file-path evidence, a reuse matrix, and a recommended thin vertical slice. Report unknowns explicitly. Wait for approval before implementation.

## Operating rules
- One task per agent conversation. No autonomous multi-week implementation.
- Read PRD and relevant task, inspect actual code, propose plan, then implement only after approval.
- Small diffs, tests, lint/typecheck; document exact commands and results.
- Preserve existing projects; integrate via adapters before considering extraction/merge.
- Competitor reference controls UX *patterns*; customer's design tokens, components and governance control final output.
- Evidence must have provenance; distinguish measured vs inferred.
- Never record secrets or automate gambling transactions.
- No claims of completion without observable tests.

## Suggested Cursor workspace
workspace/
  scuup/                  # existing, unchanged during audit
  design-agent/           # existing, unchanged during audit
  igaming-intelligence/   # this starter package

## Task order
1. `tasks/00-repository-audit.md`
2. `tasks/01-foundation.md`
3. `tasks/02-capture-vertical-slice.md`
4. `tasks/03-research-and-mcp.md`
5. `tasks/04-governed-design-studio.md`

## What to paste into each new Cursor chat
Read PRD.md and all .cursor/rules. Work ONLY on task [path]. Inspect current code first. Present a short plan and dependencies, implement the smallest testable slice, run tests, and report changed files, verification results, and remaining risks. Do not expand scope.
