import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import {
  Search,
  Bomb,
  Smartphone,
  Ghost,
  EyeOff,
  Split,
  Coffee,
  Flame,
  Users,
  Package,
  Globe,
  SlidersHorizontal,
  Plus,
  Minus,
  Radio,
  Sparkles,
} from "lucide-react";
import { buzz } from "@/lib/haptics";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Bro or Fraud? — Catch the fraud before they catch you" },
      {
        name: "description",
        content:
          "A mobile-first party game for hostel groups. Pass the phone, bluff your way out, and catch the fraud.",
      },
      { property: "og:title", content: "Bro or Fraud?" },
      {
        property: "og:description",
        content: "Catch the fraud. Or be the fraud. Play with your friends right now.",
      },
    ],
  }),
});

interface Mode {
  id: string;
  n: string;
  d: string;
  p: string;
  c: string;
  col: string;
  flag?: boolean;
  route: string;
  minPlayers: number;
  icon: typeof Search;
}

const MODES: Mode[] = [
  {
    id: "bro-or-fraud",
    n: "Bro or Fraud?",
    d: "One fraud. Everyone else knows the spot. Bluff or bust.",
    p: "3–20",
    c: "Spy",
    col: "#fbbf24",
    flag: true,
    route: "/play/local",
    minPlayers: 3,
    icon: Search,
  },
  {
    id: "pass-the-bomb",
    n: "Pass the Bomb",
    d: "Don’t be the one holding it when it goes off.",
    p: "3–12",
    c: "Fast",
    col: "#f0508a",
    route: "/games/pass-the-bomb",
    minPlayers: 3,
    icon: Bomb,
  },
  {
    id: "heads-up-tilt",
    n: "Heads Up",
    d: "Phone on forehead. Tilt down yes, up pass.",
    p: "2–12",
    c: "Fast",
    col: "#fb923c",
    route: "/games/heads-up-tilt",
    minPlayers: 2,
    icon: Smartphone,
  },
  {
    id: "confession-roulette",
    n: "Confession Roulette",
    d: "Guess who confessed. Dodge the decoys.",
    p: "3–10",
    c: "Tea",
    col: "#a78bfa",
    route: "/games/confession-roulette",
    minPlayers: 3,
    icon: Ghost,
  },
  {
    id: "never-have-i-ever",
    n: "Never Have I Ever",
    d: "Secret votes. See how many bros did it.",
    p: "3–12",
    c: "Tea",
    col: "#38bdf8",
    route: "/games/never-have-i-ever",
    minPlayers: 3,
    icon: EyeOff,
  },
  {
    id: "would-you-rather",
    n: "Would You Rather",
    d: "50/50 splits, then a 20 second defense.",
    p: "3–12",
    c: "Debate",
    col: "#34d399",
    route: "/games/would-you-rather",
    minPlayers: 3,
    icon: Split,
  },
];

const FILTERS = ["All", "Tea", "Fast", "Debate", "Spy"];

const PACKS = [
  { name: "Mess Food", count: "24 cards", category: "Campus" },
  { name: "Night Owls", count: "30 cards", category: "Hostel" },
  { name: "Exam Season", count: "18 cards", category: "Academic" },
  { name: "Cricket Gang", count: "22 cards", category: "Sports" },
];

const SPOTS = [
  "Hostel Mess",
  "Campus Canteen",
  "Library Reading Room",
  "Cricket Ground",
  "Terrace at 2 AM",
  "Laundry Room",
  "Maggi Point",
  "Dean's Office",
  "Gymkhana",
  "Computer Lab",
];

const TAGS = [
  "One of you is lying. Probably Kabir.",
  "No signup. No wifi drama.",
  "Trust no bro.",
  "Roast responsibly. Or don’t.",
  "Pass the phone. Lose a friend.",
];

const AVC = ["#fbbf24", "#f0508a", "#fb923c", "#a78bfa", "#38bdf8"];

interface ModeCardProps {
  mode: Mode;
  isActive: boolean;
  onSelect: (fullIdx: number) => void;
  fullIdx: number;
}

