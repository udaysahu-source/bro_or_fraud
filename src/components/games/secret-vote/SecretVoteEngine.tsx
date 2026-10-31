import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
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
  Trophy,
  Crown,
  Hand,
  ShieldCheck,
  Coffee,
  Sparkles,
  ArrowRight,
  Lock,
  Pause,
  X,
  BarChart2,
  MessageSquare,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { buzz } from "@/lib/haptics";
import {
  playTimerTickSound,
  playTimerAlarmSound,
  playRoleRevealSound,
  playVictorySound,
  playSuspenseHeartbeatSound,
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
  { id: "p1", name: "Player 1", emoji: "User", score: 0 },
  { id: "p2", name: "Player 2", emoji: "Bot", score: 0 },
  { id: "p3", name: "Player 3", emoji: "Zap", score: 0 },
];

const PLAYER_ACCENTS = [
  { color: "#fbbf24", glow: "rgba(251, 191, 36, 0.25)" },
  { color: "#f0508a", glow: "rgba(240, 80, 138, 0.25)" },
  { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.25)" },
  { color: "#a78bfa", glow: "rgba(167, 139, 250, 0.25)" },
  { color: "#34d399", glow: "rgba(52, 211, 153, 0.25)" },
  { color: "#fb923c", glow: "rgba(251, 146, 60, 0.25)" },
];

function renderOptionIcon(emojiOrIcon: string, className = "size-5") {
  const IconComponent = (
    LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; strokeWidth?: number }>
    >
  )[emojiOrIcon];

  if (IconComponent) {
    return <IconComponent className={className} strokeWidth={1.5} />;
  }

  // Fallback map
  if (emojiOrIcon.includes("🙋") || emojiOrIcon.toLowerCase().includes("hand")) {
    return <Hand className={className} strokeWidth={1.5} />;
  }
  if (emojiOrIcon.includes("😇") || emojiOrIcon.toLowerCase().includes("shield")) {
    return <ShieldCheck className={className} strokeWidth={1.5} />;
  }
  if (emojiOrIcon.includes("🥤") || emojiOrIcon.toLowerCase().includes("coffee")) {
    return <Coffee className={className} strokeWidth={1.5} />;
  }
  if (emojiOrIcon.includes("🔥") || emojiOrIcon.toLowerCase().includes("flame")) {
    return <Flame className={className} strokeWidth={1.5} />;
  }
  if (emojiOrIcon.includes("🧊") || emojiOrIcon.toLowerCase().includes("alert")) {
    return <ShieldAlert className={className} strokeWidth={1.5} />;
  }

  return <Sparkles className={className} strokeWidth={1.5} />;
}

