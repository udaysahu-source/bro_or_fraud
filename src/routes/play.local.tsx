import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  buzz,
  success as hapticSuccess,
  error as hapticError,
  reveal as hapticReveal,
} from "@/lib/haptics";
import {
  playRoleRevealSound,
  playPassTurnSound,
  playDiscussionStartSound,
  playTimerTickSound,
  playTimerAlarmSound,
  playVoteConfirmSound,
  playVerdictSound,
  playSuspenseHeartbeatSound,
} from "@/lib/audio";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  HelpCircle,
  User,
  ShieldAlert,
  Sparkles,
  Fingerprint,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Trophy,
  Flame,
  Crown,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Unlock,
  MessageSquare,
  Vote,
  BarChart2,
  Search,
  Award,
  Drama,
  Check,
  X,
  Volume2,
} from "lucide-react";
import { PACKS } from "@/lib/mcp/packs";
import { fetchCustomPacks, type CustomPack } from "@/lib/customPacks";
import { renderAvatar } from "./play.setup";
import { renderShareCard, shareCard } from "@/lib/share-card";

export const Route = createFileRoute("/play/local")({
  component: PassPhoneGame,
  head: () => ({
    meta: [
      { title: "Local Match — Bro or Fraud?" },
      { name: "description", content: "Pass the phone local gameplay loop." },
    ],
  }),
});

interface Player {
  name: string;
  emoji: string;
}

interface MatchConfig {
  players: Player[];
  impostorsCount: number;
  timerSeconds: number;
  rounds: number;
  revealStyle: "hold" | "tap" | "auto";
  soundEnabled: boolean;
  chaosMode: boolean;
  selectedPacks: string[];
  categoryName: string;
  targetWord: string;
  bluffWord: string;
  fraudsIndices: number[];
  currentRound: number;
  scores: Record<string, number>;
  usedWords?: string[];
  votingMode?: "pointing" | "secret";
  fraudEscapes?: Record<string, number>;
  innocentAccusations?: Record<string, number>;
}

type Phase = "pass" | "reveal" | "discussion" | "voting" | "suspense" | "verdict" | "game_over";

const PLAYER_ACCENTS = [
  { color: "#fbbf24", glow: "rgba(251, 191, 36, 0.25)" },
  { color: "#f0508a", glow: "rgba(240, 80, 138, 0.25)" },
  { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.25)" },
  { color: "#a78bfa", glow: "rgba(167, 139, 250, 0.25)" },
  { color: "#34d399", glow: "rgba(52, 211, 153, 0.25)" },
  { color: "#fb923c", glow: "rgba(251, 146, 60, 0.25)" },
];

const ROASTS_WIN = [
  "Bro got cooked faster than Maggi in a hostel kettle",
  "Bros saw right through your bluff, clean your glasses next time",
  "You lied worse than a student claiming they read the syllabus",
  "Fraud got caught red-handed. Go back to acting school",
  "Bro was shaking while bluffing. Rizz level: zero",
];

const ROASTS_LOSE = [
  "Fraud escaped. Bros got played worse than a proxy attendance scam",
  "The Fraud was literally right there and you voted for a Bro. Brain cells: 0",
  "Bro got gaslit into thinking they were clean. Rizz Master at work",
  "The Fraud is laughing all the way back to their hostel room",
  "Bros are certified clowns. You got absolutely cooked",
];

