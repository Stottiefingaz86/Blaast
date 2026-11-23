# Blaast platform offerings (Mobbin parity)

Blaast ships the same **commercial + admin surfaces** Mobbin exposes, adapted to iGaming.

## Auth surfaces
| State | Route | What |
|-------|-------|------|
| Logged out | `/` | Marketing lander |
| Auth | `/login` | Welcome back |
| Logged in | `/library` | Operators / Web library |
| Marketing | `/mcp` `/pricing` `/customers` | Public product pages |

## Settings (logged in)
| Route | Mobbin equivalent |
|-------|-------------------|
| `/settings/account` | Account |
| `/settings/preferences` | Preferences |
| `/settings/billing` | Billing & Usage + **AI credits** |
| `/settings/team` | Team + **SAML & SCIM** (Enterprise) |
| `/settings/mcp` | **MCP** connections (Cursor, Claude, …) |

## Plans
Typed in `apps/web/src/lib/platform/plans.ts`:

- **Free** — limited operators/web, max 3 collections  
- **Pro** — full library, flows, animations, AI credits (300), Deep Search, MCP  
- **Team** — invites, shared collections, 2× credits (600), API access  
- **Enterprise** — SAML & SCIM, advanced security, invoice/PO, custom credits  

## Credits
Demo meter on Billing: allowance by plan + bonus packs; Deep Search simulation spends credits. Persist via `localStorage` (`blaast.demo.account`).

## MCP
Settings → MCP: connected agents + connect catalog. Public `/mcp` docs + Cursor config. Requires Pro+.

## SCIM
Settings → Team → SAML & SCIM: endpoint, rotate bearer, enable provisioning. Gated to Enterprise in the typed plan matrix.

## Not wired yet (next)
- Real Stripe / invoice billing  
- Live MCP SSE server  
- IdP SAML assertion + SCIM 2.0 HTTP API  
- Slack / SOC 2 document delivery  
