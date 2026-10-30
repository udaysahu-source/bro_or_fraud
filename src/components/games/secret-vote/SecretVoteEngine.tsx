import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Settings as SettingsIcon,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  ShieldAlert,
  Flame,
  Award,
  Users,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { buzz } from "@/lib/haptics";
import {
  playTimerTickSound,
  playTimerAlarmSound,
  playRoleRevealSound,
  playVictorySound,
  playSuspenseHeartbeat,
} from "@/lib/audio";
import { loadSettings, MatchSettings } from "@/lib/settings";
import { getContent, getLocalizedText } from "@/lib/games/loader";
import { LocalizedText } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";

export interface SecretVoteConfig<T = any> {
  gameId: string;
  gameName: string;
  gameTagline: string;
  instructions: {
    steps: { title: string; desc: string }[];
  };
  getPromptText: (
    item: T,
    lang: "hinglish" | "en",
  ) => {
    main: string;
    sub?: string;
    choiceA?: string;
    choiceB?: string;
  };
  options: {
    id: string;
    label: LocalizedText;
    emoji: string;
    color: string;
  }[];
  debateSeconds?: number;
  allowDebate?: boolean;
  allowReVote?: boolean;
  detectiveModeAvailable?: boolean;
  majorityScoring?: boolean;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  score: number;
}

const DEFAULT_PLAYERS: Player[] = [
  { id: "p1", name: "Raju", emoji: "User", score: 0 },
  { id: "p2", name: "Farhan", emoji: "Bot", score: 0 },
  { id: "p3", name: "Rancho", emoji: "Zap", score: 0 },
];

const PLAYER_COLORS = [
  "#22c55e", // lime-green
  "#ec4899", // pink
  "#3b82f6", // blue
  "#eab308", // amber
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
];