export function SecretVoteEngine({ config }: { config: SecretVoteConfig }) {
  const navigate = useNavigate();
  const [settings] = useState<MatchSettings>(loadSettings());
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
          wakeLock = await (navigator as any).wakeLock.request("screen");
        } catch {
          /* noop */
        }
      }
    };
    requestLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Auto-hide private content if screen blurred or backgrounded
  useEffect(() => {
    const handleHide = () => {
      if (phase === "PRIVATE_VOTE" || phase === "VOTE_CONFIRM") {
        setPhase("HANDOFF");
        setPendingChoice(null);
      }
    };
    window.addEventListener("blur", handleHide);
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      window.removeEventListener("blur", handleHide);
      document.removeEventListener("visibilitychange", handleHide);
    };
  }, [phase]);

  // Init game
  const initGame = () => {
    buzz(20);
    const contentList = getContent(config.gameId as any);
    const shuffled = [...contentList].sort(() => Math.random() - 0.5);
    let pointer = 0;
    drawBagRef.current = () => {
      if (pointer >= shuffled.length) pointer = 0;
      return shuffled[pointer++];
    };

    startNewRound(1);
  };

  const startNewRound = (roundNum: number) => {
    setCurrentRound(roundNum);
    setRoundVotes({});
    setCurrentPlayerIdx(0);
    setPendingChoice(null);

    const nextPrompt = drawBagRef.current ? drawBagRef.current() : null;
    setActiveItem(nextPrompt);
    setPhase("ROUND_START");
  };

  const startVotingHandoff = () => {
    buzz(25);
    playSuspenseHeartbeatSound();
    setCurrentPlayerIdx(0);
    setPhase("HANDOFF");
  };

  const handleVoteSubmit = () => {
    if (!pendingChoice) return;
    buzz(30);

    const playerId = players[currentPlayerIdx].id;
    const nextVotes = { ...roundVotes, [playerId]: pendingChoice };
    setRoundVotes(nextVotes);
    setPendingChoice(null);

    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx((prev) => prev + 1);
      setPhase("HANDOFF");
    } else {
      // Calculate majority scoring if enabled
      if (config.majorityScoring) {
        const counts: Record<string, number> = {};
        Object.values(nextVotes).forEach((v) => (counts[v] = (counts[v] || 0) + 1));
        let maxVoteChoice = "";
        let maxCount = -1;
        Object.entries(counts).forEach(([choice, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxVoteChoice = choice;
          }
        });

        setPlayers((prev) =>
          prev.map((p) => {
            const playerVote = nextVotes[p.id];
            if (playerVote === maxVoteChoice) {
              return { ...p, score: p.score + 100 };
            }
            return p;
          }),
        );
      }
      playRoleRevealSound();
      setPhase("AGGREGATE_REVEAL");
    }
  };

  // Debate Countdown timer
  useEffect(() => {
    if (phase !== "DEBATE" || !debateActive || debateSecondsLeft <= 0) {
      if (phase === "DEBATE" && debateSecondsLeft === 0) {
        playTimerAlarmSound();
        buzz([50, 50, 80]);
        setDebateActive(false);
      }
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

  const promptData = activeItem ? config.getPromptText(activeItem, lang) : { main: "" };
  const currPlayer = players[currentPlayerIdx] || players[0];
  const currAccent = PLAYER_ACCENTS[currentPlayerIdx % PLAYER_ACCENTS.length];

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand-gold)]/20">
      {/* UNIFORM FRAME: TOP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--separator)]">
        <Link
          to="/"
          onClick={() => buzz(15)}
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--chip)] transition-colors"
        >
          End game
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">
            {config.gameName}
          </span>
          {phase !== "SETUP" && phase !== "PODIUM" && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)] tabular-nums">
              R{currentRound}/{totalRounds}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              buzz(15);
              setLang((l) => (l === "hinglish" ? "en" : "hinglish"));
            }}
            className="min-h-[36px] px-2.5 py-1 rounded-[var(--radius-btn)] text-[11px] font-semibold bg-[var(--chip)] text-[var(--text)] border border-[var(--separator)] transition-colors"
          >
            {lang === "hinglish" ? "Hinglish" : "English"}
          </button>
          <button
            type="button"
            aria-label="How to play"
            onClick={() => {
              buzz(15);
              setShowHowToPlay(true);
            }}
            className="size-9 rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)] grid place-items-center cursor-pointer"
          >
            <HelpCircle className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* PHASE: SETUP */}
        {phase === "SETUP" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                Party Secret Mode
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                {config.gameName}
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">{config.gameTagline}</p>
            </div>

            {/* Roster Summary */}
            <div
              className="rounded-[var(--radius-card)] bg-[var(--card)] p-4 border border-[var(--separator)] space-y-3"
              style={{
                boxShadow: "0 0 24px -6px rgba(251, 191, 36, 0.2)",
              }}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>Players ({players.length})</span>
                <span className="text-[var(--gold-text)]">Pass the phone</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)]"
                  >
                    {renderAvatar(p.emoji, "size-4 text-[var(--gold-text)]")}
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rounds Selector */}
            <div className="rounded-[var(--radius-group)] bg-[var(--card)] p-4 border border-[var(--separator)] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>Rounds</span>
                <span className="text-[var(--gold-text)] font-bold tabular-nums">
                  {totalRounds} Rounds
                </span>
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
                    className={`py-2 rounded-[var(--radius-btn)] text-xs font-bold tabular-nums transition-colors ${
                      totalRounds === num
                        ? "bg-[var(--brand-gold)] text-[var(--on-gold)]"
                        : "bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                    }`}
                  >
                    {num} Rounds
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={initGame}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Round 1</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE: ROUND_START (Show prompt to group) */}
        {phase === "ROUND_START" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                Prompt Card
              </span>
              <h1 className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-2">
                Read aloud to the room
              </h1>
            </div>

            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-4"
              style={{
                boxShadow: "0 0 24px -6px rgba(251, 191, 36, 0.2)",
              }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight leading-snug">
                {promptData.main}
              </h2>
              {promptData.sub && (
                <p className="text-xs text-[var(--text-secondary)] font-medium">{promptData.sub}</p>
              )}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={startVotingHandoff}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start Secret Voting</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE: HANDOFF (Curtain) */}
        {phase === "HANDOFF" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)]">
                <Lock className="size-3 text-[var(--brand-pink)]" strokeWidth={1.5} />
                Private Vote
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Pass the phone
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Player {currentPlayerIdx + 1} of {players.length}
              </p>
            </div>

            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center"
              style={{
                boxShadow: `0 0 24px -6px ${currAccent.glow}`,
              }}
            >
              <div
                className="size-20 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center mb-3"
                style={{ color: currAccent.color }}
              >
                {renderAvatar(currPlayer.emoji, "size-10 text-current")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
                {currPlayer.name}
              </h2>
              <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[28ch]">
                Keep the screen shielded. Your answer will stay secret.
              </p>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => {
                  buzz(25);
                  setPhase("PRIVATE_VOTE");
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I Am {currPlayer.name} · Vote</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE: PRIVATE_VOTE */}
        {phase === "PRIVATE_VOTE" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                <span>Voter: {currPlayer.name}</span>
                <span className="text-[var(--gold-text)]">Confidential</span>
              </div>
              <div className="p-4 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-sm font-bold text-[var(--text)]">
                {promptData.main}
              </div>
            </div>

            {/* Options list */}
            <div className="my-auto space-y-2.5">
              {config.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    buzz(20);
                    setPendingChoice(opt.id);
                    setPhase("VOTE_CONFIRM");
                  }}
                  className="w-full min-h-[60px] rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] p-4 text-left flex items-center justify-between hover:bg-[var(--chip)] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-[0.5rem] bg-[var(--chip)] text-[var(--gold-text)] grid place-items-center">
                      {renderOptionIcon(opt.emoji, "size-5")}
                    </div>
                    <span className="text-sm font-bold text-[var(--text)]">
                      {getLocalizedText(opt.label, lang)}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[var(--text-secondary)] pb-2">
              Tap your choice to confirm privately.
            </p>
          </div>
        )}

        {/* PHASE: VOTE_CONFIRM */}
        {phase === "VOTE_CONFIRM" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                Confirm Selection
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                Lock in your vote
              </h1>
            </div>

            {(() => {
              const chosenOpt = config.options.find((o) => o.id === pendingChoice);
              return (
                <div className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center space-y-3">
                  <div className="size-16 rounded-[var(--radius-group)] bg-[var(--chip)] text-[var(--gold-text)] grid place-items-center">
                    {chosenOpt ? renderOptionIcon(chosenOpt.emoji, "size-8") : null}
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text)]">
                    {chosenOpt ? getLocalizedText(chosenOpt.label, lang) : ""}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] max-w-[26ch]">
                    Once submitted, your choice locks in. Ready to pass to the next player?
                  </p>
                </div>
              );
            })()}

            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={handleVoteSubmit}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lock Vote & Pass Phone</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => setPhase("PRIVATE_VOTE")}
                className="w-full min-h-[44px] rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)]"
              >
                Change Selection
              </button>
            </div>
          </div>
        )}

        {/* PHASE: AGGREGATE_REVEAL (Results as ONE BIG NUMBER or SPLIT BAR) */}
        {phase === "AGGREGATE_REVEAL" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            {(() => {
              const counts: Record<string, number> = {};
              config.options.forEach((o) => (counts[o.id] = 0));
              Object.values(roundVotes).forEach((v) => {
                counts[v] = (counts[v] || 0) + 1;
              });
              const totalVotes = Object.values(roundVotes).length || 1;
              const firstOpt = config.options[0];
              const firstCount = counts[firstOpt?.id || ""] || 0;
              const firstPct = Math.round((firstCount / totalVotes) * 100);

              return (
                <>
                  <div className="text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                      Aggregate Reveal
                    </span>

                    {/* Big Number Summary */}
                    <div className="py-2">
                      <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-[var(--text)] tabular-nums">
                        {firstCount} / {totalVotes}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">
                        Bros chose {getLocalizedText(firstOpt?.label, lang)} ({firstPct}%)
                      </p>
                    </div>

                    <div className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text-secondary)]">
                      "{promptData.main}"
                    </div>
                  </div>

                  {/* Split Bars for all options */}
                  <div className="my-auto space-y-3 w-full">
                    {config.options.map((opt) => {
                      const count = counts[opt.id] || 0;
                      const pct = Math.round((count / totalVotes) * 100);
                      return (
                        <div
                          key={opt.id}
                          className="rounded-[var(--radius-group)] bg-[var(--card)] p-3.5 border border-[var(--separator)] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2 text-[var(--text)]">
                              <span className="text-[var(--gold-text)]">
                                {renderOptionIcon(opt.emoji, "size-4")}
                              </span>
                              <span>{getLocalizedText(opt.label, lang)}</span>
                            </span>
                            <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--chip)] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full bg-[var(--brand-gold)] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-full space-y-2 pt-4">
                    {config.allowDebate && (
                      <button
                        type="button"
                        onClick={() => {
                          buzz(20);
                          setDebateSecondsLeft(config.debateSeconds || 30);
                          setDebateActive(true);
                          setPhase("DEBATE");
                        }}
                        className="w-full min-h-[46px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 border border-[var(--separator)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare
                          className="size-4 text-[var(--gold-text)]"
                          strokeWidth={1.5}
                        />
                        <span>Start 30s Live Roast / Debate</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        buzz(20);
                        setPhase("SCOREBOARD");
                      }}
                      className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>View Scoreboard</span>
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* PHASE: DEBATE */}
        {phase === "DEBATE" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--gold-text)]">Live Debate</span>
              <button
                type="button"
                onClick={() => setDebateActive((prev) => !prev)}
                className="px-2.5 py-1 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 flex items-center gap-1 cursor-pointer"
              >
                {debateActive ? (
                  <>
                    <Pause className="size-3" strokeWidth={1.5} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3" strokeWidth={1.5} />
                    <span>Resume</span>
                  </>
                )}
              </button>
            </div>

            <div className="my-auto w-full space-y-4">
              <div className="size-44 rounded-full border-2 border-[var(--brand-gold)]/40 bg-[var(--card)] mx-auto flex flex-col items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                <span className="font-mono text-5xl font-bold text-[var(--gold-text)] tabular-nums">
                  {debateSecondsLeft}s
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
                  Remaining
                </span>
              </div>

              <div className="p-4 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text-secondary)]">
                Give 15 seconds to both sides to defend their choice!
              </div>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => {
                  buzz(20);
                  setPhase("SCOREBOARD");
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Scoreboard</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE: SCOREBOARD */}
        {phase === "SCOREBOARD" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Round {currentRound} of {totalRounds} Completed
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                {currentRound >= totalRounds ? "Final Standings" : "Current Standings"}
              </h2>
            </div>

            <div className="my-auto space-y-2 w-full max-h-[50dvh] overflow-y-auto pr-1">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-[var(--radius-group)] border text-xs font-semibold ${
                      idx === 0
                        ? "bg-[var(--card)] border-[var(--brand-gold)]/50 shadow-[0_0_16px_rgba(251,191,36,0.15)]"
                        : "bg-[var(--card)] border-[var(--separator)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm text-[var(--text-secondary)] tabular-nums w-5">
                        #{idx + 1}
                      </span>
                      <div className="size-8 rounded-[0.5rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)]">
                        {renderAvatar(p.emoji, "size-4 text-current")}
                      </div>
                      <span className="text-[var(--text)]">{p.name}</span>
                    </div>
                    <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                      {p.score} pts
                    </span>
                  </div>
                ))}
            </div>

            <div className="w-full pt-4">
              {currentRound >= totalRounds ? (
                <button
                  type="button"
                  onClick={() => {
                    playVictorySound();
                    buzz([40, 40, 80]);
                    setPhase("PODIUM");
                  }}
                  className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trophy className="size-4" strokeWidth={1.5} />
                  <span>See Awards & Wrap Up</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startNewRound(currentRound + 1)}
                  className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    Start Round {currentRound + 1} of {totalRounds}
                  </span>
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE: PODIUM */}
        {phase === "PODIUM" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            {(() => {
              const sorted = [...players].sort((a, b) => b.score - a.score);
              const winner = sorted[0];

              return (
                <>
                  <div className="space-y-1">
                    <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                      <Crown className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                      Match Champion
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] mt-1">
                      {winner?.name}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                      {winner?.score} Points Total
                    </p>
                  </div>

                  {/* Fun Awards */}
                  <div className="my-auto space-y-2 w-full text-left">
                    <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-secondary)]">Most Unhinged Mind</span>
                      <span className="text-[var(--text)]">{sorted[0]?.name}</span>
                    </div>
                    <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-secondary)]">Secret Keeper</span>
                      <span className="text-[var(--text)]">
                        {sorted[1]?.name || sorted[0]?.name}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--text-secondary)]">Pure Innocent Soul</span>
                      <span className="text-[var(--text)]">{sorted[sorted.length - 1]?.name}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        buzz(25);
                        setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
                        initGame();
                      }}
                      className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="size-4" strokeWidth={1.5} />
                      <span>Play Again</span>
                    </button>
                    <Link
                      to="/"
                      onClick={() => buzz(15)}
                      className="block w-full py-2.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] text-center"
                    >
                      Back to Party Hub
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* HOW TO PLAY MODAL */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--separator)] pb-3">
                <h3 className="text-sm font-bold text-[var(--text)]">
                  How To Play {config.gameName}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHowToPlay(false)}
                  className="size-8 rounded-full bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)] grid place-items-center"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                {config.instructions.steps.map((st, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="font-mono font-bold text-[var(--gold-text)] tabular-nums">
                      {i + 1}.
                    </span>
                    <div>
                      <strong className="text-[var(--text)] block">{st.title}</strong>
                      <span>{st.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-full min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-bold text-[var(--text)] hover:bg-[var(--chip)]/80"
              >
                Got It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
