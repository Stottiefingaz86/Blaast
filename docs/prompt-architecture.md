# Prompt architecture (evidence → replicate)

## Problem
Early “Copy agent prompt” dumped catalog metadata (operator + step labels). That is **not** enough to rebuild UX. Real prompts need **evidence** (screenshots / frames + structured observations) and a generation service.

## Pipeline

```
Capture bundle ──► FlowEvidence store
Demo catalog   ──► enrich (confidence: demo)
                         │
                         ▼
              POST/GET /api/prompts/generate
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
   Vision LLM (if key +          Evidence template
   image artifact URLs)          (always available)
            │                         │
            └────────────┬────────────┘
                         ▼
              ReplicatePromptResult
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
      Flow Theater    MCP get_flow   (future credits)
```

## Contracts

| Type | Role |
|------|------|
| `FlowEvidence` / `StepEvidence` | Typed journey evidence (`apps/web/src/lib/evidence/types.ts`) |
| `ReplicatePromptResult` | `{ prompt, source: "llm" \| "evidence_template", evidenceId, citations[] }` |

Demo enrichment: [`from-catalog.ts`](../apps/web/src/lib/evidence/from-catalog.ts) — `confidence: "demo"`, roles/goals **inferred** until capture attaches measured artifacts.

## API

- `GET /api/prompts/generate?flowId=bf-exchange-bet`
- `POST /api/prompts/generate` `{ "flowId": "bf-exchange-bet" }`
- Optional `preferTemplate=1` / `{ preferTemplate: true }`

## Env (LLM)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | Enables vision path when image URLs exist |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat + vision model |

Without a key **or** without fetchable `artifact.url`s, the service returns `source: "evidence_template"` (rich structured prompt, not the old one-liner dump).

## Measured vs inferred

- **measured** — from capture pixels / `getComputedStyle` (capture-schema)
- **observed** — researcher / interaction sequence
- **inferred** — demo enrichment / vision guess — never sold as source CSS

## Next gate

Capture extension upload → private object storage → populate `StepEvidence.artifacts[].url` with real PNGs/frames → vision prompts become the default when `OPENAI_API_KEY` is set.
