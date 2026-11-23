# Blaast — Mobbin for iGaming

Reference library for sportsbook / casino / poker / cashier UX: screens, flows, search, collections, then MCP. Manual human capture (sites block automation).

## Current workspace

| Path | Purpose |
|------|---------|
| [`docs/product-focus.md`](docs/product-focus.md) | Priority: library first, research later, studio last |
| [`docs/capture-architecture.md`](docs/capture-architecture.md) | How we record & extract (pixels, layout, tokens, motion) |
| [`docs/igaming-taxonomy.md`](docs/igaming-taxonomy.md) | Full catalogue categories |
| [`docs/frontend-ui-brief.md`](docs/frontend-ui-brief.md) | Mobbin-like UI |
| [`apps/capture-extension`](apps/capture-extension) | Chrome MV3 capture scaffold (load unpacked) |
| [`packages/capture-schema`](packages/capture-schema) | Shared capture TypeScript types |
| [`tasks/`](tasks/) | Delivery tasks 00–04 |

## Capture quick start

1. `cd apps/web && npm run dev` → http://localhost:3000/admin  
2. **Add site** (URL, markets, products, tags)  
3. Start a **playbook** session → checklist opens site + tells you what to shoot  
4. Chrome → Load unpacked → `apps/capture-extension` → on that tab Start + Alt+Shift+S per checklist row  

Details: [`docs/admin-capture-desk.md`](docs/admin-capture-desk.md)  

## Related repos (unchanged)

- Scuup: `/Users/christopherhunt/surchly`  
- Design Studio: `Desktop/🤖 Design Agent/design-studio` (governance patterns only — no Lumen/BetOnline tokens in Blaast)
