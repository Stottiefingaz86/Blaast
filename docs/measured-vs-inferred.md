# Measured vs inferred (capture evidence rules)

Every extracted claim in Blaast must carry a **provenance** label. Library UI, MCP, and audits must not present guesses as facts.

## Labels

| Label | Meaning | Examples |
|-------|---------|----------|
| `measured` | Read directly from device/DOM/file at capture time | Screenshot bytes; `getComputedStyle` color; element `getBoundingClientRect`; CSS variable value on `:root`; animation `duration` from CSSOM |
| `observed` | Human or instrument saw an interaction, not a style token | “Betslip opened after odds click”; URL changed to `/cashier` |
| `inferred` | Model or heuristic guessed | Screen type “betslip” from vision; “primary brand color ≈ #E10600” from image k-means when no CSS var |
| `unavailable` | Cannot be obtained for this surface | Token tree for WebGL slot canvas |

## Rules

1. **Pixels** from the user’s screenshot/video frame are `measured` for that viewport only (not “the whole product always looks like this”).  
2. **CSS / layout** from the structure snapshot are `measured` only for nodes actually sampled.  
3. **Inferred** values require `confidence` (0–1) and `method` (e.g. `vision-classify-v1`).  
4. MCP responses must include provenance on token and classification fields.  
5. Publishing to a shared catalogue requires human review of classifications; measured pixels still need rights status.  
6. Never upgrade `inferred` → `measured` without a new capture that actually measures it.  
7. Canvas/WebGL: store `stylesAvailability: "unavailable"`; do not invent CSS.

## Display copy (library)

- Measured: show value plain.  
- Inferred: show value with “Inferred” badge.  
- Unavailable: show “Not available for this surface”.