export function SecretVoteEngine({ config }: { config: SecretVoteConfig }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MatchSettings>(loadSettings());
  const [lang, setLang] = useState<"hinglish" | "en">(settings.language || "hinglish");
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Match setup state
  const [phase, setPhase] = useState<
    | "SETUP"
    | "ROUND_START"
    | "HANDOFF"
    | "PRIVATE_VOTE"
    | "VOTE_CONFIRM"
    | "AGGREGATE_REVEAL"
    | "DEBATE"
    | "RE_VOTE_HANDOFF"
    | "RE_VOTE_PRIVATE"
    | "SCOREBOARD"
    | "PODIUM"
  >("SETUP");

  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("bof:roster");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length >= 2) {
            return list.map((p: any, i: number) => ({
              id: `p_${i}`,
              name: p.name,
              emoji: p.emoji || "User",
              score: 0,
            }));
          }
        }
      } catch {
        /* noop */
      }
    }
    return DEFAULT_PLAYERS;
  });

  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [activeItem, setActiveItem] = useState<any>(null);

  // Turn management (private votes kept in MEMORY ONLY)
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  const [roundVotes, setRoundVotes] = useState<Record<string, string>>({});
  const [reVotes, setReVotes] = useState<Record<string, string>>({});

  // Debate timer
  const [debateSecondsLeft, setDebateSecondsLeft] = useState(config.debateSeconds || 25);
  const [debateActive, setDebateActive] = useState(false);

  // Loader draw bag
  const drawBagRef = useRef<() => any | null>(null);

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestLock = async () => {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          const navAny = navigator as any;
          wakeLock = await navAny.wakeLock.request("screen");
        } catch {
          /* ignore */
        }
      }
    };
    if (phase !== "SETUP" && phase !== "PODIUM") {
      requestLock();
    }
    return () => {
      wakeLock?.release();
    };
  }, [phase]);

  // Init content loader
  const initGame = () => {
    buzz(25);
    const content = getContent(config.gameId, {
      levels: [settings.contentLevel || "mild"],
    });
    drawBagRef.current = content.draw;
    startNewRound(1);
  };

  const startNewRound = (roundNum: number) => {
    const item = drawBagRef.current ? drawBagRef.current() : null;
    if (!item) {
      setPhase("PODIUM");
      return;
    }
    setActiveItem(item);
    setCurrentRound(roundNum);
    setRoundVotes({});
    setReVotes({});
    setCurrentPlayerIdx(0);
    setPendingChoice(null);
    setPhase("ROUND_START");
  };

  const startVotingHandoff = () => {
    buzz(20);
    setCurrentPlayerIdx(0);
    setPhase("HANDOFF");
  };

  const handleVoteSubmit = () => {
    if (!pendingChoice) return;
    buzz(20);
    const p = players[currentPlayerIdx];
    const newVotes = { ...roundVotes, [p.id]: pendingChoice };
    setRoundVotes(newVotes);
    setPendingChoice(null);

    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx((prev) => prev + 1);
      setPhase("HANDOFF");
    } else {
      // All players voted! Calculate scores & reveal
      processVotes(newVotes);
      setPhase("AGGREGATE_REVEAL");
    }
  };

  const processVotes = (votes: Record<string, string>) => {
    if (config.majorityScoring) {
      // Count frequency
      const counts: Record<string, number> = {};
      Object.values(votes).forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
      let maxCount = 0;
      let majorityOption = "";
      Object.entries(counts).forEach(([opt, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityOption = opt;
        }
      });
      // Award 1 point to majority voters
      setPlayers((prev) =>
        prev.map((p) => {
          if (votes[p.id] === majorityOption) {
            return { ...p, score: p.score + 1 };
          }
          return p;
        }),
      );
    }
  };

  // Debate countdown
  useEffect(() => {
    if (phase !== "DEBATE" || !debateActive) return;
    if (debateSecondsLeft <= 0) {
      playTimerAlarmSound();
      buzz([100, 50, 100]);
      setDebateActive(false);
      return;
    }

    const timer = setInterval(() => {
      setDebateSecondsLeft((prev) => {
        if (prev <= 5 && prev > 0) {
          playTimerTickSound(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, debateActive, debateSecondsLeft]);

  // Audio helper
  const isSound = settings.soundEnabled !== false;

  // Render Prompt Info
  const promptData = activeItem ? config.getPromptText(activeItem, lang) : { main: "" };

  const currPlayer = players[currentPlayerIdx] || players[0];
  const currColor = PLAYER_COLORS[currentPlayerIdx % PLAYER_COLORS.length];

  // ==========================================
  // PHASE: SETUP
  // ==========================================
  if (phase === "SETUP") {
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            onClick={() => buzz(15)}
            className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-[44px] flex items-center"
          >
            ← Game Hub
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                buzz(15);
                setLang((l) => (l === "hinglish" ? "en" : "hinglish"));
              }}
              className="px-2.5 py-1 rounded border border-border text-[11px] font-black uppercase text-lime bg-surface min-h-[36px]"
            >
              {lang === "hinglish" ? "Hinglish 🇮🇳" : "English 🇬🇧"}
            </button>
            <button
              type="button"
              onClick={() => {
                buzz(15);
                setShowHowToPlay(true);
              }}
              className="size-9 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="size-4" />
            </button>
          </div>
        </header>

        <main className="mt-8 space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-magenta">
              // party game
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mt-1">
              {config.gameName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{config.gameTagline}</p>
          </div>

          {/* Roster Summary */}
          <div className="rounded-2xl border-2 border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                👥 Players ({players.length})
              </span>
              <span className="text-[10px] text-lime font-bold">Pass the Phone</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-void text-xs font-bold"
                  style={{ borderColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                >
                  {renderAvatar(p.emoji, "size-4 text-current")}
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rounds Slider */}
          <div className="rounded-2xl border-2 border-border bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                🎯 Number of Rounds
              </span>
              <span className="text-sm font-black text-lime">{totalRounds} Rounds</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    buzz(15);
                    setTotalRounds(num);
                  }}
                  className={`py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                    totalRounds === num
                      ? "border-lime bg-lime text-void shadow"
                      : "border-border bg-void text-foreground"
                  }`}
                >
                  {num} Rounds
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="pt-6 pb-4">
          <button
            type="button"
            onClick={initGame}
            className="w-full rounded-2xl bg-lime px-6 py-4 text-center text-base font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink min-h-[52px] tactile tactile-press"
          >
            Start Round 1 →
          </button>
        </footer>

        {/* How to play modal */}
        <AnimatePresence>
          {showHowToPlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-void/90 backdrop-blur-md p-5 flex items-center justify-center"
            >
              <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-surface p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-black uppercase text-foreground">
                    How To Play {config.gameName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHowToPlay(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  {config.instructions.steps.map((st, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="font-black text-lime">{i + 1}.</span>
                      <div>
                        <strong className="text-foreground block">{st.title}</strong>
                        <span>{st.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full rounded-xl bg-lime py-3 text-xs font-black uppercase text-void"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================
  // PHASE: ROUND_START (Show prompt to group)
  // ==========================================
  if (phase === "ROUND_START") {
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe">
        <header className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-lime bg-lime/10 px-2.5 py-1 rounded-full border border-lime/30">
            Round {currentRound} of {totalRounds}
          </span>
          <button
            type="button"
            onClick={() => setLang((l) => (l === "hinglish" ? "en" : "hinglish"))}
            className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded"
          >
            {lang === "hinglish" ? "English" : "Hinglish"}
          </button>
        </header>

        <main className="my-auto space-y-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl border-2 border-border bg-surface p-6 brutal-shadow-pink space-y-4"
          >
            <span className="text-3xl">🔥</span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight leading-snug">
              {promptData.main}
            </h2>
            {promptData.sub && (
              <p className="text-xs text-muted-foreground font-medium">{promptData.sub}</p>
            )}
          </motion.div>
          <p className="text-xs text-muted-foreground font-medium">
            Read aloud to the group! Then pass the phone so each player votes privately.
          </p>
        </main>

        <footer className="pb-4">
          <button
            type="button"
            onClick={startVotingHandoff}
            className="w-full rounded-2xl bg-lime px-6 py-4 text-center text-base font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink min-h-[52px] tactile tactile-press"
          >
            Start Secret Voting →
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: HANDOFF (Privacy curtain)
  // ==========================================
  if (phase === "HANDOFF") {
    return (
      <div
        className="min-h-dvh flex flex-col justify-between p-6 text-void select-none"
        style={{ backgroundColor: currColor }}
      >
        <header className="flex items-center justify-between pt-safe">
          <span className="rounded-full bg-void/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-void">
            [ SECURE HANDOFF ]
          </span>
          <span className="text-xs font-black uppercase">
            Player {currentPlayerIdx + 1} of {players.length}
          </span>
        </header>

        <main className="my-auto text-center space-y-4">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-void text-white shadow-2xl">
            {renderAvatar(currPlayer.emoji, "size-10 text-white")}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">
              Pass the phone to
            </p>
            <h2 className="text-4xl font-black uppercase tracking-tight mt-1">{currPlayer.name}</h2>
          </div>
          <p className="text-xs max-w-xs mx-auto font-bold opacity-80">
            Keep the screen away from other bros. Your vote is confidential!
          </p>
        </main>

        <footer className="pb-safe">
          <button
            type="button"
            onClick={() => {
              buzz(25);
              setPhase("PRIVATE_VOTE");
            }}
            className="w-full rounded-2xl bg-void text-white py-4 text-base font-black uppercase tracking-wide border-2 border-white/20 min-h-[54px] active:scale-95 transition-transform"
          >
            I Am {currPlayer.name} — Show Options
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: PRIVATE_VOTE (Secret Choice)
  // ==========================================
  if (phase === "PRIVATE_VOTE") {
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between p-5 pb-safe">
        <header className="flex items-center justify-between pt-safe">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: currColor }} />
            <span className="text-xs font-black uppercase text-foreground">
              {currPlayer.name}'s Secret Turn
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Confidential
          </span>
        </header>

        <main className="my-auto space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-sm font-bold text-foreground">{promptData.main}</p>
          </div>

          <div className="space-y-3">
            {config.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  buzz(20);
                  setPendingChoice(opt.id);
                  setPhase("VOTE_CONFIRM");
                }}
                className="w-full rounded-2xl border-2 border-border bg-surface p-4 text-left flex items-center justify-between transition-all hover:border-lime active:scale-[0.98] min-h-[60px]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <div className="text-base font-black uppercase text-foreground">
                      {getLocalizedText(opt.label, lang)}
                    </div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </main>

        <footer className="text-center text-[11px] text-muted-foreground pb-2">
          Tap your choice to confirm privately.
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: VOTE_CONFIRM
  // ==========================================
  if (phase === "VOTE_CONFIRM") {
    const chosenOpt = config.options.find((o) => o.id === pendingChoice);
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between p-6 pb-safe text-center">
        <header className="pt-safe">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Confirm Your Choice
          </span>
        </header>

        <main className="my-auto space-y-4">
          <div className="size-16 rounded-3xl bg-lime/10 border-2 border-lime flex items-center justify-center mx-auto text-3xl">
            {chosenOpt?.emoji}
          </div>
          <h2 className="text-2xl font-black uppercase text-foreground">
            {getLocalizedText(chosenOpt?.label, lang)}
          </h2>
          <p className="text-xs text-muted-foreground">
            Once submitted, your choice locks in. Ready to pass the phone?
          </p>
        </main>

        <footer className="space-y-3 pb-safe">
          <button
            type="button"
            onClick={handleVoteSubmit}
            className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px] active:scale-95"
          >
            Lock Vote & Pass Phone →
          </button>
          <button
            type="button"
            onClick={() => setPhase("PRIVATE_VOTE")}
            className="w-full py-2.5 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
          >
            Change Selection
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: AGGREGATE_REVEAL
  // ==========================================
  if (phase === "AGGREGATE_REVEAL") {
    // Tally votes
    const counts: Record<string, number> = {};
    config.options.forEach((o) => (counts[o.id] = 0));
    Object.values(roundVotes).forEach((v) => {
      counts[v] = (counts[v] || 0) + 1;
    });

    const totalVotes = Object.values(roundVotes).length || 1;

    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe">
        <header className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-lime bg-lime/10 px-2.5 py-1 rounded-full border border-lime/30">
            Round {currentRound} Verdict
          </span>
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Aggregate Results
          </span>
        </header>

        <main className="my-auto space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-magenta">
              The Question
            </span>
            <p className="text-sm font-black text-foreground">{promptData.main}</p>
          </div>

          {/* Results Bars */}
          <div className="space-y-3">
            {config.options.map((opt) => {
              const count = counts[opt.id] || 0;
              const pct = Math.round((count / totalVotes) * 100);
              return (
                <div
                  key={opt.id}
                  className="rounded-2xl border-2 border-border bg-surface p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase flex items-center gap-2">
                      <span>{opt.emoji}</span>
                      <span>{getLocalizedText(opt.label, lang)}</span>
                    </span>
                    <span className="text-sm font-black text-lime">
                      {count} {count === 1 ? "player" : "players"} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-void overflow-hidden border border-border">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-lime rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="space-y-3 pb-4">
          {config.allowDebate && (
            <button
              type="button"
              onClick={() => {
                buzz(20);
                setDebateSecondsLeft(config.debateSeconds || 30);
                setDebateActive(true);
                setPhase("DEBATE");
              }}
              className="w-full rounded-2xl bg-surface py-3.5 text-xs font-black uppercase text-foreground border-2 border-border hover:border-lime transition-colors"
            >
              Start 30s Live Roast / Debate 🗣️
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              buzz(20);
              setPhase("SCOREBOARD");
            }}
            className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px] active:scale-95"
          >
            View Scoreboard →
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: DEBATE
  // ==========================================
  if (phase === "DEBATE") {
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe text-center">
        <header className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-magenta">
            // LIVE DEBATE
          </span>
          <button
            type="button"
            onClick={() => setDebateActive((prev) => !prev)}
            className="text-xs font-bold uppercase text-muted-foreground border border-border px-2.5 py-1 rounded"
          >
            {debateActive ? "Pause ⏸" : "Resume ▶"}
          </button>
        </header>

        <main className="my-auto space-y-6">
          <div className="size-36 rounded-full border-4 border-lime mx-auto flex flex-col items-center justify-center bg-lime/10 shadow-[0_0_30px_rgba(255,214,0,0.2)]">
            <span className="text-4xl font-black font-display text-lime">{debateSecondsLeft}s</span>
            <span className="text-[10px] font-black uppercase text-muted-foreground">
              Remaining
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-black uppercase text-foreground">Defend Your Corner!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Give 15 seconds to both sides to explain why their choice is the only correct answer.
            </p>
          </div>
        </main>

        <footer className="pb-4">
          <button
            type="button"
            onClick={() => {
              buzz(20);
              setPhase("SCOREBOARD");
            }}
            className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px]"
          >
            Proceed to Scoreboard →
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: SCOREBOARD
  // ==========================================
  if (phase === "SCOREBOARD") {
    const isGameOver = currentRound >= totalRounds;
    return (
      <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe">
        <header className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Round {currentRound} of {totalRounds} Completed
          </span>
          <span className="text-xs font-black uppercase text-lime">Scoreboard</span>
        </header>

        <main className="my-auto space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black uppercase text-foreground">
              {isGameOver ? "Final Scores 🏆" : "Round Standings"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isGameOver ? "Here is how the group ranked!" : "Next question coming up!"}
            </p>
          </div>

          <div className="space-y-2.5">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-muted-foreground w-5">#{idx + 1}</span>
                    <div className="size-8 rounded-full bg-void flex items-center justify-center">
                      {renderAvatar(p.emoji, "size-4 text-current")}
                    </div>
                    <span className="text-sm font-black uppercase text-foreground">{p.name}</span>
                  </div>
                  <span className="text-base font-black text-lime font-display">{p.score} pts</span>
                </div>
              ))}
          </div>
        </main>

        <footer className="pb-4">
          {isGameOver ? (
            <button
              type="button"
              onClick={() => {
                playVictorySound();
                buzz([40, 40, 80]);
                setPhase("PODIUM");
              }}
              className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px]"
            >
              See Awards & Wrap Up 🏆
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startNewRound(currentRound + 1)}
              className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px]"
            >
              Next Round ({currentRound + 1}/{totalRounds}) →
            </button>
          )}
        </footer>
      </div>
    );
  }

  // ==========================================
  // PHASE: PODIUM (End of game)
  // ==========================================
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-dvh bg-void text-foreground flex flex-col justify-between px-5 pt-6 pb-safe text-center">
      <header className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-magenta">
          // MATCH CONCLUDED
        </span>
        <Link
          to="/"
          onClick={() => buzz(15)}
          className="text-xs font-black uppercase text-muted-foreground hover:text-foreground"
        >
          Exit to Hub ✕
        </Link>
      </header>

      <main className="my-auto space-y-6">
        <div className="size-20 rounded-3xl bg-lime text-void flex items-center justify-center text-4xl mx-auto shadow-2xl">
          👑
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime">
            Top Scoring Bro
          </span>
          <h2 className="text-3xl font-black uppercase text-foreground mt-1">{winner?.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-bold">
            Champion with {winner?.score} Points
          </p>
        </div>

        {/* Fun Campus Awards */}
        <div className="rounded-2xl border-2 border-border bg-surface p-4 text-left space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            🎖️ Campus Superlatives
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-border">
            <span className="text-muted-foreground">Most Unhinged Mind</span>
            <span className="font-black text-foreground">{sorted[0]?.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-border">
            <span className="text-muted-foreground">Secret Keeper</span>
            <span className="font-black text-foreground">{sorted[1]?.name || sorted[0]?.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-muted-foreground">Pure Innocent Soul</span>
            <span className="font-black text-foreground">{sorted[sorted.length - 1]?.name}</span>
          </div>
        </div>
      </main>

      <footer className="space-y-3 pb-4">
        <button
          type="button"
          onClick={() => {
            buzz(25);
            setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
            initGame();
          }}
          className="w-full rounded-2xl bg-lime py-4 text-base font-black uppercase text-void border-2 border-void brutal-shadow-pink min-h-[52px] active:scale-95"
        >
          Play Again (Same Players) 🔄
        </button>
        <Link
          to="/"
          onClick={() => buzz(15)}
          className="block w-full py-3 text-xs font-black uppercase text-muted-foreground hover:text-foreground"
        >
          Back To Hub
        </Link>
      </footer>
    </div>
  );
}