export function PassPhoneGame() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MatchConfig | null>(null);

  // Game state
  const [phase, setPhase] = useState<Phase>("pass");
  const [currentPlayer, setCurrentPlayer] = useState(0);

  // Reveal phase state
  const [holdProgress, setHoldProgress] = useState(0);
  const [held, setHeld] = useState(false);
  const holdRef = useRef<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [autoHideCountdown, setAutoHideCountdown] = useState(7);
  const autoHideRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRevealTimer, setAutoRevealTimer] = useState(3);

  // Discussion state
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [overtimeUsed, setOvertimeUsed] = useState(false);
  const [discussionStarter, setDiscussionStarter] = useState<number | null>(null);

  // Voting state
  const [votingCountdown, setVotingCountdown] = useState<number | null>(null);
  const [voteTallies, setVoteTallies] = useState<Record<number, number>>({});
  const [secretVoteCurrentPlayer, setSecretVoteCurrentPlayer] = useState(0);
  const [secretVotes, setSecretVotes] = useState<Record<number, number>>({});
  const [secretVotePhase, setSecretVotePhase] = useState<"pass" | "vote">("pass");
  const [pendingSuspectVote, setPendingSuspectVote] = useState<number | null>(null);

  // Dramatic Suspense Reveal
  const shouldReduceMotion = useReducedMotion();
  const suspenseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [suspenseStep, setSuspenseStep] = useState<"tally" | "accused" | "verdict">("tally");
  const [votedPlayerIndex, setVotedPlayerIndex] = useState<number | null>(null);
  const [broWon, setBroWon] = useState(false);
  const [roastCopy, setRoastCopy] = useState("");
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});

  // Peek word modal
  const [showPeekModal, setShowPeekModal] = useState(false);
  const [peekPlayerIdx, setPeekPlayerIdx] = useState<number | null>(null);
  const [peekHeld, setPeekHeld] = useState(false);

  // Share card preview
  const [sharing, setSharing] = useState(false);

  // Candidates for next round
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);
  const [wordCandidates, setWordCandidates] = useState<
    { target: string; bluff: string; category: string }[]
  >([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number | "custom" | "replay">(0);
  const [customTargetWord, setCustomTargetWord] = useState("");
  const [customBluffWord, setCustomBluffWord] = useState("");

  const clearSuspenseTimer = () => {
    if (suspenseTimerRef.current) {
      clearTimeout(suspenseTimerRef.current);
      suspenseTimerRef.current = null;
    }
  };

  const advanceSuspenseSequence = () => {
    buzz(20);
    clearSuspenseTimer();
    if (suspenseStep === "tally") {
      stepToAccused();
    } else if (suspenseStep === "accused") {
      stepToVerdict();
    } else if (suspenseStep === "verdict") {
      finishSuspense();
    }
  };

  const stepToAccused = () => {
    clearSuspenseTimer();
    setSuspenseStep("accused");
    playSuspenseHeartbeatSound();
    buzz([30, 30]);
    suspenseTimerRef.current = setTimeout(() => {
      stepToVerdict();
    }, 1600);
  };

  const stepToVerdict = () => {
    clearSuspenseTimer();
    setSuspenseStep("verdict");
    const isVotedFraud =
      votedPlayerIndex !== null &&
      config !== null &&
      config.fraudsIndices.includes(votedPlayerIndex);
    setBroWon(isVotedFraud);
    playVerdictSound(isVotedFraud);
    if (isVotedFraud) {
      hapticSuccess();
    } else {
      hapticError();
    }
    suspenseTimerRef.current = setTimeout(() => {
      finishSuspense();
    }, 2200);
  };

  const finishSuspense = () => {
    clearSuspenseTimer();
    if (currentRound >= totalRounds) {
      setPhase("game_over");
    } else {
      setPhase("verdict");
    }
  };

  useEffect(() => {
    return () => clearSuspenseTimer();
  }, []);

  // Screen Wake Lock API integration
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        try {
          const navWithWakeLock = navigator as unknown as {
            wakeLock: {
              request: (type: string) => Promise<{ release: () => Promise<void> }>;
            };
          };
          wakeLock = await navWithWakeLock.wakeLock.request("screen");
        } catch {
          /* ignore lock rejection */
        }
      }
    };
    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Hide private content when app is backgrounded or window blurs
  useEffect(() => {
    const handleHide = () => {
      setIsRevealed(false);
      setHeld(false);
      setPeekHeld(false);
    };
    window.addEventListener("blur", handleHide);
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      window.removeEventListener("blur", handleHide);
      document.removeEventListener("visibilitychange", handleHide);
    };
  }, []);

  // Load Config from sessionStorage & restore progress if any
  useEffect(() => {
    const raw = sessionStorage.getItem("bof_match_config");
    if (!raw) {
      navigate({ to: "/play/setup" });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as MatchConfig;
      if (!parsed || !Array.isArray(parsed.players) || parsed.players.length === 0) {
        navigate({ to: "/play/setup" });
        return;
      }
      setConfig(parsed);
      setSecondsLeft(parsed.timerSeconds > 0 ? parsed.timerSeconds : 30);

      const savedProgress = localStorage.getItem("bof_active_session_v1");
      if (savedProgress) {
        try {
          const prog = JSON.parse(savedProgress);
          if (prog && prog.currentRound === parsed.currentRound) {
            setPhase(prog.phase || "pass");
            setCurrentPlayer(prog.currentPlayer || 0);
          }
        } catch {
          /* noop */
        }
      }
    } catch {
      navigate({ to: "/play/setup" });
      return;
    }

    setCustomPacks(fetchCustomPacks());
  }, []);

  // Save in-progress session
  useEffect(() => {
    if (!config) return;
    try {
      localStorage.setItem(
        "bof_active_session_v1",
        JSON.stringify({
          currentRound: config.currentRound,
          phase,
          currentPlayer,
        }),
      );
    } catch {
      /* noop */
    }
  }, [config, phase, currentPlayer]);

  // Hold-to-reveal animation
  useEffect(() => {
    if (!held) {
      setHoldProgress(0);
      return;
    }
    const start = Date.now();
    const duration = 500;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setHoldProgress(p);
      if (p < 1) {
        holdRef.current = requestAnimationFrame(tick);
      } else {
        buzz([40, 30, 40]);
        setPhase("reveal");
        setIsRevealed(true);
        setHeld(false);
        playRoleRevealSound();
      }
    };
    holdRef.current = requestAnimationFrame(tick);
    return () => {
      if (holdRef.current) cancelAnimationFrame(holdRef.current);
    };
  }, [held]);

  // Auto-reveal style timer countdown
  useEffect(() => {
    if (phase === "reveal" && config?.revealStyle === "auto" && !isRevealed) {
      const timer = setInterval(() => {
        setAutoRevealTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRevealed(true);
            playRoleRevealSound();
            buzz(25);
            return 0;
          }
          buzz(10);
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, config?.revealStyle, isRevealed]);

  // Auto-hide timer for secret word protection
  useEffect(() => {
    if (phase === "reveal" && isRevealed) {
      setAutoHideCountdown(7);
      if (autoHideRef.current) clearInterval(autoHideRef.current);

      autoHideRef.current = setInterval(() => {
        setAutoHideCountdown((c) => {
          if (c <= 1) {
            if (autoHideRef.current) clearInterval(autoHideRef.current);
            setIsRevealed(false);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      return () => {
        if (autoHideRef.current) clearInterval(autoHideRef.current);
      };
    }
  }, [phase, isRevealed]);

  // Discussion countdown timer
  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 5 && next > 0) {
          buzz(20);
          playTimerTickSound(true);
        } else if (next <= 10 && next > 5) {
          buzz(12);
          playTimerTickSound(false);
        }
        if (next === 0) {
          clearInterval(interval);
          setTimerActive(false);
          playTimerAlarmSound();
          startVotingPhase();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

  // Physical pointing countdown
  useEffect(() => {
    if (phase === "voting" && votingCountdown !== null) {
      if (votingCountdown > 0) {
        const timer = setTimeout(() => {
          setVotingCountdown((c) => (c !== null ? c - 1 : null));
          buzz(20);
          playTimerTickSound(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setVotingCountdown(null);
          const initialTallies: Record<number, number> = {};
          config?.players.forEach((_, idx) => {
            initialTallies[idx] = 0;
          });
          setVoteTallies(initialTallies);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, votingCountdown, config?.players]);

  if (!config) {
    return (
      <div className="min-h-dvh bg-[var(--bg)] grid place-items-center text-[var(--text)]">
        <div className="text-center font-bold uppercase text-[var(--gold-text)] tracking-widest text-sm">
          Loading Match...
        </div>
      </div>
    );
  }

  const players = config.players || [];
  const fraudsIndices = config.fraudsIndices || [0];
  const targetWord = config.targetWord || "Chai";
  const bluffWord = config.bluffWord || "Coffee";
  const categoryName = config.categoryName || "General";
  const currentRound = config.currentRound || 1;
  const totalRounds = config.rounds || 5;
  const scores = config.scores || {};
  const isFraud = fraudsIndices.includes(currentPlayer);
  const playerAccent = PLAYER_ACCENTS[currentPlayer % PLAYER_ACCENTS.length];

  const generateCandidates = (currentConfig: MatchConfig) => {
    const packsToUse: { id: string; title: string; words: string[] }[] = [];
    currentConfig.selectedPacks.forEach((packId) => {
      const builtIn = PACKS.find((p) => p.id === packId);
      if (builtIn) {
        packsToUse.push({ id: builtIn.id, title: builtIn.name, words: builtIn.words });
      } else {
        const custom = customPacks.find((p) => p.id === packId);
        if (custom) {
          packsToUse.push({ id: custom.id, title: custom.title, words: custom.words });
        }
      }
    });

    if (packsToUse.length === 0) return [];
    const candidates: { target: string; bluff: string; category: string }[] = [];
    const used = currentConfig.usedWords || [];

    for (let c = 0; c < 3; c++) {
      const pack = packsToUse[c % packsToUse.length];
      const available = pack.words.filter(
        (w) => !used.includes(w) && !candidates.some((cand) => cand.target === w),
      );
      const target = (available.length > 0 ? available : pack.words)[
        Math.floor(Math.random() * (available.length || pack.words.length))
      ];
      const otherWords = PACKS[0].words.filter((w) => w !== target);
      const bluff = otherWords[Math.floor(Math.random() * otherWords.length)] || "Coffee";
      candidates.push({ target, bluff, category: pack.title });
    }
    return candidates;
  };

  const handleNextPlayerOrDiscussion = () => {
    buzz(25);
    if (autoHideRef.current) clearInterval(autoHideRef.current);

    if (currentPlayer + 1 < players.length) {
      playPassTurnSound();
      setCurrentPlayer(currentPlayer + 1);
      setPhase("pass");
      setIsRevealed(false);
      setAutoRevealTimer(3);
    } else {
      const starterIdx = Math.floor(Math.random() * players.length);
      setDiscussionStarter(starterIdx);
      setPhase("discussion");
      playDiscussionStartSound();
      setSecondsLeft(config.timerSeconds > 0 ? config.timerSeconds : 30);
      setTimerActive(config.timerSeconds > 0);
      setOvertimeUsed(false);
    }
  };

  const startVotingPhase = () => {
    buzz(30);
    setTimerActive(false);
    setPhase("voting");
    if (config.votingMode === "secret") {
      setSecretVoteCurrentPlayer(0);
      setSecretVotes({});
      setSecretVotePhase("pass");
    } else {
      setVotingCountdown(3);
    }
  };

  const handleOvertime = () => {
    if (overtimeUsed) return;
    buzz([30, 20]);
    setSecondsLeft((s) => s + 15);
    setOvertimeUsed(true);
    setTimerActive(true);
  };

  const triggerDramaticReveal = (accusedIdx: number) => {
    buzz([40, 20, 60]);
    playVoteConfirmSound();
    setVotedPlayerIndex(accusedIdx);
    setPhase("suspense");
    setSuspenseStep("tally");
    playSuspenseHeartbeatSound();

    if (!config) return;
    const isVotedFraud = fraudsIndices.includes(accusedIdx);
    setBroWon(isVotedFraud);

    const roasts = isVotedFraud ? ROASTS_WIN : ROASTS_LOSE;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    setRoastCopy(roast);

    const changes: Record<string, number> = {};
    const updatedScores = { ...scores };
    const fraudEscapes = { ...(config.fraudEscapes || {}) };
    const innocentAccusations = { ...(config.innocentAccusations || {}) };

    players.forEach((p, idx) => {
      const isPlayerFraud = fraudsIndices.includes(idx);
      if (isVotedFraud) {
        changes[p.name] = isPlayerFraud ? 0 : 100;
      } else {
        changes[p.name] = isPlayerFraud ? 150 : 0;
        if (isPlayerFraud) {
          fraudEscapes[p.name] = (fraudEscapes[p.name] || 0) + 1;
        }
      }
      if (!isPlayerFraud && idx === accusedIdx) {
        innocentAccusations[p.name] = (innocentAccusations[p.name] || 0) + 1;
      }
      updatedScores[p.name] = (updatedScores[p.name] || 0) + (changes[p.name] || 0);
    });

    setScoreChanges(changes);
    const updatedConfig: MatchConfig = {
      ...config,
      scores: updatedScores,
      fraudEscapes,
      innocentAccusations,
    };
    setConfig(updatedConfig);
    sessionStorage.setItem("bof_match_config", JSON.stringify(updatedConfig));

    const cands = generateCandidates(updatedConfig);
    setWordCandidates(cands);
    if (cands.length > 0) setSelectedCandidateIdx(0);

    clearSuspenseTimer();
    suspenseTimerRef.current = setTimeout(() => {
      stepToAccused();
    }, 1400);
  };

  const handleNextRound = () => {
    buzz(30);
    let nextCategory = categoryName;
    let nextTarget = "Chai";
    let nextBluff = "Coffee";

    if (selectedCandidateIdx === "replay") {
      nextTarget = targetWord;
      nextBluff = bluffWord;
    } else if (selectedCandidateIdx === "custom") {
      nextCategory = "Custom Choice";
      nextTarget = customTargetWord.trim() || "Chai";
      nextBluff = customBluffWord.trim() || "Coffee";
    } else {
      const cand = wordCandidates[selectedCandidateIdx as number];
      if (cand) {
        nextCategory = cand.category;
        nextTarget = cand.target;
        nextBluff = cand.bluff;
      }
    }

    const nextFrauds = [Math.floor(Math.random() * players.length)];
    const newConfig: MatchConfig = {
      ...config,
      categoryName: nextCategory,
      targetWord: nextTarget,
      bluffWord: nextBluff,
      fraudsIndices: nextFrauds,
      currentRound: currentRound + 1,
      usedWords: [...(config.usedWords || []), nextTarget],
    };

    setConfig(newConfig);
    sessionStorage.setItem("bof_match_config", JSON.stringify(newConfig));
    setPhase("pass");
    setCurrentPlayer(0);
    setIsRevealed(false);
    setTimerActive(false);
    setDiscussionStarter(null);
  };

  const handlePlayAgainSamePlayers = () => {
    buzz([30, 20, 40]);
    const resetScores = players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {});
    const cands = generateCandidates(config);
    const firstCand = cands[0] || { target: "Chai", bluff: "Coffee", category: "College Life" };
    const nextFrauds = [Math.floor(Math.random() * players.length)];

    const restartedConfig: MatchConfig = {
      ...config,
      currentRound: 1,
      targetWord: firstCand.target,
      bluffWord: firstCand.bluff,
      categoryName: firstCand.category,
      fraudsIndices: nextFrauds,
      scores: resetScores,
      usedWords: [firstCand.target],
      fraudEscapes: {},
      innocentAccusations: {},
    };

    setConfig(restartedConfig);
    sessionStorage.setItem("bof_match_config", JSON.stringify(restartedConfig));
    setPhase("pass");
    setCurrentPlayer(0);
    setIsRevealed(false);
  };

  const handleShareResults = async () => {
    setSharing(true);
    buzz(30);
    try {
      const highestScorePlayer = [...players].sort(
        (a, b) => (scores[b.name] || 0) - (scores[a.name] || 0),
      )[0];
      const blob = await renderShareCard({
        title: broWon ? "Bros Exposed the Fraud!" : "Fraud Escaped Clean!",
        subtitle: `Match Result · Round ${currentRound} of ${totalRounds}`,
        fraudName: fraudsIndices.map((i) => players[i]?.name).join(", "),
        fraudEmoji: "User",
        word: targetWord,
        roast: roastCopy,
        scores: players.map((p) => ({
          name: p.name,
          points: scores[p.name] || 0,
          emoji: p.emoji,
        })),
      });
      await shareCard(
        blob,
        `Bro or Fraud match result! ${highestScorePlayer.name} is on top`,
        "native",
      );
      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setSharing(false);
    }
  };

  const timerPct = config.timerSeconds > 0 ? (secondsLeft / config.timerSeconds) * 100 : 100;

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand-gold)]/20">
      {/* UNIFORM FRAME: TOP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--separator)]">
        <Link
          to="/play/setup"
          onClick={() => {
            buzz(15);
            localStorage.removeItem("bof_active_session_v1");
          }}
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--chip)] transition-colors"
        >
          End game
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">
            <span className="text-[var(--gold-text)]">Bro</span> or{" "}
            <span className="text-[var(--pink-text)]">Fraud?</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)] tabular-nums">
            R{currentRound}/{totalRounds}
          </span>
        </div>

        {phase !== "pass" && phase !== "reveal" && phase !== "suspense" && phase !== "game_over" ? (
          <button
            type="button"
            onClick={() => {
              buzz(15);
              setShowPeekModal(true);
              setPeekPlayerIdx(null);
              setPeekHeld(false);
            }}
            className="flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip)]/80 border border-[var(--separator)] transition-colors cursor-pointer"
          >
            <Eye className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
            <span>Peek</span>
          </button>
        ) : (
          <div className="w-11" />
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* PHASE 1: PASS THE PHONE (SECURE HANDOFF) */}
        {phase === "pass" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)]">
                <Lock className="size-3 text-[var(--brand-pink)]" strokeWidth={1.5} />
                Private Screen
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Pass the phone
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Hand the phone directly to the next player.
              </p>
            </div>

            {/* Recipient Card */}
            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center"
              style={{
                boxShadow: `0 0 24px -6px ${playerAccent.glow}`,
              }}
            >
              <div
                className="size-20 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center mb-3"
                style={{ color: playerAccent.color }}
              >
                {renderAvatar(players[currentPlayer].emoji, "size-10 text-current")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
                {players[currentPlayer].name}
              </h2>
              <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[28ch]">
                Keep the screen shielded from curious friends.
              </p>
            </div>

            {/* Unlock Action: Hold or Tap */}
            <div className="w-full space-y-2 pt-4">
              {config.revealStyle === "tap" ? (
                <button
                  type="button"
                  onClick={() => {
                    buzz(25);
                    setPhase("reveal");
                    setIsRevealed(true);
                    playRoleRevealSound();
                  }}
                  className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>I'm {players[currentPlayer].name} (Tap)</span>
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onPointerDown={() => {
                    setHeld(true);
                    buzz(15);
                  }}
                  onPointerUp={() => setHeld(false)}
                  onPointerLeave={() => setHeld(false)}
                  onPointerCancel={() => setHeld(false)}
                  className="relative w-full min-h-[52px] overflow-hidden rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text)] border border-[var(--separator)] font-bold text-base touch-none select-none active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--brand-gold)]/25 transition-all duration-75 pointer-events-none"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                  <Fingerprint className="size-5 text-[var(--gold-text)]" strokeWidth={1.5} />
                  <span className="relative z-10">
                    {held
                      ? "Unlocking role..."
                      : `I am ${players[currentPlayer].name} (Hold to Reveal)`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: ROLE REVEAL (HOLD-TO-PEEK ROLE CARD) */}
        {phase === "reveal" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-semibold">{players[currentPlayer].name}'s secret</span>
              {isRevealed && (
                <span className="flex items-center gap-1 text-[var(--pink-text)] font-semibold tabular-nums">
                  <Clock className="size-3.5" strokeWidth={1.5} /> {autoHideCountdown}s
                </span>
              )}
            </div>

            {/* Revealed Card with Split Logo & Pop-in */}
            <div className="my-auto w-full">
              {isRevealed ? (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`w-full rounded-[var(--radius-card)] p-6 bg-[var(--card)] border ${
                    isFraud
                      ? "border-[var(--brand-pink)]/50 shadow-[0_0_30px_rgba(240,80,138,0.2)]"
                      : "border-[var(--brand-gold)]/50 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                  } flex flex-col items-center space-y-4`}
                >
                  {/* Badge & Half-logo */}
                  <div className="flex items-center justify-between w-full">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)]">
                      {categoryName}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isFraud
                          ? "bg-[var(--brand-pink)]/20 text-[var(--pink-text)] border border-[var(--brand-pink)]/30"
                          : "bg-[var(--brand-gold)]/20 text-[var(--gold-text)] border border-[var(--brand-gold)]/30"
                      }`}
                    >
                      {isFraud ? "Bluff Word" : "Secret Word"}
                    </span>
                  </div>

                  {/* Half-logo icon: Smiley for Bro, Spy for Fraud */}
                  <div className="size-24 rounded-full overflow-hidden flex items-center justify-center p-1 bg-[var(--chip)]/50 border border-[var(--separator)]">
                    <img
                      src={isFraud ? "/logo-fraud.webp" : "/logo-bro.webp"}
                      alt={isFraud ? "Fraud Spy" : "Bro Smiley"}
                      className="size-20 object-contain drop-shadow"
                      width={80}
                      height={80}
                    />
                  </div>

                  {/* The Word */}
                  <div className="w-full py-5 px-3 rounded-[var(--radius-group)] bg-[var(--bg)] border border-[var(--separator)]">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                      {isFraud ? "Decoy" : "Target"}
                    </span>
                    <span
                      className={`text-3xl sm:text-4xl font-bold tracking-tight uppercase select-none ${
                        isFraud ? "text-[var(--pink-text)]" : "text-[var(--gold-text)]"
                      }`}
                    >
                      {isFraud ? bluffWord : targetWord}
                    </span>
                  </div>

                  {/* Role explanation */}
                  <div
                    className={`w-full p-3 rounded-[var(--radius-group)] border flex items-center justify-between text-xs font-semibold ${
                      isFraud
                        ? "bg-[var(--brand-pink)]/10 border-[var(--brand-pink)]/30 text-[var(--pink-text)]"
                        : "bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/30 text-[var(--gold-text)]"
                    }`}
                  >
                    <span className="text-[var(--text-secondary)]">Your Role</span>
                    <span className="flex items-center gap-1.5 font-bold">
                      {isFraud ? (
                        <>
                          <ShieldAlert className="size-4" strokeWidth={1.5} />
                          <span>Fraud (Blend In)</span>
                        </>
                      ) : (
                        <>
                          <User className="size-4" strokeWidth={1.5} />
                          <span>Bro (Catch Fraud)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Auto-hide progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-[var(--chip)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isFraud ? "bg-[var(--brand-pink)]" : "bg-[var(--brand-gold)]"
                      }`}
                      style={{ width: `${(autoHideCountdown / 7) * 100}%` }}
                    />
                  </div>
                </motion.div>
              ) : (
                <div className="w-full rounded-[var(--radius-card)] p-8 bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center space-y-3">
                  <div className="size-16 rounded-full bg-[var(--chip)] grid place-items-center">
                    <EyeOff className="size-7 text-[var(--text-secondary)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">Word is shielded</h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-[26ch]">
                    Tap below to peek again, or pass the phone onward.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      buzz(15);
                      setIsRevealed(true);
                    }}
                    className="mt-2 min-h-[44px] px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 border border-[var(--separator)] transition-colors cursor-pointer"
                  >
                    Show Word Again
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="w-full space-y-2 pt-4">
              {isRevealed && (
                <button
                  type="button"
                  onClick={() => {
                    buzz(15);
                    setIsRevealed(false);
                  }}
                  className="w-full min-h-[46px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Hide Word
                </button>
              )}
              <button
                type="button"
                onClick={handleNextPlayerOrDiscussion}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {currentPlayer + 1 < players.length ? "Got it, Pass to Next" : "Start Discussion"}
                </span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: DISCUSSION & TIMER */}
        {phase === "discussion" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                <Flame className="size-3 text-[var(--gold-text)]" strokeWidth={1.5} />
                Interrogation
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Drop your clues
              </h1>
              <p className="text-xs text-[var(--text-secondary)] max-w-[32ch] mx-auto">
                Give one-word hints about the secret word. Find who is bluffing.
              </p>
            </div>

            <div className="my-auto w-full space-y-4">
              {/* First Speaker spotlight */}
              {discussionStarter !== null && (
                <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    First up:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
                    {renderAvatar(
                      players[discussionStarter].emoji,
                      "size-4 text-[var(--gold-text)]",
                    )}
                    <span>{players[discussionStarter].name}</span>
                  </div>
                </div>
              )}

              {/* Big Tabular Countdown Timer */}
              {config.timerSeconds > 0 && (
                <div
                  className="w-full rounded-[var(--radius-card)] p-6 bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center"
                  style={{
                    boxShadow: "0 0 24px -6px rgba(251, 191, 36, 0.2)",
                  }}
                >
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Time Remaining
                  </span>
                  <div
                    role="timer"
                    aria-live="polite"
                    className={`font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-tight ${
                      secondsLeft <= 5
                        ? "text-[var(--pink-text)] animate-pulse"
                        : "text-[var(--text)]"
                    }`}
                  >
                    0:{secondsLeft.toString().padStart(2, "0")}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[var(--chip)] overflow-hidden mt-4">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${
                        secondsLeft <= 5 ? "bg-[var(--brand-pink)]" : "bg-[var(--brand-gold)]"
                      }`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-between w-full gap-2 mt-4 pt-3 border-t border-[var(--separator)]">
                    <button
                      type="button"
                      onClick={() => {
                        buzz(15);
                        setTimerActive((a) => !a);
                      }}
                      className="min-h-[44px] px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {timerActive ? (
                        <>
                          <Pause className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                          <span>Resume</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={overtimeUsed}
                      onClick={handleOvertime}
                      className="min-h-[44px] px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      +15s Overtime
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={startVotingPhase}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Vote className="size-5" strokeWidth={1.5} />
                <span>Vote the Fraud</span>
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: VOTING (SECRET BALLOT OR POINTING) */}
        {phase === "voting" && config.votingMode === "secret" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            {secretVotePhase === "pass" ? (
              <div className="flex flex-1 flex-col justify-between text-center py-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--pink-text)] border border-[var(--separator)]">
                    <Vote className="size-3 text-[var(--pink-text)]" strokeWidth={1.5} />
                    Confidential Ballot
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                    Pass phone to voter
                  </h1>
                </div>

                <div className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center">
                  <div className="size-20 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center mb-3 text-[var(--gold-text)]">
                    {renderAvatar(players[secretVoteCurrentPlayer].emoji, "size-10 text-current")}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
                    {players[secretVoteCurrentPlayer].name}
                  </h2>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Cast your private vote without showing anyone.
                  </p>
                </div>

                <div className="w-full pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      buzz(20);
                      setSecretVotePhase("vote");
                    }}
                    className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>I'm {players[secretVoteCurrentPlayer].name} · Vote</span>
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1">
                    <span>Secret Ballot</span>
                    <span>
                      Voter:{" "}
                      <strong className="text-[var(--text)]">
                        {players[secretVoteCurrentPlayer].name}
                      </strong>
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                    Who is the <span className="text-[var(--pink-text)]">Fraud?</span>
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Select the player you believe was bluffing.
                  </p>
                </div>

                <div className="my-auto space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
                  {players
                    .map((p, idx) => ({ p, idx }))
                    .filter(({ idx }) => idx !== secretVoteCurrentPlayer)
                    .map(({ p, idx }) => {
                      const selected = pendingSuspectVote === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            buzz(20);
                            setPendingSuspectVote(idx);
                          }}
                          className={`w-full min-h-[56px] rounded-[var(--radius-group)] p-3 text-left flex items-center justify-between transition-all cursor-pointer border ${
                            selected
                              ? "bg-[var(--card)] border-[var(--brand-pink)] shadow-[0_0_16px_rgba(240,80,138,0.2)]"
                              : "bg-[var(--card)] border-[var(--separator)] hover:bg-[var(--chip)]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-[0.75rem] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center text-[var(--pink-text)]">
                              {renderAvatar(p.emoji, "size-5 text-current")}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--text)]">{p.name}</div>
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                Suspect
                              </span>
                            </div>
                          </div>
                          <div
                            className={`size-6 rounded-full border flex items-center justify-center ${
                              selected
                                ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white"
                                : "border-[var(--separator)]"
                            }`}
                          >
                            {selected && <Check className="size-3.5 stroke-[2.5]" />}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="w-full pt-4">
                  <button
                    type="button"
                    disabled={pendingSuspectVote === null}
                    onClick={() => {
                      if (pendingSuspectVote === null) return;
                      const nextVotes = {
                        ...secretVotes,
                        [secretVoteCurrentPlayer]: pendingSuspectVote,
                      };
                      setSecretVotes(nextVotes);
                      setPendingSuspectVote(null);

                      if (secretVoteCurrentPlayer + 1 < players.length) {
                        setSecretVoteCurrentPlayer((curr) => curr + 1);
                        setSecretVotePhase("pass");
                      } else {
                        const tallies: Record<number, number> = {};
                        players.forEach((_, i) => {
                          tallies[i] = 0;
                        });
                        Object.values(nextVotes).forEach((susIdx) => {
                          tallies[susIdx] = (tallies[susIdx] || 0) + 1;
                        });
                        let maxIdx = 0;
                        let maxCount = -1;
                        Object.entries(tallies).forEach(([i, c]) => {
                          if (c > maxCount) {
                            maxCount = c;
                            maxIdx = Number(i);
                          }
                        });
                        triggerDramaticReveal(maxIdx);
                      }
                    }}
                    className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      Vote for{" "}
                      {pendingSuspectVote !== null ? players[pendingSuspectVote].name : "Suspect"}
                    </span>
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4 (ALTERNATIVE): PHYSICAL POINTING */}
        {phase === "voting" && config.votingMode !== "secret" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            {votingCountdown !== null ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center my-auto py-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                  Physical Pointing
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                  Ready to point
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-[28ch]">
                  On ZERO, everyone simultaneously points at their primary suspect!
                </p>

                <div className="my-8 size-44 rounded-full border-2 border-[var(--brand-gold)]/40 bg-[var(--card)] flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  <motion.div
                    key={votingCountdown}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-mono text-7xl font-bold text-[var(--gold-text)] tabular-nums"
                  >
                    {votingCountdown === 0 ? "POINT!" : votingCountdown}
                  </motion.div>
                </div>

                <button
                  type="button"
                  onClick={() => setVotingCountdown(null)}
                  className="min-h-[44px] px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  Skip countdown
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                    Vote Tallies
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                    Count the fingers
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter the count of votes each person received.
                  </p>
                </div>

                <div className="my-auto space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const count = voteTallies[idx] || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-[var(--radius-group)] bg-[var(--card)] p-3 border border-[var(--separator)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-[0.75rem] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center text-[var(--gold-text)]">
                            {renderAvatar(p.emoji, "size-5 text-current")}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--text)]">{p.name}</div>
                            <span className="text-[10px] text-[var(--text-secondary)] tabular-nums">
                              {count} {count === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              buzz(10);
                              setVoteTallies((prev) => ({
                                ...prev,
                                [idx]: Math.max(0, (prev[idx] || 0) - 1),
                              }));
                            }}
                            className="size-9 rounded-[0.75rem] bg-[var(--chip)] text-base font-bold text-[var(--text)] border border-[var(--separator)] hover:bg-[var(--chip)]/80 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-lg font-mono font-bold text-[var(--gold-text)] tabular-nums">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              buzz(10);
                              setVoteTallies((prev) => ({
                                ...prev,
                                [idx]: (prev[idx] || 0) + 1,
                              }));
                            }}
                            className="size-9 rounded-[0.75rem] bg-[var(--chip)] text-base font-bold text-[var(--text)] border border-[var(--separator)] hover:bg-[var(--chip)]/80 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      let maxIdx = 0;
                      let maxCount = -1;
                      Object.entries(voteTallies).forEach(([i, c]) => {
                        if (c > maxCount) {
                          maxCount = c;
                          maxIdx = Number(i);
                        }
                      });
                      triggerDramaticReveal(maxIdx);
                    }}
                    className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Submit Votes & Reveal Verdict</span>
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 5: SUSPENSE SEQUENCE */}
        {phase === "suspense" && (
          <div
            role="button"
            tabIndex={0}
            onClick={advanceSuspenseSequence}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                advanceSuspenseSequence();
              }
            }}
            className="flex flex-1 flex-col items-center justify-center text-center my-auto py-8 cursor-pointer select-none"
            aria-label="Tap to skip suspense sequence"
          >
            {suspenseStep === "tally" && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full p-8 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] shadow-[0_0_24px_rgba(251,191,36,0.15)] space-y-3"
              >
                <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                  Tallying Votes
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                  Locking in the room...
                </h2>
              </motion.div>
            )}

            {suspenseStep === "accused" && votedPlayerIndex !== null && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full p-8 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] shadow-[0_0_30px_rgba(240,80,138,0.2)] space-y-3"
              >
                <span className="text-xs font-semibold text-[var(--pink-text)] uppercase tracking-wider">
                  The Accused Suspect
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text)]">
                  {players[votedPlayerIndex].name}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] animate-pulse">
                  Revealing true identity...
                </p>
              </motion.div>
            )}

            {suspenseStep === "verdict" && votedPlayerIndex !== null && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full p-8 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] shadow-[0_0_36px_rgba(251,191,36,0.25)] space-y-4"
              >
                <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center">
                  {broWon ? (
                    <ShieldAlert className="size-8 text-[var(--pink-text)]" strokeWidth={1.5} />
                  ) : (
                    <User className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
                  )}
                </div>
                <h1
                  className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    broWon ? "text-[var(--pink-text)]" : "text-[var(--gold-text)]"
                  }`}
                >
                  {broWon
                    ? `${players[votedPlayerIndex].name} WAS THE FRAUD!`
                    : `${players[votedPlayerIndex].name} WAS A BRO!`}
                </h1>
              </motion.div>
            )}

            <p className="mt-6 text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
              Tap anywhere to advance
            </p>
          </div>
        )}

        {/* PHASE 6: VERDICT / ROUND SCOREBOARD */}
        {phase === "verdict" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="text-center space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  broWon
                    ? "bg-[var(--brand-gold)]/20 text-[var(--gold-text)] border border-[var(--brand-gold)]/30"
                    : "bg-[var(--brand-pink)]/20 text-[var(--pink-text)] border border-[var(--brand-pink)]/30"
                }`}
              >
                {broWon ? "Bros Caught the Fraud" : "Fraud Escaped"}
              </span>

              {/* Big Score / Split Number Display */}
              <div className="py-2">
                <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-[var(--text)] tabular-nums">
                  {broWon ? "+100" : "+150"}{" "}
                  <span className="text-base font-sans text-[var(--text-secondary)]">XP</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {broWon ? "Awarded to innocent bros" : "Awarded to the fraud for escaping"}
                </div>
              </div>

              {/* Roast summary */}
              <div className="p-3 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] max-w-sm mx-auto text-xs italic text-[var(--text)]">
                "{roastCopy}"
              </div>
            </div>

            {/* Split Bar & Secret Words */}
            <div className="my-auto w-full space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-left">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                    Secret Word
                  </span>
                  <span className="text-sm font-bold text-[var(--gold-text)]">{targetWord}</span>
                </div>
                <div className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-left">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                    Actual Fraud
                  </span>
                  <span className="text-sm font-bold text-[var(--pink-text)]">
                    {fraudsIndices.map((i) => players[i]?.name).join(", ")}
                  </span>
                </div>
              </div>

              {/* Match Leaderboard */}
              <div className="rounded-[var(--radius-card)] bg-[var(--card)] p-4 border border-[var(--separator)]">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
                  Leaderboard
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const isPlayerFraud = fraudsIndices.includes(idx);
                    const delta = scoreChanges[p.name] || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-[0.75rem] bg-[var(--chip)] px-3 py-2 text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          {renderAvatar(p.emoji, "size-4 text-[var(--gold-text)]")}
                          <span className="text-[var(--text)]">{p.name}</span>
                          {isPlayerFraud && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--brand-pink)]/20 text-[var(--pink-text)] font-bold">
                              Fraud
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {delta > 0 && (
                            <span className="text-[var(--gold-text)] text-[11px] font-bold tabular-nums">
                              +{delta}
                            </span>
                          )}
                          <span className="font-mono text-[var(--text)] font-bold tabular-nums">
                            {scores[p.name] || 0} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={handleNextRound}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  Start Round {currentRound + 1} of {totalRounds}
                </span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 7: GAME OVER PODIUM */}
        {phase === "game_over" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                <Trophy className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                Match Complete
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Final Awards
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                All {totalRounds} rounds finished.
              </p>
            </div>

            {/* Awards cards */}
            <div className="my-auto space-y-2.5 w-full">
              {/* Best Liar */}
              <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center gap-3 text-left">
                <div className="size-11 rounded-[0.75rem] bg-[var(--chip)] grid place-items-center text-[var(--pink-text)] shrink-0">
                  <Drama className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[var(--pink-text)] uppercase tracking-wider block">
                    Best Liar
                  </span>
                  <div className="text-sm font-bold text-[var(--text)]">
                    {fraudsIndices.map((i) => players[i]?.name).join(", ")}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Bluffed with confidence and escaped the roast
                  </span>
                </div>
              </div>

              {/* Sharpest Detective */}
              <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center gap-3 text-left">
                <div className="size-11 rounded-[0.75rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)] shrink-0">
                  <Search className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[var(--gold-text)] uppercase tracking-wider block">
                    Sharpest Detective
                  </span>
                  <div className="text-sm font-bold text-[var(--text)]">
                    {
                      [...players].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0))[0]
                        ?.name
                    }
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Highest score across all {totalRounds} rounds
                  </span>
                </div>
              </div>

              {/* Most Sus */}
              <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center gap-3 text-left">
                <div className="size-11 rounded-[0.75rem] bg-[var(--chip)] grid place-items-center text-[var(--text-secondary)] shrink-0">
                  <HelpCircle className="size-5" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Most Sus Bro
                  </span>
                  <div className="text-sm font-bold text-[var(--text)]">
                    {players[votedPlayerIndex ?? 0]?.name}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Innocent but caught the most accusations
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={handleShareResults}
                disabled={sharing}
                className="w-full min-h-[48px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 border border-[var(--separator)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="size-4 text-[var(--gold-text)]" strokeWidth={1.5} />
                <span>{sharing ? "Rendering..." : "Share Result Card"}</span>
              </button>

              <button
                type="button"
                onClick={handlePlayAgainSamePlayers}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-4" strokeWidth={1.5} />
                <span>Play Again (Same Players)</span>
              </button>

              <Link
                to="/play/setup"
                onClick={() => {
                  buzz(15);
                  localStorage.removeItem("bof_active_session_v1");
                }}
                className="block text-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] py-2"
              >
                Change Players / Setup
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* PEEK WORD MODAL */}
      {showPeekModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowPeekModal(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-[var(--radius-card)] bg-[var(--card)] border-t border-[var(--separator)] p-5 max-h-[85dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--separator)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Peek Secret Word</h3>
                <p className="text-xs text-[var(--text-secondary)]">Check your word privately</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setShowPeekModal(false);
                }}
                className="size-8 rounded-full bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)] grid place-items-center cursor-pointer"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>

            {peekPlayerIdx === null ? (
              <div className="mt-4 space-y-2 pb-6 flex-1 overflow-y-auto">
                <p className="text-xs text-center text-[var(--text-secondary)] mb-2">
                  Select your name:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {players.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        buzz(15);
                        setPeekPlayerIdx(idx);
                      }}
                      className="flex items-center justify-center gap-2 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] px-4 py-3 text-xs font-bold text-[var(--text)] hover:border-[var(--brand-gold)] min-h-[48px] cursor-pointer"
                    >
                      {renderAvatar(p.emoji, "size-4 text-[var(--gold-text)]")}
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center text-center space-y-4 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    buzz(10);
                    setPeekPlayerIdx(null);
                    setPeekHeld(false);
                  }}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)]"
                >
                  ← Select different player
                </button>

                <div className="w-full rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--bg)] p-6 flex flex-col items-center justify-center min-h-[160px]">
                  {peekHeld ? (
                    <div className="w-full flex flex-col items-center">
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                        {fraudsIndices.includes(peekPlayerIdx) ? "Decoy Word" : "Secret Word"}
                      </span>
                      <div
                        className={`text-2xl font-bold tracking-tight uppercase py-3 px-4 w-full rounded-[0.75rem] bg-[var(--chip)] border border-[var(--separator)] mb-2 ${
                          fraudsIndices.includes(peekPlayerIdx)
                            ? "text-[var(--pink-text)]"
                            : "text-[var(--gold-text)]"
                        }`}
                      >
                        {fraudsIndices.includes(peekPlayerIdx) ? bluffWord : targetWord}
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        Role: {fraudsIndices.includes(peekPlayerIdx) ? "FRAUD" : "BRO"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Fingerprint
                        className="size-10 text-[var(--gold-text)] mb-2"
                        strokeWidth={1.5}
                      />
                      <p className="text-xs text-[var(--text-secondary)] max-w-[22ch]">
                        Press and hold below to view word
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onPointerDown={() => {
                    setPeekHeld(true);
                    buzz(20);
                  }}
                  onPointerUp={() => setPeekHeld(false)}
                  onPointerLeave={() => setPeekHeld(false)}
                  onPointerCancel={() => setPeekHeld(false)}
                  className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all touch-none select-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Eye className="size-4" strokeWidth={1.5} />
                  <span>{peekHeld ? "Release to Hide" : "Hold to Peek Word"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
