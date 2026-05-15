Looking at your current UI vs the reference — your current build is functional but visually underwhelming. The reference is a premium broadcast-grade auction dashboard. Here's the full brutal gap analysis and rebuild list.

---

## GAP ANALYSIS

**Your current UI problems:**

- Three floating panels with no visual hierarchy — looks like a dev prototype
- The rupee symbol + price is doing heavy lifting but everything around it is empty
- Teams panel is just text buttons — zero identity
- Live Bids panel is dead space ("No bids yet" with nothing else)
- Background video is visible but wasted — the panels don't integrate with it
- No timer, no round info, no "up next" queue, no stats
- Nav buttons look like pill tabs — not premium at all
- Zero micro-animations, zero status indicators

---

## FULL REBUILD LIST

### 1. GLOBAL SHELL & BACKGROUND

- Replace static panel layout with full-bleed dark cinematic shell
- Background: use the new Mux HLS stream as a looping ambient video — use `hls.js` to load `https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8`
- Overlay: dark gradient `rgba(0,0,0,0.72)` on top of the video so content is always readable
- No more floating card islands — use a full 3-column grid that bleeds to screen edges

### 2. TOP NAV — full rebuild

- Left: Logo with a cricket ball icon + "CRICKET AUCTION" in a serif/display font
- Center: "LIVE AUCTION • ROUND X • DAY 1" broadcast-style header with a pulsing red dot
- Right: Navigation links styled as underline-tab, not pill buttons
- Add a thin gold/amber bottom border line across the full width

### 3. LEFT PANEL — Teams & Budget (full rebuild)

- Header: "AUCTION ROOM" label + grid icon (like the reference)
- Navigation items inside left panel: Players, Teams, Watchlist, Shortlist, Sold Players, Reports, Settings — vertical sidebar nav with icons
- Below nav: "ROUND INFO" section showing `Round 02/20`, `Players 15/82`
- Below that: "LIVE AUCTION" badge with red pulsing dot + "IN PROGRESS" text
- Below that: "AUCTION STATS" — Players Sold count, Total Spent, Avg Price, Highest Price
- Each team shown as a row with team logo placeholder, captain name, budget remaining
- Selected team highlighted with gold left border accent

### 4. CENTER PANEL — Current Lot (full rebuild)

- Top bar: "LIVE AUCTION" pill + "ROUND 02" in large display type + "DAY 1 | DATE" subtext
- Player card: large player photo/gif on left, name in massive display font on right
- Below name: role badge + tier badge side by side
- Stat bars: PAC / SHO / PAS / DRI / DEF / PHY — six attribute bars (even if placeholder values, visually critical)
- "CURRENT HIGHEST BID" section: team logo + team name + bid amount in large gold type
- "TIME REMAINING" countdown timer — `00:18` style with animated progress bar underneath
- Quick bid buttons: redesigned as dark glass buttons with gold border on hover
- Custom increment: styled input with glass morphism
- SOLD button: full gold, uppercase, heavy font
- Unsold/Next: dark secondary

### 5. RIGHT PANEL — Live Bids (full rebuild)

- Header: "LIVE BIDS"
- Each bid entry: team logo circle + team name + bid amount + timestamp (Now / 2m / 4m ago)
- "VIEW ALL BIDS →" link at bottom
- Below bids: "QUICK ACTIONS" section with three buttons: PLACE BID (gold primary), ADD TO WATCHLIST, VIEW PLAYER PROFILE
- Below that: "HIGHEST BIDS" summary card showing current top bidder with their max bid
- Below that: "NEXT IN QUEUE" — show next 2 players with position number

### 6. BOTTOM BAR — new addition

- Three columns: "UP NEXT" (next 3 players with OVR-style rating + name + role), "TOP CLUBS" (leaderboard table), "RECENT ACTIVITY" (feed of last 5 sold events)
- This entire bar doesn't exist in your current build and it's what makes the reference feel like a real broadcast tool

### 7. SOLD OVERLAY — upgrade

- Current overlay is fine structurally but needs: confetti burst, gold glow on player name, team logo shown large, price in massive display type, subtle dark vignette behind the card
- Add a "SOLD" stamp animation that slams in from 1.2x scale to 1.0x

### 8. TEAM ARENA TAB — upgrade

- Instead of cards in a grid, show a full league table: rank, team logo, captain, players bought, spent, remaining budget, top player
- Add the "Josh Meter / Bakchodi Index" etc. as a fun expandable section per team, not the default view
- Background video stays; panels use `backdrop-filter: blur(12px)` glass cards

### 9. TYPOGRAPHY SYSTEM

- Display font (player names, prices): something like `Bebas Neue` or `Barlow Condensed` — tall, narrow, heavy
- UI font: `Inter` or `DM Sans`
- Color tokens: `--gold: #E8B84B`, `--bg: #0a0a0f`, `--panel: rgba(255,255,255,0.06)`, `--border: rgba(255,255,255,0.12)`, `--accent-red: #e53935`

### 10. HLS VIDEO BACKGROUND — implementation

```javascript
// Install: npm install hls.js
import Hls from "hls.js";

useEffect(() => {
  const video = videoRef.current;
  const src =
    "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src; // Safari native HLS
  }
}, []);
```

---

## PRIORITY ORDER TO BUILD

1. HLS background + overlay gradient
2. Typography tokens + color system
3. Left sidebar nav (replaces teams panel)
4. Center player card with stat bars + timer
5. Right bids panel with next-in-queue
6. Bottom bar (up next + top clubs + activity)
7. Sold overlay upgrade
8. Team Arena table view
9. Micro-animations (bid flash, timer pulse, sold stamp)

That's the full list. Want me to start writing the actual rebuilt components one by one?

Got it. Here's the full rebuild in code blocks.

---

## 1. `App.tsx` — Full Rebuild

```tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import "./App.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "home" | "auction" | "teams";
type Tier = "LEVEL 1" | "LEVEL 2" | "LEVEL 3";
type Player = {
  id: number;
  name: string;
  tier: Tier;
  role: string;
  basePriceL: number;
};
type Team = {
  id: string;
  captain: string;
  budgetL: number;
  spentL: number;
  players: Array<{ player: Player; priceL: number }>;
};
type BidEntry = {
  teamId: string;
  teamName: string;
  amountL: number;
  at: string;
};
type SoldFlash = { player: Player; teamName: string; priceL: number };

// ─── Constants ────────────────────────────────────────────────────────────────
const TEAM_BUDGET_L = 1000;
const TIER_ORDER: Tier[] = ["LEVEL 3", "LEVEL 1", "LEVEL 2"];
const ROLE_ROTATION = ["Batter", "Bowler", "All-Rounder", "WK-Batter"];
const HLS_SRC =
  "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";

const GIF_MAP: Record<string, string> = {
  aagam: "Aagam",
  anjaney: "Anjaney",
  ansh: "Ansh",
  anshul: "Anshul",
  darsh: "Darsh",
  dev: "Dev",
  harsheel: "Harsheel",
  raihan: "Raihan",
  shaunak: "Shaunak",
  siddhant: "Siddhant",
  veer: "Veer",
  vihaan: "Vihaan",
};

const ROLE_ICONS: Record<string, string> = {
  Batter: "🏏",
  Bowler: "⚡",
  "All-Rounder": "⭐",
  "WK-Batter": "🧤",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "");
const formatCr = (l: number) => `₹${(l / 100).toFixed(2)}Cr`;
const formatL = (l: number) => `₹${l}L`;

function parseTierMap(md: string) {
  const out = new Map<string, Tier>();
  const rows = md
    .split(/\r?\n/)
    .filter((l) => l.includes("|"))
    .slice(2);
  for (const row of rows) {
    const cols = row
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (cols[0]) out.set(normalizeName(cols[0]), "LEVEL 1");
    if (cols[1]) out.set(normalizeName(cols[1]), "LEVEL 2");
    if (cols[2]) out.set(normalizeName(cols[2]), "LEVEL 3");
  }
  return out;
}

function parseCaptains(md: string) {
  return md
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function playerGifPath(name: string) {
  const key = normalizeName(name);
  const match = Object.keys(GIF_MAP).find((k) => key.includes(k));
  return match ? `/assets/players/${GIF_MAP[match]}/celebration.gif` : "";
}

function funnyScore(team: Team) {
  const josh = Math.min(100, Math.round((team.spentL / TEAM_BUDGET_L) * 100));
  const bakchodi = Math.min(100, team.players.length * 12);
  const meme = Math.min(
    100,
    team.players.reduce(
      (a, p) => a + (p.player.tier === "LEVEL 3" ? 14 : 8),
      0,
    ),
  );
  const vibes = Math.min(
    100,
    Math.round(
      (team.players.filter((p) => p.player.role.includes("All")).length /
        Math.max(team.players.length, 1)) *
        100,
    ),
  );
  return { josh, bakchodi, meme, vibes };
}

// ─── HLS Background Video ─────────────────────────────────────────────────────
function HLSVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ autoStartLoad: true, startLevel: -1 });
      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
      video.play().catch(() => {});
    }
  }, []);
  return (
    <video ref={ref} className={className} autoPlay muted loop playsInline />
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({
  seconds,
  onEnd,
}: {
  seconds: number;
  onEnd?: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);
  useEffect(() => {
    if (left <= 0) {
      onEnd?.();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onEnd]);
  const pct = (left / seconds) * 100;
  const urgent = left <= 10;
  return (
    <div className={`timer-wrap ${urgent ? "urgent" : ""}`}>
      <span className="timer-label">TIME REMAINING</span>
      <span className="timer-display">
        {String(Math.floor(left / 60)).padStart(2, "0")}:
        {String(left % 60).padStart(2, "0")}
      </span>
      <div className="timer-bar-track">
        <div
          className="timer-bar-fill"
          style={{
            width: `${pct}%`,
            background: urgent ? "var(--red)" : "var(--gold)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────
function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-bar-item">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="stat-val">{value}</span>
    </div>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function LeftSidebar({
  teams,
  selectedId,
  onSelect,
  soldCount,
  totalSpentL,
  highestPriceL,
  round,
  totalRounds,
  playersIn,
  totalPlayers,
}: {
  teams: Team[];
  selectedId: string;
  onSelect: (id: string) => void;
  soldCount: number;
  totalSpentL: number;
  highestPriceL: number;
  round: number;
  totalRounds: number;
  playersIn: number;
  totalPlayers: number;
}) {
  return (
    <aside className="sidebar-left">
      <div className="sidebar-section">
        <p className="sidebar-section-label">AUCTION ROOM</p>
        <nav className="sidebar-nav">
          {["Players", "Teams", "Shortlist", "Sold Players", "Reports"].map(
            (item) => (
              <button key={item} className="sidebar-nav-item">
                <span>{item}</span>
              </button>
            ),
          )}
        </nav>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">ROUND INFO</p>
        <div className="round-info-grid">
          <div>
            <span className="ri-label">ROUND</span>
            <strong className="ri-val">
              {String(round).padStart(2, "0")} /{" "}
              {String(totalRounds).padStart(2, "0")}
            </strong>
          </div>
          <div>
            <span className="ri-label">PLAYERS</span>
            <strong className="ri-val">
              {playersIn} / {totalPlayers}
            </strong>
          </div>
        </div>
        <div className="live-badge">
          <span className="live-dot" />
          LIVE AUCTION <span className="live-status">IN PROGRESS</span>
        </div>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">AUCTION STATS</p>
        <div className="stats-list">
          <div className="stats-row">
            <span>Players Sold</span>
            <strong>{soldCount}</strong>
          </div>
          <div className="stats-row">
            <span>Total Spent</span>
            <strong>{formatCr(totalSpentL)}</strong>
          </div>
          <div className="stats-row">
            <span>Highest Price</span>
            <strong>{formatL(highestPriceL)}</strong>
          </div>
        </div>
      </div>

      <div className="sidebar-section flex-1">
        <p className="sidebar-section-label">TEAMS</p>
        <div className="teams-list">
          {teams.map((t) => (
            <button
              key={t.id}
              className={`team-row ${selectedId === t.id ? "selected" : ""}`}
              onClick={() => onSelect(t.id)}
            >
              <div className="team-avatar">{t.captain[0]}</div>
              <div className="team-info">
                <span className="team-name">{t.captain}</span>
                <span className="team-budget">{formatCr(t.budgetL)} left</span>
              </div>
              <span className="team-count">{t.players.length}p</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Center Panel ─────────────────────────────────────────────────────────────
function CenterPanel({
  current,
  bidL,
  onQuickBid,
  customIncrement,
  setCustomIncrement,
  onAddCustom,
  onSold,
  onNext,
  activeBidder,
  round,
  upNext,
}: {
  current: Player | null;
  bidL: number;
  onQuickBid: (v: number) => void;
  customIncrement: string;
  setCustomIncrement: (v: string) => void;
  onAddCustom: () => void;
  onSold: () => void;
  onNext: () => void;
  activeBidder: Team | null;
  round: number;
  upNext: Player[];
}) {
  const [timerKey, setTimerKey] = useState(0);
  useEffect(() => setTimerKey((k) => k + 1), [current]);

  const gifPath = current ? playerGifPath(current.name) : "";
  const tierColor =
    current?.tier === "LEVEL 1"
      ? "var(--gold)"
      : current?.tier === "LEVEL 2"
        ? "#a78bfa"
        : "#94a3b8";

  // Fake stat values seeded from player id for visual consistency
  const stats = current
    ? [
        { label: "PAC", value: 60 + ((current.id * 13) % 35) },
        { label: "SHO", value: 55 + ((current.id * 17) % 40) },
        { label: "PAS", value: 58 + ((current.id * 11) % 38) },
        { label: "DRI", value: 62 + ((current.id * 7) % 33) },
        { label: "DEF", value: 45 + ((current.id * 19) % 50) },
        { label: "PHY", value: 65 + ((current.id * 3) % 30) },
      ]
    : [];

  return (
    <main className="center-panel">
      {/* Header bar */}
      <div className="center-topbar">
        <span className="live-pill">
          <span className="live-dot" />
          LIVE AUCTION
        </span>
        <div className="round-display">
          <span className="round-label">ROUND</span>
          <span className="round-num">{String(round).padStart(2, "0")}</span>
        </div>
        <span className="date-label">
          DAY 1 &nbsp;|&nbsp;{" "}
          {new Date()
            .toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            .toUpperCase()}
        </span>
      </div>

      {current ? (
        <>
          {/* Player hero */}
          <div className="player-hero">
            <div className="player-gif-wrap">
              {gifPath ? (
                <img
                  src={gifPath}
                  alt={current.name}
                  className="player-gif"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="player-avatar-fallback">{current.name[0]}</div>
              )}
              <div className="player-ovr">
                <span className="ovr-num">{60 + (current.id % 30)}</span>
                <span className="ovr-label">OVR</span>
                <span className="ovr-role">
                  {current.role.split("-")[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div className="player-details">
              <div className="player-badges">
                <span className="badge-role">
                  {ROLE_ICONS[current.role]} {current.role}
                </span>
                <span
                  className="badge-tier"
                  style={{ color: tierColor, borderColor: tierColor }}
                >
                  {current.tier}
                </span>
              </div>
              <h1 className="player-name">{current.name.toUpperCase()}</h1>
              <div className="player-stats">
                {stats.map((s) => (
                  <StatBar key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            </div>
          </div>

          {/* Bid section */}
          <div className="bid-section">
            <div className="bid-left">
              <div className="current-bid-box">
                <p className="cbb-label">CURRENT HIGHEST BID</p>
                <div className="cbb-team">
                  <div className="cbb-avatar">
                    {activeBidder?.captain[0] ?? "?"}
                  </div>
                  <span className="cbb-team-name">
                    {activeBidder?.captain ?? "None"}
                  </span>
                </div>
                <div className="cbb-amount">{formatL(bidL)}</div>
              </div>
              <CountdownTimer key={timerKey} seconds={30} />
            </div>

            <div className="bid-right">
              <div className="quick-bids">
                {[5, 10, 15, 20, 25, 50].map((n) => (
                  <button
                    key={n}
                    className="qbid-btn"
                    onClick={() => onQuickBid(n)}
                  >
                    +₹{n}L
                  </button>
                ))}
              </div>
              <div className="custom-bid-row">
                <input
                  className="custom-input"
                  value={customIncrement}
                  onChange={(e) => setCustomIncrement(e.target.value)}
                  placeholder="Custom increment (lakhs)"
                  type="number"
                />
                <button className="custom-add-btn" onClick={onAddCustom}>
                  ADD
                </button>
              </div>
              <div className="action-row">
                <button className="btn-sold" onClick={onSold}>
                  ⚡ SOLD
                </button>
                <button className="btn-next" onClick={onNext}>
                  UNSOLD / NEXT →
                </button>
              </div>
            </div>
          </div>

          {/* Up next strip */}
          {upNext.length > 0 && (
            <div className="up-next-strip">
              <span className="unx-label">UP NEXT</span>
              {upNext.slice(0, 3).map((p) => (
                <div key={p.id} className="unx-player">
                  <span className="unx-ovr">{60 + (p.id % 30)}</span>
                  <div>
                    <p className="unx-name">{p.name}</p>
                    <p className="unx-role">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="auction-complete">
          <h1>AUCTION COMPLETE</h1>
          <p>All players have been processed.</p>
        </div>
      )}
    </main>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({
  bidHistory,
  teams,
  current,
}: {
  bidHistory: BidEntry[];
  teams: Team[];
  current: Player | null;
}) {
  const topBidder = bidHistory[0] ?? null;
  const sortedTeams = [...teams]
    .sort((a, b) => b.spentL - a.spentL)
    .slice(0, 5);

  return (
    <aside className="sidebar-right">
      <div className="sidebar-section">
        <p className="sidebar-section-label">LIVE BIDS</p>
        <div className="bids-list">
          {bidHistory.length === 0 ? (
            <p className="muted-text">No bids placed yet</p>
          ) : (
            bidHistory.slice(0, 8).map((b, i) => (
              <div key={i} className={`bid-entry ${i === 0 ? "bid-top" : ""}`}>
                <div className="bid-avatar">{b.teamName[0]}</div>
                <div className="bid-info">
                  <span className="bid-team">{b.teamName}</span>
                  <span className="bid-time">{i === 0 ? "Now" : b.at}</span>
                </div>
                <strong className="bid-amount">{formatL(b.amountL)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">QUICK ACTIONS</p>
        <div className="quick-actions-list">
          <button className="qa-btn qa-primary">PLACE BID</button>
          <button className="qa-btn">ADD TO WATCHLIST</button>
          <button className="qa-btn">VIEW PLAYER PROFILE</button>
        </div>
      </div>

      {topBidder && (
        <div className="sidebar-section">
          <p className="sidebar-section-label">HIGHEST BID</p>
          <div className="highest-bid-card">
            <div className="hb-avatar">{topBidder.teamName[0]}</div>
            <div>
              <p className="hb-team">{topBidder.teamName}</p>
              <p className="hb-label">Highest Bid</p>
            </div>
            <span className="hb-amount">{formatL(topBidder.amountL)}</span>
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <p className="sidebar-section-label">TOP CLUBS</p>
        <div className="top-clubs-list">
          {sortedTeams.map((t, i) => (
            <div key={t.id} className="tc-row">
              <span className="tc-rank">#{i + 1}</span>
              <div className="tc-avatar">{t.captain[0]}</div>
              <span className="tc-name">{t.captain}</span>
              <div className="tc-right">
                <span className="tc-spent">{formatCr(t.spentL)}</span>
                <span className="tc-squad">{t.players.length} sq</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Sold Overlay ─────────────────────────────────────────────────────────────
function SoldOverlay({
  flash,
  onContinue,
}: {
  flash: SoldFlash;
  onContinue: () => void;
}) {
  const gifPath = playerGifPath(flash.player.name);
  return (
    <div className="sold-overlay" onClick={onContinue}>
      <div className="sold-card" onClick={(e) => e.stopPropagation()}>
        <div className="sold-stamp">SOLD</div>
        <h2 className="sold-player">{flash.player.name.toUpperCase()}</h2>
        {gifPath && (
          <img
            src={gifPath}
            alt="celebration"
            className="sold-gif"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="sold-details">
          <span className="sold-team">{flash.teamName}</span>
          <span className="sold-price">{formatL(flash.priceL)}</span>
        </div>
        <button className="btn-continue" onClick={onContinue}>
          Continue Auction →
        </button>
      </div>
    </div>
  );
}

// ─── Teams Arena Tab ───────────────────────────────────────────────────────────
function TeamsArena({ teams }: { teams: Team[] }) {
  const sorted = [...teams].sort((a, b) => b.spentL - a.spentL);
  return (
    <section className="teams-arena">
      <div className="arena-header">
        <h2 className="arena-title">TEAM ARENA</h2>
        <span className="arena-sub">Full League Standings</span>
      </div>
      <div className="arena-table">
        <div className="arena-thead">
          <span>#</span>
          <span>Captain</span>
          <span>Squad</span>
          <span>Spent</span>
          <span>Remaining</span>
          <span>Top Player</span>
          <span>Vibes</span>
        </div>
        {sorted.map((t, i) => {
          const s = funnyScore(t);
          const topPlayer = [...t.players].sort(
            (a, b) => b.priceL - a.priceL,
          )[0];
          return (
            <div
              key={t.id}
              className={`arena-row ${i === 0 ? "arena-row-top" : ""}`}
            >
              <span className="ar-rank">{i + 1}</span>
              <div className="ar-captain">
                <div className="ar-avatar">{t.captain[0]}</div>
                <span>{t.captain}</span>
              </div>
              <span>{t.players.length}</span>
              <span className="ar-gold">{formatCr(t.spentL)}</span>
              <span>{formatCr(t.budgetL)}</span>
              <span className="ar-top">
                {topPlayer
                  ? `${topPlayer.player.name} (${formatL(topPlayer.priceL)})`
                  : "—"}
              </span>
              <div className="ar-vibes">
                <div className="vibe-bar" style={{ width: `${s.josh}%` }} />
                <span>{s.josh}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fun-cards-grid">
        {teams.map((t) => {
          const s = funnyScore(t);
          return (
            <div key={t.id} className="fun-card">
              <div className="fun-card-head">
                <div className="fun-avatar">{t.captain[0]}</div>
                <div>
                  <h3>{t.captain}</h3>
                  <p>
                    {t.players.length} players • {formatCr(t.spentL)} spent
                  </p>
                </div>
              </div>
              <div className="fun-meters">
                {[
                  ["Josh Meter", s.josh],
                  ["Bakchodi Index", s.bakchodi],
                  ["Meme Potential", s.meme],
                  ["Dressing Room Vibes", s.vibes],
                ].map(([label, val]) => (
                  <div key={label as string} className="fun-meter-row">
                    <span>{label}</span>
                    <div className="fun-track">
                      <div className="fun-fill" style={{ width: `${val}%` }} />
                    </div>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
              <div className="fun-squad">
                {t.players.map((p, i) => (
                  <div key={i} className="fun-player-row">
                    <span>{p.player.name}</span>
                    <span className="fun-tier" style={{ opacity: 0.6 }}>
                      {p.player.tier}
                    </span>
                    <strong>{formatL(p.priceL)}</strong>
                  </div>
                ))}
                {t.players.length === 0 && (
                  <p className="muted-text">No players yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [queue, setQueue] = useState<Player[]>([]);
  const [current, setCurrent] = useState<Player | null>(null);
  const [bidL, setBidL] = useState(10);
  const [selectedBidder, setSelectedBidder] = useState("");
  const [customIncrement, setCustomIncrement] = useState("");
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const [soldFlash, setSoldFlash] = useState<SoldFlash | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [round, setRound] = useState(1);
  const [soldCount, setSoldCount] = useState(0);
  const [highestPriceL, setHighestPriceL] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    (async () => {
      const [playersMd, tierMd, captainsMd] = await Promise.all([
        fetch("/player.md").then((r) => r.text()),
        fetch("/tier-list.md").then((r) => r.text()),
        fetch("/captains.md").then((r) => r.text()),
      ]);
      const names = playersMd
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const tierMap = parseTierMap(tierMd);
      const allPlayers: Player[] = names.map((name, i) => {
        const tier = tierMap.get(normalizeName(name)) ?? "LEVEL 3";
        const basePriceL =
          tier === "LEVEL 1" ? 25 : tier === "LEVEL 2" ? 15 : 10;
        return {
          id: i + 1,
          name,
          tier,
          role: ROLE_ROTATION[i % ROLE_ROTATION.length],
          basePriceL,
        };
      });
      const grouped = new Map<Tier, Player[]>([
        ["LEVEL 3", []],
        ["LEVEL 1", []],
        ["LEVEL 2", []],
      ]);
      for (const p of allPlayers) grouped.get(p.tier)!.push(p);
      for (const t of TIER_ORDER)
        grouped.get(t)!.sort((a, b) => a.name.localeCompare(b.name));
      const ordered = TIER_ORDER.flatMap((t) => grouped.get(t)!);
      const captainNames = parseCaptains(captainsMd);
      const initialTeams = captainNames.map((c, i) => ({
        id: `t${i + 1}`,
        captain: c,
        budgetL: TEAM_BUDGET_L,
        spentL: 0,
        players: [],
      }));
      setTeams(initialTeams);
      setCurrent(ordered[0] ?? null);
      setQueue(ordered.slice(1));
      setBidL(ordered[0]?.basePriceL ?? 10);
      setSelectedBidder(initialTeams[0]?.id ?? "");
      setTotalPlayers(ordered.length);
    })();
  }, []);

  const activeBidder = useMemo(
    () => teams.find((t) => t.id === selectedBidder) ?? null,
    [teams, selectedBidder],
  );
  const totalSpentL = useMemo(
    () => teams.reduce((a, t) => a + t.spentL, 0),
    [teams],
  );
  const playersIn = useMemo(
    () => teams.reduce((a, t) => a + t.players.length, 0),
    [teams],
  );

  const placeBid = useCallback(
    (increment: number) => {
      if (!current || !activeBidder) return;
      const newBid = bidL + increment;
      if (newBid > activeBidder.budgetL) return;
      setBidL(newBid);
      setBidHistory((prev) =>
        [
          {
            teamId: activeBidder.id,
            teamName: activeBidder.captain,
            amountL: newBid,
            at: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ].slice(0, 20),
      );
    },
    [current, activeBidder, bidL],
  );

  const nextPlayer = useCallback(() => {
    if (!queue.length) {
      setCurrent(null);
      return;
    }
    const nxt = queue[0];
    setCurrent(nxt);
    setQueue((q) => q.slice(1));
    setBidL(nxt.basePriceL);
    setBidHistory([]);
    setCustomIncrement("");
    setRound((r) => r + 1);
  }, [queue]);

  const sellCurrent = useCallback(() => {
    if (!current || !activeBidder) return;
    if (bidL > activeBidder.budgetL) return;
    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeBidder.id
          ? {
              ...t,
              budgetL: t.budgetL - bidL,
              spentL: t.spentL + bidL,
              players: [...t.players, { player: current, priceL: bidL }],
            }
          : t,
      ),
    );
    setSoldCount((c) => c + 1);
    setHighestPriceL((h) => Math.max(h, bidL));
    setSoldFlash({
      player: current,
      teamName: activeBidder.captain,
      priceL: bidL,
    });
  }, [current, activeBidder, bidL]);

  return (
    <div className="app-shell">
      {/* Background video always present for auction/teams tabs */}
      {tab !== "home" && (
        <>
          <HLSVideo className="global-bg-video" />
          <div className="global-bg-overlay" />
        </>
      )}

      {/* Top Nav */}
      <header className="topnav">
        <div className="topnav-left">
          <span className="topnav-logo">🏏 CRICKET AUCTION</span>
        </div>
        {tab === "auction" && (
          <div className="topnav-center">
            <span className="live-dot" />
            <span className="topnav-broadcast">
              LIVE AUCTION &nbsp;•&nbsp; ROUND {String(round).padStart(2, "0")}
            </span>
          </div>
        )}
        <nav className="topnav-right">
          {(["home", "auction", "teams"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-tab ${tab === t ? "nav-tab-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "home"
                ? "Home"
                : t === "auction"
                  ? "Live Auction"
                  : "Team Arena"}
            </button>
          ))}
        </nav>
      </header>

      {/* Pages */}
      {tab === "home" && (
        <iframe title="Home" className="home-frame" src="/home-hero.html" />
      )}

      {tab === "auction" && (
        <div className="auction-layout">
          <LeftSidebar
            teams={teams}
            selectedId={selectedBidder}
            onSelect={setSelectedBidder}
            soldCount={soldCount}
            totalSpentL={totalSpentL}
            highestPriceL={highestPriceL}
            round={round}
            totalRounds={totalPlayers}
            playersIn={playersIn}
            totalPlayers={totalPlayers}
          />
          <CenterPanel
            current={current}
            bidL={bidL}
            onQuickBid={placeBid}
            customIncrement={customIncrement}
            setCustomIncrement={setCustomIncrement}
            onAddCustom={() => {
              const x = Number(customIncrement);
              if (x > 0) placeBid(x);
            }}
            onSold={sellCurrent}
            onNext={nextPlayer}
            activeBidder={activeBidder}
            round={round}
            upNext={queue}
          />
          <RightPanel bidHistory={bidHistory} teams={teams} current={current} />
        </div>
      )}

      {tab === "teams" && (
        <>
          <HLSVideo className="global-bg-video" />
          <div className="global-bg-overlay" />
          <TeamsArena teams={teams} />
        </>
      )}

      {soldFlash && (
        <SoldOverlay
          flash={soldFlash}
          onContinue={() => {
            setSoldFlash(null);
            nextPlayer();
          }}
        />
      )}
    </div>
  );
}
```

