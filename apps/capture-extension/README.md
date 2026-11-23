# Blaast Capture (Chrome MV3)

Human-led guided capture for the Mobbin-for-iGaming library.

## What it captures

- Session start/stop with **optional host permission** for the active origin  
- **Guided beats**: polls admin session guide → countdown sync → short **tab video** + poster PNG  
- Hotkey / button **still screenshot** (`Alt+Shift+S`)  
- **Structure snapshot**: visible nodes + allowlisted computed styles + CSS variables (`measured`)  
- Sensitive URL / field **flags** (no password or payment values ever read)  
- Upload to `POST /api/admin/sessions/:id/artifacts`

## With Admin guided coverage

1. `cd apps/web && npm run dev` → `/admin`  
2. Add a site → **Start brand coverage** → copy Session ID  
3. Load this extension → paste Session ID → open operator tab → **Start session**  
4. In admin: Ready → 3-2-1 → do the action; extension records & uploads  

## Load in Chrome

1. `chrome://extensions` → Developer mode  
2. **Load unpacked** → `apps/capture-extension`  
3. Reload after code changes  

## Schema

Types: [`packages/capture-schema`](../../packages/capture-schema).  
Architecture: [`docs/capture-architecture.md`](../../docs/capture-architecture.md).  
Admin desk: [`docs/admin-capture-desk.md`](../../docs/admin-capture-desk.md).