const ModeCard = memo(function ModeCard({ mode, isActive, onSelect, fullIdx }: ModeCardProps) {
  const IconComp = mode.icon;
  return (
    <button
      className="v6-card"
      style={{ "--c": mode.col } as React.CSSProperties}
      data-on={isActive ? "1" : "0"}
      onClick={() => onSelect(fullIdx)}
      aria-label={`${mode.n}. ${mode.d}`}
    >
      {mode.flag ? <span className="v6-stk fl">Flagship</span> : null}
      <span className="top">
        <span className="pill">{mode.c}</span>
        <span className="flex items-center gap-1.5 font-bold">
          <Users className="size-4" strokeWidth={1.5} />
          {mode.p}
        </span>
      </span>
      <span className="v6-em" aria-hidden="true">
        <IconComp className="size-8" strokeWidth={1.5} />
      </span>
      <span>
        <h3>{mode.n}</h3>
        <p>{mode.d}</p>
      </span>
    </button>
  );
});

export function Home() {
  const navigate = useNavigate();

  // State
  const [filter, setFilter] = useState("All");
  const [activeIdx, setActiveIdx] = useState(0);
  const [players, setPlayers] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bof_players");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return ["Aarav", "Mehul", "Riya", "Kabir"];
  });

  const [activeSheet, setActiveSheet] = useState<"setup" | "packs" | "online" | "settings" | null>(
    null,
  );
  const [selectedModeIdx, setSelectedModeIdx] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const [tagFade, setTagFade] = useState(true);

  // Settings
  const [theme, setTheme] = useState<"auto" | "light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bof_theme") as "auto" | "light" | "dark" | null;
      if (stored) return stored;
    }
    return "auto";
  });
  const [wakeLock, setWakeLock] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [roomError, setRoomError] = useState(false);

  const railRef = useRef<HTMLDivElement>(null);

  // Filtered mode list
  const filteredModes = useMemo(() => {
    return MODES.filter((m) => filter === "All" || m.c === filter);
  }, [filter]);

  const currentMode = filteredModes[activeIdx] || filteredModes[0] || MODES[0];

  // Rotate tagline (paused when prefers-reduced-motion is active)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      setTagFade(false);
      setTimeout(() => {
        setTagIndex((prev) => (prev + 1) % TAGS.length);
        setTagFade(true);
      }, 250);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Save players to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bof_players", JSON.stringify(players));
    }
  }, [players]);

  // Apply theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      localStorage.setItem("bof_theme", theme);
      if (theme === "auto") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", theme);
      }
    }
  }, [theme]);

  // Handle CSS snap scroll tracking
  const handleRailScroll = () => {
    const r = railRef.current;
    if (!r || r.children.length === 0) return;
    const c = r.scrollLeft + r.clientWidth / 2;
    let best = 0;
    let minDiff = 1e9;
    Array.from(r.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const x = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c);
      if (x < minDiff) {
        minDiff = x;
        best = i;
      }
    });
    if (best !== activeIdx && best < filteredModes.length) {
      setActiveIdx(best);
    }
  };

  const openSetup = useCallback((idx: number) => {
    buzz(12);
    setSelectedModeIdx(idx);
    setActiveSheet("setup");
  }, []);

  const addPlayer = () => {
    if (players.length < 20) {
      buzz(10);
      setPlayers([...players, ""]);
    }
  };

  const removePlayer = (i: number) => {
    buzz(10);
    const updated = [...players];
    updated.splice(i, 1);
    setPlayers(updated);
  };

  const updatePlayer = (i: number, val: string) => {
    const updated = [...players];
    updated[i] = val;
    setPlayers(updated);
  };

  // Launch match into the respective engine
  const handleStartMatch = (mode: Mode) => {
    buzz(15);
    const activePlayers = players.map((p) => p.trim()).filter(Boolean);
    if (activePlayers.length < mode.minPlayers) return;

    setActiveSheet(null);

    if (mode.id === "bro-or-fraud") {
      const randomFraudIdx = Math.floor(Math.random() * activePlayers.length);
      const targetWord = SPOTS[Math.floor(Math.random() * SPOTS.length)];
      const otherWords = SPOTS.filter((w) => w !== targetWord);
      const bluffWord = otherWords[Math.floor(Math.random() * otherWords.length)] || "Gymkhana";

      const matchConfig = {
        players: activePlayers.map((name) => ({ name, emoji: "User" })),
        impostorsCount: 1,
        timerSeconds: 300,
        rounds: 3,
        revealStyle: "hold",
        soundEnabled,
        chaosMode: false,
        selectedPacks: ["college-life"],
        categoryName: "Hostel & Campus",
        targetWord,
        bluffWord,
        fraudsIndices: [randomFraudIdx],
        currentRound: 1,
        scores: activePlayers.reduce((acc, name) => ({ ...acc, [name]: 0 }), {}),
        usedWords: [targetWord],
        votingMode: "pointing",
      };

      sessionStorage.setItem("bof_match_config", JSON.stringify(matchConfig));
      sessionStorage.setItem("bof_recent_frauds", JSON.stringify([randomFraudIdx]));
      navigate({ to: "/play/local" });
    } else {
      sessionStorage.setItem("bof_active_players", JSON.stringify(activePlayers));
      navigate({ to: mode.route as any });
    }
  };

  const currentSetupMode = MODES[selectedModeIdx] || MODES[0];
  const validPlayers =
    players.map((p) => p.trim()).filter(Boolean).length >= currentSetupMode.minPlayers;

  return (
    <div className="v6-container">
      <div className="v6-app">
        {/* Header */}
        <header className="v6-header">
          <h1 className="v6-logo">
            <span className="y">Bro</span>
            <br />
            <span className="o">or</span> <span className="p">Fraud?</span>
          </h1>
          <div className="v6-mark" role="img" aria-label="Bro or Fraud logo">
            <img
              src="/logo.webp"
              alt="Bro or Fraud"
              width={72}
              height={72}
              className="w-full h-full object-cover rounded-[22%]"
            />
          </div>
        </header>

        {/* Rotating Tagline */}
        <div className="v6-tag" style={{ opacity: tagFade ? 1 : 0 }} aria-live="off">
          {TAGS[tagIndex]}
        </div>

        {/* Main Hub */}
        <main className="v6-main">
          {/* Filter chips (min 44px tall) */}
          <div className="v6-chips" role="group" aria-label="Filter games">
            {FILTERS.map((f) => (
              <button
                key={f}
                className="v6-chip min-h-[44px]"
                aria-pressed={filter === f}
                onClick={() => {
                  buzz(8);
                  setFilter(f);
                  setActiveIdx(0);
                  if (railRef.current) {
                    railRef.current.scrollLeft = 0;
                  }
                }}
              >
                {f === "All" ? "All games" : f}
              </button>
            ))}
          </div>

          {/* Swipeable Snap Cards Rail */}
          <div className="v6-rail" ref={railRef} onScroll={handleRailScroll} aria-label="Games">
            {filteredModes.map((m, i) => {
              const fullIdx = MODES.findIndex((orig) => orig.id === m.id);
              const isActive = i === activeIdx;
              return (
                <ModeCard
                  key={m.id}
                  mode={m}
                  isActive={isActive}
                  fullIdx={fullIdx}
                  onSelect={openSetup}
                />
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="v6-dots">
            {filteredModes.map((_, i) => (
              <i key={i} className={i === activeIdx ? "on" : ""} />
            ))}
          </div>

          {/* Player Strip */}
          <button
            className="v6-who min-h-[48px]"
            onClick={() => {
              const fullIdx = MODES.findIndex((orig) => orig.id === currentMode.id);
              openSetup(fullIdx >= 0 ? fullIdx : 0);
            }}
            aria-label="Edit players"
          >
            <span className="av">
              {players.slice(0, 5).map((p, i) => (
                <b key={i} style={{ background: AVC[i % AVC.length] }}>
                  {(p[0] || "?").toUpperCase()}
                </b>
              ))}
            </span>
            <small>
              <b>{players.length} players</b>
              {players.slice(0, 3).join(", ")}
              {players.length > 3 ? " and more" : ""}
            </small>
            <span className="ed">Edit</span>
          </button>
        </main>

        {/* Sticky Bottom Dock */}
        <div className="v6-dock">
          <button
            className="v6-cta min-h-[52px]"
            onClick={() => {
              const fullIdx = MODES.findIndex((orig) => orig.id === currentMode.id);
              openSetup(fullIdx >= 0 ? fullIdx : 0);
            }}
          >
            Play {currentMode.n}
          </button>
          <div className="v6-links">
            <button
              className="min-h-[44px]"
              aria-label="Open packs"
              onClick={() => {
                buzz(8);
                setActiveSheet("packs");
              }}
            >
              <Package className="size-4.5" strokeWidth={1.5} />
              Packs
            </button>
            <button
              className="min-h-[44px]"
              aria-label="Open online lobby"
              onClick={() => {
                buzz(8);
                setActiveSheet("online");
              }}
            >
              <Globe className="size-4.5" strokeWidth={1.5} />
              Online
              <span className="v6-beta">BETA</span>
            </button>
            <button
              className="min-h-[44px]"
              aria-label="Open settings"
              onClick={() => {
                buzz(8);
                setActiveSheet("settings");
              }}
            >
              <SlidersHorizontal className="size-4.5" strokeWidth={1.5} />
              Settings
            </button>
          </div>
        </div>

        {/* Bottom Sheets */}
        {activeSheet && (
          <div
            className="v6-sheet-wrap"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveSheet(null);
              }
            }}
          >
            <div className="v6-sheet">
              {/* Setup Sheet */}
              {activeSheet === "setup" && (
                <>
                  <div className="v6-bar">
                    <button className="min-h-[44px]" onClick={() => setActiveSheet(null)}>
                      Cancel
                    </button>
                    <span className="ttl">Game setup</span>
                    <button
                      className="min-h-[44px]"
                      disabled={!validPlayers}
                      style={{ opacity: validPlayers ? 1 : 0.4 }}
                      onClick={() => handleStartMatch(currentSetupMode)}
                    >
                      Start
                    </button>
                  </div>
                  <div className="v6-sbody">
                    <div className="v6-group">
                      <div className="v6-row" style={{ paddingBlock: "0.5rem" }}>
                        <span className="v6-tile" aria-hidden="true">
                          {(() => {
                            const Icon = currentSetupMode.icon;
                            return <Icon className="size-5" strokeWidth={1.5} />;
                          })()}
                        </span>
                        <span className="t">
                          {currentSetupMode.n}
                          <br />
                          <small>{currentSetupMode.d}</small>
                        </span>
                      </div>
                    </div>

                    <h2 className="v6-s">Players ({players.length})</h2>
                    <div className="v6-group">
                      {players.map((p, i) => (
                        <div key={i} className="v6-field">
                          <span className="v6-num">{i + 1}</span>
                          <input
                            value={p}
                            placeholder="Player name"
                            autoComplete="name"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            aria-label={`Player ${i + 1} name`}
                            onChange={(e) => updatePlayer(i, e.target.value)}
                          />
                          <button
                            className="v6-rm min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label={`Remove player ${i + 1}`}
                            onClick={() => removePlayer(i)}
                          >
                            <Minus className="size-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      ))}
                      {players.length < 20 && (
                        <button
                          className="v6-addp min-h-[44px] flex items-center gap-2"
                          onClick={addPlayer}
                        >
                          <Plus className="size-4" strokeWidth={1.5} /> Add player
                        </button>
                      )}
                    </div>
                    <p className="v6-note">
                      {validPlayers
                        ? `${currentSetupMode.p} players supported.`
                        : `Need at least ${currentSetupMode.minPlayers} players to start.`}
                    </p>
                  </div>
                </>
              )}

              {/* Packs Sheet */}
              {activeSheet === "packs" && (
                <>
                  <div className="v6-bar">
                    <button className="min-h-[44px]" onClick={() => setActiveSheet(null)}>
                      Done
                    </button>
                    <span className="ttl">Packs</span>
                    <span style={{ minWidth: "4rem" }} />
                  </div>
                  <div className="v6-sbody">
                    <button
                      className="v6-cta min-h-[48px]"
                      style={{ margin: "0.5rem 0 1rem" }}
                      onClick={() => {
                        buzz(10);
                        navigate({ to: "/play/setup" });
                      }}
                    >
                      Browse & Create Packs
                    </button>
                    <div className="v6-group">
                      {PACKS.map((p, i) => (
                        <div key={i} className="v6-row">
                          <span className="v6-tile" aria-hidden="true">
                            <Package className="size-5" strokeWidth={1.5} />
                          </span>
                          <span className="t">
                            {p.name}
                            <br />
                            <small>
                              {p.count} • {p.category}
                            </small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Online Sheet */}
              {activeSheet === "online" && (
                <>
                  <div className="v6-bar">
                    <button className="min-h-[44px]" onClick={() => setActiveSheet(null)}>
                      Done
                    </button>
                    <span className="ttl">Online</span>
                    <span style={{ minWidth: "4rem" }} />
                  </div>
                  <div className="v6-sbody">
                    <p className="v6-note" style={{ marginBottom: "1rem" }}>
                      Beta. Everyone plays from their own phone.
                    </p>
                    <input
                      className={`v6-code ${roomError ? "border-pink-500" : ""}`}
                      id="rc"
                      autoCapitalize="characters"
                      autoComplete="off"
                      maxLength={4}
                      placeholder="CODE"
                      aria-label="Room code"
                      value={roomCode}
                      onChange={(e) => {
                        setRoomError(false);
                        setRoomCode(e.target.value.toUpperCase());
                      }}
                    />
                    {roomError && (
                      <p className="text-xs font-bold text-pink-400 -mt-1 mb-2 text-center">
                        Enter a valid 4-letter room code.
                      </p>
                    )}
                    <button
                      className="v6-cta min-h-[48px]"
                      onClick={() => {
                        const trimmed = roomCode.trim().toUpperCase();
                        if (trimmed.length < 4) {
                          setRoomError(true);
                          buzz(30);
                          return;
                        }
                        buzz(15);
                        navigate({ to: `/online/room/${trimmed}` as any });
                      }}
                    >
                      Join room
                    </button>
                    <button
                      className="v6-cta ghost min-h-[48px]"
                      style={{ marginTop: "0.75rem" }}
                      onClick={() => {
                        buzz(15);
                        navigate({ to: "/online/lobby" });
                      }}
                    >
                      Create a room
                    </button>
                    <div className="v6-empty">
                      <span
                        className="v6-tile"
                        style={{
                          margin: "0 auto",
                          width: "3.5rem",
                          height: "3.5rem",
                          borderRadius: "1rem",
                        }}
                        aria-hidden="true"
                      >
                        <Radio className="size-6 text-muted-foreground" strokeWidth={1.5} />
                      </span>
                      <b>No recent rooms</b>
                      Rooms you join show up here.
                    </div>
                  </div>
                </>
              )}

              {/* Settings Sheet */}
              {activeSheet === "settings" && (
                <>
                  <div className="v6-bar">
                    <button className="min-h-[44px]" onClick={() => setActiveSheet(null)}>
                      Done
                    </button>
                    <span className="ttl">Settings</span>
                    <span style={{ minWidth: "4rem" }} />
                  </div>
                  <div className="v6-sbody">
                    <h2 className="v6-s">Appearance</h2>
                    <div className="v6-seg" role="group" aria-label="Theme">
                      {(["auto", "light", "dark"] as const).map((t) => (
                        <button
                          key={t}
                          className="min-h-[44px]"
                          aria-pressed={theme === t}
                          onClick={() => {
                            buzz(8);
                            setTheme(t);
                          }}
                        >
                          {t[0].toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>

                    <h2 className="v6-s">During games</h2>
                    <div className="v6-group">
                      <div className="v6-row">
                        <span className="t">Keep screen awake</span>
                        <button
                          className="v6-sw min-h-[44px]"
                          role="switch"
                          aria-checked={wakeLock}
                          aria-label="Keep screen awake"
                          onClick={() => {
                            buzz(8);
                            setWakeLock(!wakeLock);
                          }}
                        />
                      </div>
                      <div className="v6-row">
                        <span className="t">Sound effects</span>
                        <button
                          className="v6-sw min-h-[44px]"
                          role="switch"
                          aria-checked={soundEnabled}
                          aria-label="Sound effects"
                          onClick={() => {
                            buzz(8);
                            setSoundEnabled(!soundEnabled);
                          }}
                        />
                      </div>
                    </div>
                    <p className="v6-note">Screen stays on so the phone doesn’t sleep mid-round.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