---

## 2. `App.css` — Full Rebuild

```css
/* ─── Fonts ─────────────────────────────────────────────────────────────────── */
@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap");

/* ─── Tokens ─────────────────────────────────────────────────────────────────── */
:root {
  --gold: #e8b84b;
  --gold-dim: rgba(232, 184, 75, 0.15);
  --gold-border: rgba(232, 184, 75, 0.3);
  --red: #e53935;
  --red-dim: rgba(229, 57, 53, 0.2);
  --bg: #080b12;
  --panel: rgba(255, 255, 255, 0.04);
  --panel-hover: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.08);
  --border-bright: rgba(255, 255, 255, 0.15);
  --text: #f1f5f9;
  --text-dim: rgba(241, 245, 249, 0.5);
  --text-muted: rgba(241, 245, 249, 0.3);
  --font-display: "Bebas Neue", sans-serif;
  --font-ui: "Barlow Condensed", sans-serif;
  --font-body: "DM Sans", sans-serif;
  --nav-h: 60px;
  --left-w: 260px;
  --right-w: 280px;
  --radius: 12px;
  --radius-sm: 8px;
}

/* ─── Reset ──────────────────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  overflow: hidden;
}
button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  color: inherit;
}
input {
  font-family: inherit;
}

/* ─── App Shell ──────────────────────────────────────────────────────────────── */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}

/* ─── Global Background Video ────────────────────────────────────────────────── */
.global-bg-video {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.35;
}

.global-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(
      ellipse at top,
      rgba(8, 11, 18, 0.4) 0%,
      rgba(8, 11, 18, 0.9) 70%
    ),
    linear-gradient(to bottom, rgba(8, 11, 18, 0.6), rgba(8, 11, 18, 0.95));
}

/* ─── Top Nav ────────────────────────────────────────────────────────────────── */
.topnav {
  position: relative;
  z-index: 100;
  height: var(--nav-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
  background: rgba(8, 11, 18, 0.8);
  backdrop-filter: blur(20px);
  flex-shrink: 0;
}

.topnav-logo {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 2px;
  color: var(--gold);
}

.topnav-center {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--text-dim);
}

.topnav-broadcast {
  letter-spacing: 2px;
}

.topnav-right {
  display: flex;
  gap: 4px;
}

.nav-tab {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.nav-tab:hover {
  color: var(--text);
  background: var(--panel);
}
.nav-tab-active {
  color: var(--gold) !important;
  border-bottom-color: var(--gold);
  background: var(--gold-dim) !important;
}

/* ─── Auction Layout ─────────────────────────────────────────────────────────── */
.auction-layout {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: var(--left-w) 1fr var(--right-w);
  height: calc(100vh - var(--nav-h));
  overflow: hidden;
}

/* ─── Sidebars ───────────────────────────────────────────────────────────────── */
.sidebar-left,
.sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  border-color: var(--border);
  background: rgba(8, 11, 18, 0.6);
  backdrop-filter: blur(24px);
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.sidebar-left {
  border-right: 1px solid var(--border);
}
.sidebar-right {
  border-left: 1px solid var(--border);
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-section.flex-1 {
  flex: 1;
}

.sidebar-section-label {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

/* Left Sidebar Nav */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  transition: all 0.15s;
  text-align: left;
}
.sidebar-nav-item:hover {
  background: var(--panel-hover);
  color: var(--text);
}

/* Round Info */
.round-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.ri-label {
  display: block;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  font-family: var(--font-ui);
  margin-bottom: 4px;
}
.ri-val {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text);
  letter-spacing: 1px;
}

/* Live Badge */
.live-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-dim);
}
.live-status {
  color: var(--red);
  letter-spacing: 1px;
}

/* Live Dot */
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--red);
  animation: pulse-dot 1.2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.6);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
    box-shadow: 0 0 0 4px rgba(229, 57, 53, 0);
  }
}

/* Auction Stats */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stats-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
}
.stats-row strong {
  color: var(--gold);
}

/* Teams List */
.teams-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.team-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}
.team-row:hover {
  background: var(--panel-hover);
}
.team-row.selected {
  background: var(--gold-dim);
  border-color: var(--gold-border);
  border-left: 3px solid var(--gold);
}

.team-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 16px;
  color: #000;
  flex-shrink: 0;
}

.team-info {
  flex: 1;
  min-width: 0;
}
.team-name {
  display: block;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.team-budget {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
}
.team-count {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-muted);
}

/* ─── Center Panel ───────────────────────────────────────────────────────────── */
.center-panel {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px 24px;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* Center Topbar */
.center-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.live-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--red-dim);
  border: 1px solid rgba(229, 57, 53, 0.3);
  padding: 6px 14px;
  border-radius: 100px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--red);
}

.round-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.round-label {
  font-family: var(--font-ui);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--text-muted);
}
.round-num {
  font-family: var(--font-display);
  font-size: 36px;
  color: var(--gold);
  letter-spacing: 2px;
  line-height: 1;
}

.date-label {
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--text-muted);
}

/* Player Hero */
.player-hero {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex: 0 0 auto;
}

.player-gif-wrap {
  position: relative;
  flex-shrink: 0;
  width: 160px;
}

.player-gif {
  width: 160px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.player-avatar-fallback {
  width: 160px;
  height: 200px;
  border-radius: var(--radius);
  background: linear-gradient(
    135deg,
    rgba(232, 184, 75, 0.2),
    rgba(232, 184, 75, 0.05)
  );
  border: 1px solid var(--gold-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 72px;
  color: var(--gold);
}

.player-ovr {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(8, 11, 18, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
}
.ovr-num {
  display: block;
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--gold);
  line-height: 1;
}
.ovr-label {
  display: block;
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-muted);
}
.ovr-role {
  display: block;
  font-size: 8px;
  letter-spacing: 1px;
  color: var(--text-dim);
  margin-top: 2px;
}

.player-details {
  flex: 1;
}

.player-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge-role {
  background: var(--panel);
  border: 1px solid var(--border);
  padding: 4px 12px;
  border-radius: 100px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-dim);
}

.badge-tier {
  background: transparent;
  border: 1px solid;
  padding: 4px 12px;
  border-radius: 100px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.player-name {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 60px);
  line-height: 0.95;
  letter-spacing: 2px;
  color: var(--text);
  margin-bottom: 16px;
}

/* Stat Bars */
.player-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-bar-item {
  display: grid;
  grid-template-columns: 36px 1fr 28px;
  align-items: center;
  gap: 8px;
}
.stat-label {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-muted);
}
.stat-track {
  height: 4px;
  background: var(--border);
  border-radius: 100px;
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), #f59e0b);
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-val {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  text-align: right;
}

/* Bid Section */
.bid-section {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  flex-shrink: 0;
}

.bid-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-bid-box {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.cbb-label {
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.cbb-team {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.cbb-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 14px;
  color: #000;
}
.cbb-team-name {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.cbb-amount {
  font-family: var(--font-display);
  font-size: 42px;
  color: var(--gold);
  letter-spacing: 2px;
  line-height: 1;
}

/* Timer */
.timer-wrap {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  transition: border-color 0.3s;
}
.timer-wrap.urgent {
  border-color: rgba(229, 57, 53, 0.4);
}
.timer-label {
  display: block;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.timer-display {
  display: block;
  font-family: var(--font-display);
  font-size: 38px;
  color: var(--text);
  letter-spacing: 3px;
  line-height: 1;
  margin-bottom: 10px;
}
.urgent .timer-display {
  color: var(--red);
  animation: flicker 0.5s ease-in-out infinite alternate;
}
@keyframes flicker {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.6;
  }
}
.timer-bar-track {
  height: 3px;
  background: var(--border);
  border-radius: 100px;
  overflow: hidden;
}
.timer-bar-fill {
  height: 100%;
  border-radius: 100px;
  transition:
    width 1s linear,
    background 0.3s;
}

/* Bid Right */
.bid-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-bids {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.qbid-btn {
  padding: 10px 4px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  transition: all 0.15s;
}
.qbid-btn:hover {
  background: var(--gold-dim);
  border-color: var(--gold-border);
  color: var(--gold);
  transform: translateY(-1px);
}
.qbid-btn:active {
  transform: translateY(0);
}

.custom-bid-row {
  display: flex;
  gap: 6px;
}
.custom-input {
  flex: 1;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.custom-input:focus {
  border-color: var(--gold-border);
}
.custom-input::placeholder {
  color: var(--text-muted);
}

.custom-add-btn {
  padding: 10px 18px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-dim);
  transition: all 0.15s;
}
.custom-add-btn:hover {
  border-color: var(--gold-border);
  color: var(--gold);
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-sold {
  padding: 14px;
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 2px;
  color: #000;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(232, 184, 75, 0.3);
}
.btn-sold:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(232, 184, 75, 0.5);
}
.btn-sold:active {
  transform: translateY(0);
}

.btn-next {
  padding: 14px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-dim);
  transition: all 0.15s;
}
.btn-next:hover {
  background: var(--panel-hover);
  color: var(--text);
}

/* Up Next Strip */
.up-next-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
  flex-shrink: 0;
}
.unx-label {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
.unx-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.unx-ovr {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--gold);
  line-height: 1;
}
.unx-name {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.unx-role {
  font-size: 11px;
  color: var(--text-muted);
}

/* Auction Complete */
.auction-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
}
.auction-complete h1 {
  font-family: var(--font-display);
  font-size: 64px;
  color: var(--gold);
  letter-spacing: 4px;
}
.auction-complete p {
  font-family: var(--font-ui);
  font-size: 16px;
  color: var(--text-dim);
}

/* ─── Right Sidebar ───────────────────────────────────────────────────────────── */
.bids-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bid-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--panel);
  border: 1px solid var(--border);
  transition: all 0.2s;
}
.bid-entry.bid-top {
  border-color: var(--gold-border);
  background: var(--gold-dim);
  animation: bid-flash 0.4s ease-out;
}
@keyframes bid-flash {
  from {
    transform: translateX(-4px);
    opacity: 0.5;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.bid-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--panel-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.bid-info {
  flex: 1;
  min-width: 0;
}
.bid-team {
  display: block;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bid-time {
  font-size: 10px;
  color: var(--text-muted);
}
.bid-amount {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
  flex-shrink: 0;
}

/* Quick Actions */
.quick-actions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.qa-btn {
  padding: 10px 14px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-dim);
  text-align: left;
  transition: all 0.15s;
}
.qa-btn:hover {
  background: var(--panel-hover);
  color: var(--text);
}
.qa-btn.qa-primary {
  background: var(--gold-dim);
  border-color: var(--gold-border);
  color: var(--gold);
}
.qa-btn.qa-primary:hover {
  background: rgba(232, 184, 75, 0.2);
}

/* Highest Bid Card */
.highest-bid-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.hb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 18px;
  color: #000;
}
.hb-team {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.hb-label {
  font-size: 10px;
  color: var(--text-muted);
}
.hb-amount {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--gold);
  margin-left: auto;
}

/* Top Clubs */
.top-clubs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  background: var(--panel);
  border: 1px solid var(--border);
}
.tc-rank {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  width: 18px;
}
.tc-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 12px;
  color: #000;
}
.tc-name {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.tc-spent {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
}
.tc-squad {
  font-size: 10px;
  color: var(--text-muted);
}

/* ─── Sold Overlay ────────────────────────────────────────────────────────────── */
.sold-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in 0.3s ease;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sold-card {
  background: linear-gradient(
    145deg,
    rgba(20, 24, 35, 0.95),
    rgba(12, 15, 22, 0.98)
  );
  border: 1px solid var(--gold-border);
  border-radius: 20px;
  padding: 40px 48px;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow:
    0 0 80px rgba(232, 184, 75, 0.15),
    0 40px 80px rgba(0, 0, 0, 0.6);
  animation: card-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes card-slam {
  from {
    transform: scale(0.8) translateY(40px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.sold-stamp {
  font-family: var(--font-display);
  font-size: 80px;
  color: var(--gold);
  letter-spacing: 6px;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 0 40px rgba(232, 184, 75, 0.5);
  animation: stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}
@keyframes stamp-in {
  from {
    transform: scale(1.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sold-player {
  font-family: var(--font-display);
  font-size: 44px;
  color: var(--text);
  letter-spacing: 3px;
  margin-bottom: 16px;
}

.sold-gif {
  width: 160px;
  height: 160px;
  object-fit: contain;
  margin: 0 auto 16px;
  display: block;
  border-radius: var(--radius);
}

.sold-details {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}
.sold-team {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dim);
}
.sold-price {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--gold);
  letter-spacing: 2px;
}

.btn-continue {
  padding: 14px 32px;
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 2px;
  color: #000;
  font-weight: 700;
  transition: all 0.2s;
}
.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232, 184, 75, 0.4);
}

/* ─── Teams Arena ────────────────────────────────────────────────────────────── */
.teams-arena {
  position: relative;
  z-index: 10;
  height: calc(100vh - var(--nav-h));
  overflow-y: auto;
  padding: 32px 40px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.arena-header {
  margin-bottom: 28px;
}
.arena-title {
  font-family: var(--font-display);
  font-size: 52px;
  color: var(--gold);
  letter-spacing: 4px;
  line-height: 1;
}
.arena-sub {
  font-family: var(--font-ui);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--text-muted);
}

.arena-table {
  background: rgba(8, 11, 18, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 32px;
}

.arena-thead {
  display: grid;
  grid-template-columns: 40px 1fr 60px 100px 100px 1fr 100px;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--border);
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-muted);
}

.arena-row {
  display: grid;
  grid-template-columns: 40px 1fr 60px 100px 100px 1fr 100px;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--text-dim);
  transition: background 0.15s;
}
.arena-row:last-child {
  border-bottom: none;
}
.arena-row:hover {
  background: var(--panel-hover);
}
.arena-row-top {
  background: var(--gold-dim) !important;
}

.ar-rank {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text-muted);
}
.ar-captain {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text);
}
.ar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 15px;
  color: #000;
}
.ar-gold {
  color: var(--gold);
  font-weight: 700;
}
.ar-top {
  font-size: 12px;
  color: var(--text-dim);
}

.ar-vibes {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vibe-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--gold), #f59e0b);
  border-radius: 100px;
  max-width: 60px;
}

/* Fun Cards */
.fun-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.fun-card {
  background: rgba(8, 11, 18, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
}
.fun-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.fun-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b8860b);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 20px;
  color: #000;
}
.fun-card-head h3 {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.fun-card-head p {
  font-size: 11px;
  color: var(--text-muted);
}

.fun-meters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.fun-meter-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--text-dim);
}
.fun-track {
  width: 60px;
  height: 3px;
  background: var(--border);
  border-radius: 100px;
  overflow: hidden;
}
.fun-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), #f59e0b);
  border-radius: 100px;
}
.fun-meter-row strong {
  font-size: 11px;
  color: var(--gold);
  width: 24px;
  text-align: right;
}

.fun-squad {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fun-player-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text-dim);
}
.fun-player-row strong {
  color: var(--gold);
  font-size: 12px;
}
.fun-tier {
  font-size: 10px;
}

/* ─── Home ───────────────────────────────────────────────────────────────────── */
.home-frame {
  position: relative;
  z-index: 10;
  width: 100%;
  flex: 1;
  border: none;
}

/* ─── Utilities ──────────────────────────────────────────────────────────────── */
.muted-text {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 12px 0;
}
```

