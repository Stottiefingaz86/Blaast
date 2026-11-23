# Task 00 — Scuup + Design Agent repository audit
**Mode:** READ-ONLY | **Gate:** must be approved before implementation

## Inspect
Locate both repos; record commit, framework, dependencies, package layout, database/auth, ingestion/capture, storage, queues, MCP, agent skills, tokens, governance, component registry, code generation, tests and deployment. Inspect code and docs, not just filenames. Do not print secrets.

## Deliverables (new project docs only)
- docs/existing-project-audit.md (capabilities with precise file paths)
- docs/reuse-matrix.md (reuse directly / adapter / shared package / rebuild / unknown, with effort and risk)
- docs/proposed-architecture.md (data flow, boundaries, ownership, Mermaid diagram)
- docs/design-agent-contract.md (governed generation integration, schemas and validation)
- docs/decisions-needed.md (blocking questions, alternatives)
- docs/vertical-slice-plan.md (minimum end-to-end POC and tests)

## Exit criteria
Every claimed reusable capability has code evidence. Explicit recommendation whether to integrate via API, MCP or package. Existing repositories unchanged. No dependency changes. Report what could not be verified. Stop and request approval.
