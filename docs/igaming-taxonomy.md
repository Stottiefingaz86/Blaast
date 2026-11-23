# iGaming library taxonomy (Mobbin-breadth)

**Goal:** catalogue as complete for iGaming as Mobbin is for general apps/web — every meaningful screen type, UI element, and journey operators ship.

Capture is **manual**; each item is tagged into this taxonomy so browse/search/MCP work like Mobbin.

---

## Top-level browse (mega-menu)

Mirror Mobbin’s four columns: **Categories · Screens · UI elements · Flows**.

### 1. Categories (products / surfaces)

| Category | Examples |
|----------|----------|
| Sportsbook | Home, leagues, event, betslip, my bets |
| Casino | Lobby, game categories, game launch, providers |
| Poker | Lobby, tables, tournaments |
| Cashier | Deposit, withdraw, methods, history |
| Account | Profile, verification, security, limits |
| Rewards / VIP | Loyalty, cashback, missions, leaderboards |
| Promotions | Offers, opt-in, terms |
| Responsible gambling | Limits, reality check, self-exclusion |
| Cross-product | Global nav, search, notifications, help |

### 2. Screens (page / state types)

**Home & discovery**  
Home pages · Casino lobby · Sports offering / league lists · Search results · Empty states · Error / geo-block / maintenance  

**Navigation chrome**  
Global navigation · Sports navigation · Casino navigation · Headers · Footers · Tab bars · Side drawers · Sub-nav / glass bars  

**Sports**  
Event views (prematch / live) · Markets & lines · Alternate lines · Bet builder / SGP · My bets · Cash out · Streaming / scoreboard embeds  

**Betting UI**  
Betslip (single / multi / system) · Stake entry · Odds formats · Quick bet · Bet confirmation  

**Casino**  
Game tiles / rows · Provider hubs · Jackpots · Recently played · Favourites · Game info / RTP panels  

**Social / engagement**  
Activity feeds · Live wins / feed carousels · Leaderboards · Missions / challenges · Notifications center  

**Rewards**  
Rewards hub · Claim states · VIP tiers · Bonuses · Free spins / spins wheel  

**Cashier**  
Deposit · Withdrawal · Payment method pickers · Pending / processing · Limits warnings · KYC gates in cashier  

**Onboarding & access**  
Welcome · Registration · Login · OTP / 2FA · Age / geo gates · KYC / document upload · Soft / hard KYC  

**My account**  
Profile · Personal details · Preferences · Security · Transaction history · Responsible gambling settings · Documents  

**Marketing / content**  
Promo banners · Landing modules · Help / FAQ · Legal / terms overlays  

### 3. UI elements (components)

Odds button · Stake stepper · Betslip tray / sheet · Chip / filter · Search field · Accordion markets · Event row · Game card / tile · Provider logo row · Banner carousel · Modal / sheet · Toast · Badge (live, new, boosted) · Avatar / rank · Progress / VIP bar · Toggle (odds format, theme) · Footer link clusters · Header actions (deposit, wallet, inbox) · Tab · Segmented control · **Loaders** (spinners, progress rings) · **Skeleton / shimmer** loading states · Empty illustration

Loaders are a first-class browse filter — teams copy operator load states constantly; capture both still skeletons and short motion clips of spinners.  

### 4. Flows (ordered journeys)

Onboarding (visit → register → verify) · First deposit · Place first bet · Build multi / SGP · Cash out · Withdrawal · Bonus claim · Limit setting · Casino: lobby → game → return · KYC complete · Account recovery · Responsible gambling tool use  

---

## Platforms

Mobile web · Desktop web · (Native apps later if captured)  
Toggle in UI like Mobbin’s iOS | Web.

## Metadata on every screen (minimum)

Operator · brand · market/jurisdiction · product · platform · capture date · flow (optional) · screen type tags · UI element tags · review/rights status  

## MCP / search (same mental model as Mobbin)

Agents should be able to ask e.g.:
- “betslip states on Stake mobile”
- “casino lobby navigation patterns UK”
- “cashier deposit error states”
- “sports event view with live badge”
- “rewards leaderboard”

…and get **screens / flows** with evidence IDs.

## Ambition check

Yes — **everything** you listed is in scope for the library taxonomy:

Betslips · Casino lobby · Casino / sports / global navigations · Activity feeds · Leaderboards · Rewards · Sports offering · Sports event views · Cashier · Onboarding · Home pages · Search · Footers · Headers · My account · Cards / tiles · and the rest above.

P0 build still starts narrow (**capture + grid + a few tags**), but the **information architecture** is designed for full Mobbin-parity from day one so we don’t paint ourselves into a corner.