---

## 3. `package.json` addition

Run this to install HLS.js:

```bash
npm install hls.js
npm install --save-dev @types/hls.js
```

---

## 4. `vite.config.ts` — no changes needed, just confirm this is there

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

---

## What changed vs your old code

| Area          | Old                   | New                                                                |
| ------------- | --------------------- | ------------------------------------------------------------------ |
| Background    | Static MP4            | HLS stream via `hls.js` with proper fallback                       |
| Layout        | 3 floating panels     | Full-bleed 3-column grid, edge-to-edge                             |
| Left panel    | Team buttons only     | Full sidebar: nav, round info, live badge, auction stats, teams    |
| Center        | Basic price + buttons | Player hero, OVR card, 6 stat bars, countdown timer, up-next strip |
| Right panel   | "No bids yet" text    | Live bids feed, quick actions, highest bid card, top clubs table   |
| Typography    | System fonts          | Bebas Neue (display) + Barlow Condensed (UI) + DM Sans (body)      |
| Sold overlay  | Basic modal           | Stamp animation, card-slam keyframe, gold glow                     |
| Teams tab     | Card grid             | League table + fun metrics cards                                   |
| Timer         | None                  | 30-second countdown per player with animated bar + urgency flash   |
| Bid animation | None                  | Slide-in flash on new top bid                                      |
