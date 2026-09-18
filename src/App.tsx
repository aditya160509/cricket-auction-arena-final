import { useEffect, useMemo, useState, useCallback } from "react";
import "./App.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "home" | "auction" | "teams" | "settings";
type Player = {
  id: number;
  name: string;
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
const ROLE_ROTATION = ["Striker", "Winger", "Midfielder", "Defender", "Goalkeeper"];

const GIF_MAP: Record<string, string> = {
  anjaneypandey: "Anjaney",
  anshparab: "Ansh",
  darsh: "Darsh",
  devmehta: "Dev",
  drashyavaghani: "Drashya",
  harsheel: "Harsheel",
  keyaanagarwal: "Keyaan",
  kian: "Kian",
  priyam: "Priyam",
  raihanshaikh: "Raihan",
  siddhantfouzdar: "Siddhant",
  veers: "Veer",
  vihaansheth: "Vihaan",
  aditya: "Aditya",
  monaal: "Monaal",
};


// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "");
const formatCr = (l: number) => `₹${(l / 100).toFixed(2)}Cr`;
const formatL = (l: number) => `₹${l}L`;

function parseCaptains(md: string) {
  return md
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function playerGifPath(name: string) {
  const key = normalizeName(name);
  const folder = GIF_MAP[key];
  return folder ? `/assets/players/${folder}/celebration.gif` : "";
}

function funnyScore(team: Team) {
  const josh = Math.min(100, Math.round((team.spentL / TEAM_BUDGET_L) * 100));
  const bakchodi = Math.min(100, team.players.length * 12);
  const meme = Math.min(100, team.players.length * 14);
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
// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({
  seconds,
  paused,
  onEnd,
}: {
  seconds: number;
  paused?: boolean;
  onEnd?: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);
  useEffect(() => {
    if (paused) return;
    if (left <= 0) {
      onEnd?.();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onEnd, paused]);
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
  teams,
  selectedBidder,
  onSelectBidder,
  round,
  upNext,
  bidResetKey,
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
  teams: Team[];
  selectedBidder: string;
  onSelectBidder: (id: string) => void;
  round: number;
  upNext: Player[];
  bidResetKey: number;
}) {
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  useEffect(() => setTimerKey((k) => k + 1), [current, bidResetKey]);
  useEffect(() => setTimerPaused(false), [current, bidResetKey]);

  // Fake stat values seeded from player id for visual consistency
  const stats = current
    ? [
        { label: "PAC", value: 78 + ((current.id * 13) % 22) },
        { label: "SHO", value: 76 + ((current.id * 17) % 21) },
        { label: "PAS", value: 77 + ((current.id * 11) % 20) },
        { label: "DRI", value: 80 + ((current.id * 7) % 18) },
        { label: "DEF", value: 70 + ((current.id * 19) % 25) },
        { label: "PHY", value: 82 + ((current.id * 3) % 16) },
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
<div className="player-avatar-fallback">{current.name[0]}</div>
              <div className="player-ovr">
                <span className="ovr-num">{85 + (current.id % 15)}</span>
                <span className="ovr-label">OVR</span>
                <span className="ovr-role">
                  {current.role.split("-")[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div className="player-details">
              <div className="player-badges">
                <span className="badge-role">
                  {current.role}
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
              <CountdownTimer key={timerKey} seconds={45} paused={timerPaused} onEnd={() => onSold()} />
              <button className="timer-stop-btn" onClick={() => setTimerPaused((p) => !p)}>
                {timerPaused ? "Resume Timer" : "Stop Timer"}
              </button>
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
                <select
                  className="custom-input"
                  value={selectedBidder}
                  onChange={(e) => onSelectBidder(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      Sell To: {t.captain}
                    </option>
                  ))}
                </select>
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
                  SOLD
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
                  <span className="unx-ovr">{84 + (p.id % 16)}</span>
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
}: {
  bidHistory: BidEntry[];
  teams: Team[];
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
  const [captainNames, setCaptainNames] = useState<string[]>([]);
  const [captainPlayers, setCaptainPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    (async () => {
      const [playersMd, captainsMd] = await Promise.all([
        fetch("/player.md").then((r) => r.text()),
        fetch("/captains.md").then((r) => r.text()),
      ]);
      const allNames = playersMd
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const loadedCaptainNames = parseCaptains(captainsMd);
      const captainSet = new Set(loadedCaptainNames.map(normalizeName));
      const names = allNames.filter((name) => !captainSet.has(normalizeName(name)));
      const allPlayers: Player[] = names.map((name, i) => {
        return {
          id: i + 1,
          name,
          role: ROLE_ROTATION[i % ROLE_ROTATION.length],
          basePriceL: 10,
        };
      });
      const ordered = allPlayers;
      const initialTeams = loadedCaptainNames.map((c, i) => ({
        id: `t${i + 1}`,
        captain: c,
        budgetL: TEAM_BUDGET_L,
        spentL: 0,
        players: [],
      }));
      setTeams(initialTeams);
      setCaptainNames(loadedCaptainNames);
      setCurrent(ordered[0] ?? null);
      setQueue(ordered.slice(1));
      setBidL(ordered[0]?.basePriceL ?? 10);
      setSelectedBidder(initialTeams[0]?.id ?? "");
      setTotalPlayers(ordered.length);
    })();
  }, []);

  const makeCaptain = useCallback((playerName: string) => {
    if (captainNames.some((name) => normalizeName(name) === normalizeName(playerName))) return;
    const promoted = current?.name === playerName;
    const nextPlayer = queue[0] ?? null;
    const promotedPlayer = current?.name === playerName ? current : queue.find((player) => player.name === playerName);
    const newTeamId = `t${teams.length + 1}`;
    setCaptainNames((prev) => [...prev, playerName]);
    setSelectedBidder((selected) => selected || newTeamId);
    if (promotedPlayer) setCaptainPlayers((prev) => ({ ...prev, [normalizeName(playerName)]: promotedPlayer }));
    setTeams((prev) => [
      ...prev,
      {
        id: newTeamId,
        captain: playerName,
        budgetL: TEAM_BUDGET_L,
        spentL: 0,
        players: [],
      },
    ]);
    setQueue((prev) => prev.filter((player) => player.name !== playerName));
    if (promoted) {
      setCurrent(nextPlayer);
      setQueue((prev) => prev.slice(1));
      setBidL(nextPlayer?.basePriceL ?? 10);
      setBidHistory([]);
      setRound((value) => value + 1);
    }
    setTotalPlayers((value) => Math.max(0, value - 1));
  }, [captainNames, current, queue, teams.length]);

  const removeCaptain = useCallback((captainName: string) => {
    const restoredPlayer = captainPlayers[normalizeName(captainName)];
    setCaptainNames((prev) => prev.filter((name) => name !== captainName));
    setTeams((prev) => {
      const removed = prev.find((team) => team.captain === captainName);
      if (removed?.id === selectedBidder) {
        const replacement = prev.find((team) => team.id !== removed.id);
        setSelectedBidder(replacement?.id ?? "");
      }
      return prev.filter((team) => team.captain !== captainName);
    });
    setCaptainPlayers((prev) => {
      const next = { ...prev };
      delete next[normalizeName(captainName)];
      return next;
    });
    if (restoredPlayer) {
      setQueue((prev) => [...prev, restoredPlayer]);
      setTotalPlayers((value) => value + 1);
    }
  }, [captainPlayers, selectedBidder]);

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

  const sellCurrentToTeam = useCallback((teamId?: string) => {
    if (!current) return;
    const winnerId = teamId ?? bidHistory[0]?.teamId ?? selectedBidder;
    const winner = teams.find((t) => t.id === winnerId) ?? activeBidder ?? teams[0];
    if (!winner) return;
    if (bidL > winner.budgetL) return;
    setTeams((prev) =>
      prev.map((t) =>
        t.id === winner.id
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
      teamName: winner.captain,
      priceL: bidL,
    });
  }, [current, bidHistory, selectedBidder, activeBidder, teams, bidL]);

  return (
    <div className="app-shell">
      {/* Static backdrop keeps the auction fast and distraction-free. */}
      {tab !== "home" && (
        <div className="global-bg-overlay" />
      )}

      {/* Top Nav */}
      <header className="topnav">
        <div className="topnav-left">
          <span className="topnav-logo">CRICKET AUCTION</span>
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
          {(["home", "auction", "teams", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-tab ${tab === t ? "nav-tab-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "home"
                ? "Home"
                : t === "auction"
                  ? "Live Auction"
                  : t === "teams"
                    ? "Team Arena"
                    : "Settings"}
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
            onSold={() => sellCurrentToTeam()}
            onNext={nextPlayer}
            activeBidder={activeBidder}
            teams={teams}
            selectedBidder={selectedBidder}
            onSelectBidder={setSelectedBidder}
            round={round}
            upNext={queue}
            bidResetKey={bidHistory.length}
          />
          <RightPanel bidHistory={bidHistory} teams={teams} />
        </div>
      )}

      {tab === "teams" && (
        <TeamsArena teams={teams} />
      )}

      {tab === "settings" && (
        <section className="settings-page">
          <div className="settings-card">
            <p className="sidebar-section-label">AUCTION SETTINGS</p>
            <h1>Manage Captains</h1>
            <p className="settings-copy">
              Promote a player to captain. They will be removed from the auction pool and receive a new team purse.
            </p>
            <div className="captain-list">
              {captainNames.map((name) => (
                <div key={name} className="captain-setting-row">
                  <span>{name}</span>
                  <div className="captain-actions">
                    <strong>Captain</strong>
                    <button className="captain-remove-button" onClick={() => removeCaptain(name)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <h2>Promote a player</h2>
            <div className="promote-list">
              {[current, ...queue].filter((player): player is Player => Boolean(player)).map((player) => (
                <button key={player.id} className="promote-button" onClick={() => makeCaptain(player.name)}>
                  <span>{player.name}</span>
                  <span>Make captain →</span>
                </button>
              ))}
            </div>
          </div>
        </section>
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
