# Blaast MCP rebuild (exact chrome)

## Where fidelity fails (measured)

1. **`get_evidence` must return the exact beat** (`…-ui-side-nav`, `…-ui-tab-bar`). If it returns a journey (`first_deposit`) the agent never sees nav media — that was a real bug (stale local session + journey fallback). Fix: merge cloud published clips before beat lookup.
2. **Video “motion analysis” is scene-cut detection**, not hover/CSS. For hovers: open `video_url`, scrub frames, sample row colours. Do not invent `#2f4553` from memory.
3. **Skills help process, not measurement.** A skill cannot replace opening posters. Add/use this skill so agents always: search → exact evidence_id → open still → sample → code.
4. **Two Stake nav states in one session.** `ui-side-nav` t0 ≈ global drawer (Casino/Sports/Rewards/Inside Stake). Mid frames / lobby ≈ nested **My Casino**. Match the frame the user pointed at; do not mix states.

## Required MCP sequence

```
search_ui operator=stake query="side nav"
→ evidenceId …-ui-side-nav
get_evidence evidence_id=<that exact id>
→ confirm evidence.evidenceId ends with ui-side-nav (NOT first_deposit / home_tour)
→ open poster_url + video_url; sample colours from stills
```

## Sandbox `/blaast-test`

Empty middle. Chrome only. Colours from library stills. Cite artifact ids in a code comment.

## Not Mobbin

Never use Mobbin for Blaast rebuilds.
