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
  Clock,
  CheckCircle2,
  AlertTriangle,
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
  // Historical stats for awards
  fraudEscapes?: Record<string, number>;
  innocentAccusations?: Record<string, number>;
}

type Phase = "pass" | "reveal" | "discussion" | "voting" | "suspense" | "verdict" | "game_over";

const PLAYER_COLORS = [
  { text: "text-lime", border: "border-lime", bg: "bg-lime/10", accent: "rgba(255,214,0,0.5)" },
  {
    text: "text-magenta",
    border: "border-magenta",
    bg: "bg-magenta/10",
    accent: "rgba(255,45,85,0.5)",
  },
  {
    text: "text-cyan-400",
    border: "border-cyan-400",
    bg: "bg-cyan-400/10",
    accent: "rgba(34,211,238,0.5)",
  },
  {
    text: "text-amber-400",
    border: "border-amber-400",
    bg: "bg-amber-400/10",
    accent: "rgba(251,191,36,0.5)",
  },
  {
    text: "text-purple-400",
    border: "border-purple-400",
    bg: "bg-purple-400/10",
    accent: "rgba(192,132,252,0.5)",
  },
  {
    text: "text-emerald-400",
    border: "border-emerald-400",
    bg: "bg-emerald-400/10",
    accent: "rgba(52,211,153,0.5)",
  },
];

const ROASTS_WIN = [
  "Bro got cooked faster than Maggi in a hostel kettle 💀",
  "Bros saw right through your bluff, clean your glasses next time 🤓",
  "You lied worse than a student claiming they read the syllabus 📚",
  "Fraud got caught red-handed. Go back to acting school 🎭",
  "Bro was shaking while bluffing. Rizz level: -100 📉",
];

const ROASTS_LOSE = [
  "Fraud escaped. Bros got played worse than a proxy attendance scam 🕵️",
  "The Fraud was literally right there and you voted for a Bro. Brain cells: 0 🧠",
  "Bro got gaslit into thinking they were clean. Rizz Master at work 👑",
  "The Fraud is laughing all the way back to their hostel room 🏃‍♂️",
  "Bros are certified clowns. You got absolutely cooked 🤡",
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

  // Next round candidate choices
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);
  const [wordCandidates, setWordCandidates] = useState<
    { target: string; bluff: string; category: string }[]
  >([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number | "custom" | "replay">(0);
  const [customTargetWord, setCustomTargetWord] = useState("");
  const [customBluffWord, setCustomBluffWord] = useState("");
  const [showCustomWordModal, setShowCustomWordModal] = useState(false);

  // Peek word modal
  const [showPeekModal, setShowPeekModal] = useState(false);
  const [peekPlayerIdx, setPeekPlayerIdx] = useState<number | null>(null);
  const [peekHeld, setPeekHeld] = useState(false);

  // Share card preview
  const [sharing, setSharing] = useState(false);

  // 1. Screen Wake Lock API integration
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

  // 2. Load Config from sessionStorage & persist in localStorage
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

      // Check for saved in-progress state to restore if refreshed
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

  // 3. Save in-progress state
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

  // 4. Hold to reveal circular progress animation (Phase 1 & 2)
  useEffect(() => {
    if (!held) {
      setHoldProgress(0);
      return;
    }
    const start = Date.now();
    const duration = 500; // 0.5s hold time
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

  // 5. Auto-reveal style timer countdown (when revealStyle === 'auto')
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

  // 6. Auto-hide timer for secret word protection
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

  // 7. Discussion countdown timer
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

  // 8. Physical pointing countdown
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
      <div className="min-h-dvh bg-void grid place-items-center">
        <div className="text-center font-black uppercase text-lime tracking-widest">
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
  const playerColor = PLAYER_COLORS[currentPlayer % PLAYER_COLORS.length];

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

  // Submit and start Dramatic Suspense Sequence
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

    // Update scores and awards immediately
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
        fraudEmoji: "🦊",
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
        `Bro or Fraud match result! ${highestScorePlayer.name} is on top 🔥`,
        "native",
      );
      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setSharing(false);
    }
  };

  // Timer Color logic (Green -> Yellow -> Red)
  const timerPct = config.timerSeconds > 0 ? (secondsLeft / config.timerSeconds) * 100 : 100;
  const timerColor =
    timerPct > 50
      ? "text-lime bg-lime"
      : timerPct > 20
        ? "text-yellow-400 bg-yellow-400"
        : "text-magenta bg-magenta";

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-8">
        {/* Navigation & Match Header */}
        <header className="flex items-center justify-between">
          <Link
            to="/play/setup"
            onClick={() => {
              buzz(15);
              localStorage.removeItem("bof_active_session_v1");
            }}
            className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white flex items-center gap-1 min-h-[44px] px-1"
          >
            ← Quit
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-black bg-surface text-[10px] font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0_0_#000]">
            <span className="text-lime font-black">Round {currentRound}</span> of {totalRounds}
          </div>
          {phase !== "pass" &&
            phase !== "reveal" &&
            phase !== "suspense" &&
            phase !== "game_over" && (
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setShowPeekModal(true);
                  setPeekPlayerIdx(null);
                  setPeekHeld(false);
                }}
                className="rounded-xl border-2 border-black bg-surface px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-lime shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:border-lime transition-all min-h-[36px] cursor-pointer"
              >
                👀 Peek Word
              </button>
            )}
        </header>

        {/* PHASE 1: FULL-SCREEN HANDOFF */}
        {phase === "pass" && (
          <div className="flex flex-1 flex-col items-center justify-between text-center pt-8 pb-4 animate-[fade-in_0.2s_ease-out_both]">
            <span className="sticker-badge bg-magenta text-white rotate-[-1deg] text-[10px] animate-pulse">
              🛡️ SECURE HANDOFF
            </span>

            <div className="w-full my-auto flex flex-col items-center">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                Pass Phone Directly To
              </span>
              <div
                className={`mt-4 w-full p-6 rounded-3xl border-3 border-black ${playerColor.bg} flex flex-col items-center shadow-[6px_6px_0_0_#000]`}
              >
                <div className="size-22 rounded-2xl bg-void border-2.5 border-black grid place-items-center mb-3 shadow-[3px_3px_0_0_#000]">
                  {renderAvatar(players[currentPlayer].emoji, `size-11 ${playerColor.text}`)}
                </div>
                <h1
                  className={`text-4xl sm:text-5xl font-black uppercase tracking-tight font-display ${playerColor.text}`}
                  style={{ textShadow: "3px 3px 0 #000" }}
                >
                  {players[currentPlayer].name}
                </h1>
                <p className="mt-2 text-xs font-bold text-muted-foreground/90 max-w-[26ch] uppercase tracking-wide">
                  Keep screen shielded from curious bros! 🤫
                </p>
              </div>
            </div>

            {/* Hold to reveal barrier */}
            <div className="w-full space-y-3">
              {config.revealStyle === "tap" ? (
                <button
                  type="button"
                  onClick={() => {
                    buzz(25);
                    setPhase("reveal");
                    setIsRevealed(true);
                    playRoleRevealSound();
                  }}
                  className="w-full rounded-2xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-3 border-black shadow-[5px_5px_0_0_var(--color-magenta)] hover:shadow-[7px_7px_0_0_var(--color-magenta)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none min-h-[58px] transition-all cursor-pointer"
                >
                  I'm {players[currentPlayer].name} (Tap) →
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
                  className="relative w-full overflow-hidden rounded-2xl border-3 border-black bg-surface px-6 py-5 text-base font-black uppercase tracking-wide text-foreground min-h-[58px] touch-none select-none shadow-[4px_4px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {/* Progress fill */}
                  <div
                    className="absolute inset-y-0 left-0 bg-lime/30 transition-all duration-75"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Fingerprint className="size-6 text-lime animate-pulse" />
                    <span>
                      {held
                        ? "Verifying Fingerprint…"
                        : `I am ${players[currentPlayer].name} (Hold to Unlock)`}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: ROLE REVEAL WITH AUTO-HIDE & PROGRESS RING */}
        {phase === "reveal" && (
          <div className="flex flex-1 flex-col items-center justify-between text-center pt-6 pb-2 animate-[fade-in_0.2s_ease-out_both]">
            <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>{players[currentPlayer].name}'s Secret</span>
              {isRevealed && (
                <span className="text-magenta flex items-center gap-1">
                  <Clock className="size-3" /> Auto-hiding in {autoHideCountdown}s
                </span>
              )}
            </div>

            <div className="w-full my-auto flex flex-col items-center">
              {isRevealed ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-full rounded-3xl border-3 border-black p-6 bg-surface shadow-[6px_6px_0_0_#000]`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="sticker-badge bg-black text-white text-[9px]">
                      {categoryName}
                    </span>
                    <span
                      className={`sticker-badge ${isFraud ? "bg-magenta text-white" : "bg-lime text-void"}`}
                    >
                      {isFraud ? "⚠️ BLUFF WORD" : "🤫 SECRET WORD"}
                    </span>
                  </div>

                  <div
                    className={`py-7 px-4 rounded-2xl bg-void border-2.5 border-black text-3xl sm:text-4xl font-black font-mono tracking-widest uppercase select-none shadow-[4px_4px_0_0_#000] ${
                      isFraud
                        ? "text-magenta drop-shadow-[0_0_12px_rgba(255,45,85,0.6)]"
                        : "text-lime drop-shadow-[0_0_12px_rgba(255,214,0,0.6)]"
                    }`}
                  >
                    {isFraud ? bluffWord : targetWord}
                  </div>

                  <div
                    className={`mt-4 rounded-xl p-3 border-2 border-black flex items-center justify-between shadow-[2px_2px_0_0_#000] ${
                      isFraud ? "bg-magenta/20 text-magenta" : "bg-lime/20 text-lime"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                      YOUR ROLE:
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                      {isFraud ? <ShieldAlert className="size-4" /> : <User className="size-4" />}
                      {isFraud ? "FRAUD (BLUFF THE BROS)" : "BRO (CATCH THE FRAUD)"}
                    </span>
                  </div>

                  {/* Auto-hide countdown progress bar */}
                  <div className="mt-4 h-2 w-full bg-void rounded-full overflow-hidden border-2 border-black">
                    <div
                      className={`h-full transition-all duration-1000 ${isFraud ? "bg-magenta" : "bg-lime"}`}
                      style={{ width: `${(autoHideCountdown / 7) * 100}%` }}
                    />
                  </div>
                </motion.div>
              ) : (
                <div className="w-full rounded-3xl border-3 border-black bg-surface p-8 flex flex-col items-center shadow-[6px_6px_0_0_#000]">
                  <Fingerprint className="size-16 text-muted-foreground/40 animate-pulse mb-3" />
                  <span className="text-sm font-black uppercase tracking-wide text-foreground">
                    Word is Hidden
                  </span>
                  <p className="mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Tap below to peek again, or pass the phone.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      buzz(15);
                      setIsRevealed(true);
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl border-2 border-black bg-void text-xs font-black uppercase text-lime shadow-[3px_3px_0_0_#000] hover:border-lime transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    Re-Show Word 👁️
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions: Quick Hide + Next Player */}
            <div className="w-full space-y-2.5">
              {isRevealed && (
                <button
                  type="button"
                  onClick={() => {
                    buzz(15);
                    setIsRevealed(false);
                  }}
                  className="w-full rounded-xl border-2 border-black bg-surface px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all min-h-[46px] cursor-pointer"
                >
                  🙈 Hide Word Now
                </button>
              )}
              <button
                type="button"
                onClick={handleNextPlayerOrDiscussion}
                className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] hover:shadow-[6px_6px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all min-h-[54px] cursor-pointer"
              >
                {currentPlayer + 1 < players.length
                  ? "Got It · Pass to Next Bro →"
                  : "Start Discussion 💬 →"}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: DISCUSSION & DYNAMIC TIMER */}
        {phase === "discussion" && (
          <div className="flex flex-1 flex-col items-center justify-between text-center pt-6 pb-2 animate-[fade-in_0.2s_ease-out_both]">
            <span className="sticker-badge bg-lime text-void rotate-[-1deg] text-[10px] animate-pulse">
              🔥 INTERROGATION PHASE
            </span>

            <div className="w-full my-auto flex flex-col items-center">
              <h1 className="text-3xl sm:text-4xl font-black uppercase leading-[0.95] text-foreground select-none">
                Let the{" "}
                <span className="text-magenta" style={{ textShadow: "3px 3px 0 #000" }}>
                  Roasting
                </span>{" "}
                Begin!
              </h1>
              <p className="mt-2 text-xs font-bold text-muted-foreground max-w-[28ch] uppercase tracking-wider">
                Take turns dropping 1-word or subtle hints. Detect who is bluffing.
              </p>

              {/* Discussion Starter spotlight */}
              {discussionStarter !== null && (
                <div className="mt-5 w-full rounded-2xl border-2.5 border-black bg-magenta/20 p-3.5 shadow-[4px_4px_0_0_#000]">
                  <span className="sticker-badge bg-black text-magenta text-[9px] mb-1">
                    📢 FIRST SPEAKER
                  </span>
                  <div className="mt-1 text-base font-black uppercase text-foreground flex items-center justify-center gap-2">
                    {renderAvatar(players[discussionStarter].emoji, "size-5 text-magenta")}
                    <span>{players[discussionStarter].name} starts first!</span>
                  </div>
                </div>
              )}

              {/* Dynamic Color-Shifting Discussion Timer */}
              {config.timerSeconds > 0 && (
                <div className="mt-6 w-full rounded-3xl border-3 border-black bg-surface p-5 shadow-[5px_5px_0_0_#000]">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Discussion Clock
                    </span>
                    <span
                      className={`font-display text-4xl sm:text-5xl font-black tabular-nums transition-colors drop-shadow-[2px_2px_0_#000] ${
                        secondsLeft <= 5
                          ? "text-magenta animate-pulse scale-105"
                          : timerColor.split(" ")[0]
                      }`}
                    >
                      0:{secondsLeft.toString().padStart(2, "0")}
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-void border-2 border-black overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear ${timerColor.split(" ")[1]}`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>

                  {/* Timer Controls: Pause & Overtime */}
                  <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t-2 border-black/40">
                    <button
                      type="button"
                      onClick={() => {
                        buzz(15);
                        setTimerActive((a) => !a);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-void text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                    >
                      {timerActive ? (
                        <Pause className="size-3.5 text-yellow-400" />
                      ) : (
                        <Play className="size-3.5 text-lime" />
                      )}
                      <span>{timerActive ? "Pause" : "Resume"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={overtimeUsed}
                      onClick={handleOvertime}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-black bg-void text-xs font-black uppercase tracking-wider text-lime shadow-[2px_2px_0_0_#000] hover:border-lime active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-30 transition-all cursor-pointer"
                    >
                      <span>+15s Overtime</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={startVotingPhase}
              className="w-full rounded-2xl bg-magenta px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-white border-3 border-black shadow-[4px_4px_0_0_var(--color-lime)] hover:shadow-[6px_6px_0_0_var(--color-lime)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[54px] transition-all cursor-pointer"
            >
              Vote the Fraud Now 🗳️ →
            </button>
          </div>
        )}

        {/* PHASE 4: VOTING (Secret Ballot or Pointing) */}
        {phase === "voting" && config.votingMode === "secret" && (
          <div className="flex flex-1 flex-col justify-between pt-6 pb-2 animate-[fade-in_0.2s_ease-out_both]">
            {secretVotePhase === "pass" ? (
              <div className="flex flex-1 flex-col items-center justify-between text-center my-auto py-8">
                <span className="sticker-badge bg-magenta text-white rotate-[-1deg] text-[10px] animate-pulse">
                  🗳️ SECRET BALLOT HANDOFF
                </span>

                <div className="my-auto flex flex-col items-center w-full">
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                    Pass Phone to Voter
                  </span>
                  <div className="mt-4 w-full p-6 rounded-3xl border-3 border-black bg-surface flex flex-col items-center shadow-[6px_6px_0_0_#000]">
                    <div className="size-20 rounded-2xl bg-void border-2.5 border-black grid place-items-center mb-3 shadow-[3px_3px_0_0_#000]">
                      {renderAvatar(players[secretVoteCurrentPlayer].emoji, "size-10 text-lime")}
                    </div>
                    <h2
                      className="text-3xl sm:text-4xl font-black uppercase text-foreground font-display"
                      style={{ textShadow: "2px 2px 0 #000" }}
                    >
                      {players[secretVoteCurrentPlayer].name}
                    </h2>
                    <p className="mt-2 text-xs font-bold text-muted-foreground max-w-[24ch] uppercase tracking-wide">
                      Cast your private vote without showing anyone else! 🤫
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    buzz(20);
                    setSecretVotePhase("vote");
                  }}
                  className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] hover:shadow-[6px_6px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[54px] cursor-pointer transition-all"
                >
                  I'm {players[secretVoteCurrentPlayer].name} · Cast Vote →
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between py-2 animate-[fade-in_0.2s_ease-out_both]">
                <div>
                  <span className="sticker-badge bg-magenta text-white text-[9px]">
                    CONFIDENTIAL BALLOT
                  </span>
                  <h1 className="mt-2 text-3xl font-black uppercase leading-tight text-foreground font-display">
                    Who is the{" "}
                    <span className="text-magenta" style={{ textShadow: "2px 2px 0 #000" }}>
                      Fraud?
                    </span>{" "}
                    🕵️‍♂️
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                    Voter:{" "}
                    <strong className="text-lime">{players[secretVoteCurrentPlayer].name}</strong>
                  </p>
                </div>

                {/* Candidate Tiles with Confirmation */}
                <div className="mt-4 space-y-2.5 flex-1 overflow-y-auto pr-1">
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
                          className={`w-full rounded-2xl border-2.5 border-black p-3.5 text-left flex items-center justify-between transition-all min-h-[64px] cursor-pointer shadow-[3px_3px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                            selected
                              ? "bg-magenta/20 border-magenta shadow-[4px_4px_0_0_#FF2D55]"
                              : "bg-surface hover:bg-surface/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-11 rounded-xl bg-void border-2 border-black grid place-items-center shadow-[2px_2px_0_0_#000]">
                              {renderAvatar(p.emoji, "size-6 text-magenta")}
                            </div>
                            <div>
                              <div className="text-sm font-black uppercase text-foreground">
                                {p.name}
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                Suspect
                              </span>
                            </div>
                          </div>
                          <div
                            className={`size-6 rounded-full border-2.5 border-black flex items-center justify-center transition-all ${
                              selected ? "bg-magenta text-white" : "bg-void"
                            }`}
                          >
                            {selected && <span className="text-[10px] font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="pt-3">
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
                        // Tally votes
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
                    className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 min-h-[54px] cursor-pointer transition-all"
                  >
                    Confirm Vote for{" "}
                    {pendingSuspectVote !== null ? players[pendingSuspectVote].name : "Suspect"} →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4 (Alternative): Physical Pointing Vote */}
        {phase === "voting" && config.votingMode !== "secret" && (
          <div className="flex flex-1 flex-col justify-between pt-6 pb-2 animate-[fade-in_0.2s_ease-out_both]">
            {votingCountdown !== null ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center my-auto py-12">
                <span className="sticker-badge bg-magenta text-white rotate-[-1deg] text-[10px] animate-pulse">
                  👆 PHYSICAL POINTING
                </span>
                <h2
                  className="mt-4 text-3xl font-black uppercase text-foreground font-display"
                  style={{ textShadow: "2px 2px 0 #000" }}
                >
                  Get Ready to Point!
                </h2>
                <p className="mt-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide max-w-[26ch]">
                  On ZERO, everyone points simultaneously at the suspect!
                </p>

                <div className="my-10 p-8 rounded-3xl border-3 border-black bg-surface shadow-[6px_6px_0_0_#000] w-full max-w-[240px]">
                  <motion.div
                    key={votingCountdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.15, opacity: 1 }}
                    className={`font-display text-8xl font-black drop-shadow-[4px_4px_0_#000] ${
                      votingCountdown === 0 ? "text-magenta scale-125 animate-bounce" : "text-lime"
                    }`}
                  >
                    {votingCountdown === 0 ? "POINT! 👉" : votingCountdown}
                  </motion.div>
                </div>

                <button
                  type="button"
                  onClick={() => setVotingCountdown(null)}
                  className="px-4 py-2 rounded-xl border-2 border-black bg-surface text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-white shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  Skip Countdown ⏩
                </button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between py-2">
                <div>
                  <span className="sticker-badge bg-lime text-void text-[9px]">VOTE TALLIES</span>
                  <h1 className="mt-2 text-3xl font-black uppercase leading-tight text-foreground font-display">
                    Tally the Points 📊
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Count how many fingers were pointed at each suspect.
                  </p>
                </div>

                <div className="mt-4 space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const count = voteTallies[idx] || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border-2.5 border-black bg-surface p-3.5 shadow-[3px_3px_0_0_#000]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-xl bg-void border-2 border-black grid place-items-center shadow-[2px_2px_0_0_#000]">
                            {renderAvatar(p.emoji, "size-6 text-lime")}
                          </div>
                          <div>
                            <div className="text-sm font-black uppercase text-foreground">
                              {p.name}
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
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
                            className="size-9 rounded-xl border-2 border-black bg-void text-lg font-black text-foreground shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center min-h-[36px] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xl font-mono font-black text-lime">
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
                            className="size-9 rounded-xl border-2 border-black bg-void text-lg font-black text-lime shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center min-h-[36px] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3">
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
                    className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[54px] cursor-pointer transition-all"
                  >
                    Submit Votes & Reveal Verdict →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRAMATIC SUSPENSE SEQUENCE */}
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
            className="flex flex-1 flex-col items-center justify-center text-center my-auto py-12 cursor-pointer select-none animate-[fade-in_0.2s_ease-out_both]"
            aria-label="Tap to skip suspense sequence"
          >
            {suspenseStep === "tally" && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                className="w-full p-8 rounded-3xl border-3 border-black bg-surface shadow-[6px_6px_0_0_#000]"
              >
                <span className="sticker-badge bg-black text-lime text-[10px] animate-pulse">
                  LOCKING IN VOTES...
                </span>
                <h2
                  className="mt-4 text-3xl sm:text-4xl font-black uppercase font-display text-foreground"
                  style={{ textShadow: "2px 2px 0 #000" }}
                >
                  Tallying the Suspects... 🔍
                </h2>
              </motion.div>
            )}

            {suspenseStep === "accused" && votedPlayerIndex !== null && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1.05, opacity: 1 }}
                className="w-full p-8 rounded-3xl border-3 border-black bg-surface shadow-[6px_6px_0_0_#000]"
              >
                <span className="sticker-badge bg-magenta text-white text-[10px]">
                  THE ACCUSED SUSPECT IS
                </span>
                <h1 className="mt-4 text-5xl sm:text-6xl font-black uppercase font-display text-lime drop-shadow-[3px_3px_0_#000]">
                  {players[votedPlayerIndex].name}
                </h1>
                <p className="mt-3 text-xs font-black text-muted-foreground uppercase tracking-widest animate-pulse">
                  Revealing true identity...
                </p>
              </motion.div>
            )}

            {suspenseStep === "verdict" && votedPlayerIndex !== null && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                className="w-full p-8 rounded-3xl border-3 border-black bg-surface shadow-[6px_6px_0_0_#000]"
              >
                <div className="text-7xl mb-3">{broWon ? "🚨" : "🤡"}</div>
                <h1
                  className={`text-4xl sm:text-5xl font-black uppercase font-display tracking-tight drop-shadow-[3px_3px_0_#000] ${
                    broWon ? "text-magenta" : "text-lime"
                  }`}
                >
                  {broWon
                    ? `${players[votedPlayerIndex].name} WAS THE FRAUD!`
                    : `${players[votedPlayerIndex].name} WAS A BRO!`}
                </h1>
              </motion.div>
            )}

            <p className="mt-8 text-[11px] font-black text-muted-foreground/80 uppercase tracking-widest">
              Tap anywhere to skip →
            </p>
          </div>
        )}

        {/* PHASE 5: VERDICT / ROUND SCOREBOARD */}
        {phase === "verdict" && (
          <div className="flex flex-1 flex-col justify-between pt-4 pb-2 animate-[fade-in_0.2s_ease-out_both]">
            <div className="text-center">
              <span
                className={`sticker-badge ${
                  broWon ? "bg-lime text-void" : "bg-magenta text-white"
                }`}
              >
                {broWon ? "BRO CAUGHT THE FRAUD!" : "FRAUD ESCAPED!"}
              </span>
              <h1
                className="text-4xl sm:text-5xl font-black font-display uppercase mt-2 text-foreground"
                style={{ textShadow: "3px 3px 0 #000" }}
              >
                {broWon ? "+100 XP to Bros" : "+150 XP to Fraud"}
              </h1>
              <div className="mt-3 p-3 rounded-xl border-2 border-black bg-void shadow-[3px_3px_0_0_#000] max-w-[34ch] mx-auto">
                <p className="text-xs font-bold italic text-lime">"{roastCopy}"</p>
              </div>
            </div>

            {/* Secret Summary Card */}
            <div className="mt-4 rounded-3xl border-3 border-black bg-surface p-4 shadow-[5px_5px_0_0_#000]">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b-2 border-black/50">
                <div className="rounded-xl bg-void p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                    Secret Word
                  </span>
                  <span className="text-base font-black uppercase text-lime">{targetWord}</span>
                </div>
                <div className="rounded-xl bg-void p-3 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                    Actual Fraud
                  </span>
                  <span className="text-base font-black uppercase text-magenta">
                    {fraudsIndices.map((i) => players[i]?.name).join(", ")}
                  </span>
                </div>
              </div>

              {/* Leaderboard table */}
              <div className="mt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                  Match Leaderboard
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const isPlayerFraud = fraudsIndices.includes(idx);
                    const delta = scoreChanges[p.name] || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-void px-3 py-2 border-2 border-black text-xs font-bold shadow-[2px_2px_0_0_#000]"
                      >
                        <div className="flex items-center gap-2">
                          {renderAvatar(p.emoji, "size-4 text-lime")}
                          <span className="text-foreground uppercase">{p.name}</span>
                          {isPlayerFraud && (
                            <span className="text-[8px] font-black bg-magenta text-white px-1.5 py-0.5 rounded border border-black uppercase">
                              Fraud
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {delta > 0 && (
                            <span className="text-lime text-[11px] font-black">+{delta}</span>
                          )}
                          <span className="font-mono text-foreground font-black">
                            {scores[p.name] || 0} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Next Round Controls */}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={handleNextRound}
                className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] hover:shadow-[6px_6px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[54px] cursor-pointer transition-all"
              >
                Start Round {currentRound + 1} of {totalRounds} →
              </button>
            </div>
          </div>
        )}

        {/* PHASE 6: END OF GAME & AWARDS PODIUM */}
        {phase === "game_over" && (
          <div className="flex flex-1 flex-col justify-between pt-4 pb-2 animate-[fade-in_0.3s_ease-out_both]">
            <div className="text-center">
              <span className="sticker-badge bg-lime text-void text-[10px]">🏆 MATCH COMPLETE</span>
              <h1
                className="mt-2 text-4xl sm:text-5xl font-black font-display uppercase text-foreground"
                style={{ textShadow: "3px 3px 0 #000" }}
              >
                Final Awards
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                All {totalRounds} rounds finished. Here's how the hostel fared.
              </p>
            </div>

            {/* Award Badges */}
            <div className="mt-4 space-y-2.5">
              {/* 1. Best Liar */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2.5 border-black bg-magenta/15 shadow-[4px_4px_0_0_#000]">
                <div className="text-3xl">🎭</div>
                <div className="flex-1 text-left">
                  <div className="text-[9px] font-black uppercase tracking-widest text-magenta">
                    Best Liar Award
                  </div>
                  <div className="text-base font-black uppercase text-foreground">
                    {fraudsIndices.map((i) => players[i]?.name).join(", ")}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    Bluffed with confidence and escaped the roast!
                  </p>
                </div>
              </div>

              {/* 2. Sharpest Detective */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2.5 border-black bg-lime/15 shadow-[4px_4px_0_0_#000]">
                <div className="text-3xl">🕵️‍♂️</div>
                <div className="flex-1 text-left">
                  <div className="text-[9px] font-black uppercase tracking-widest text-lime">
                    Sharpest Detective
                  </div>
                  <div className="text-base font-black uppercase text-foreground">
                    {
                      [...players].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0))[0]
                        ?.name
                    }
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    Highest score across all {totalRounds} rounds!
                  </p>
                </div>
              </div>

              {/* 3. Most Suspicious */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2.5 border-black bg-cyan-400/15 shadow-[4px_4px_0_0_#000]">
                <div className="text-3xl">🤡</div>
                <div className="flex-1 text-left">
                  <div className="text-[9px] font-black uppercase tracking-widest text-cyan-400">
                    Most Sus Bro
                  </div>
                  <div className="text-base font-black uppercase text-foreground">
                    {players[votedPlayerIndex ?? 0]?.name}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground">
                    Acted innocent but ended up in the interrogation seat.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={handleShareResults}
                disabled={sharing}
                className="flex items-center justify-center gap-2 w-full rounded-2xl border-2.5 border-black bg-surface px-6 py-3.5 text-xs font-black uppercase tracking-widest text-foreground hover:border-lime shadow-[3px_3px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all min-h-[48px] cursor-pointer"
              >
                <Share2 className="size-4 text-lime" />
                <span>{sharing ? "Rendering Card..." : "Share Result Card 📸"}</span>
              </button>

              <button
                type="button"
                onClick={handlePlayAgainSamePlayers}
                className="w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none min-h-[54px] cursor-pointer transition-all"
              >
                Play Again (Same Players) 🔄 →
              </button>

              <Link
                to="/play/setup"
                onClick={() => {
                  buzz(15);
                  localStorage.removeItem("bof_active_session_v1");
                }}
                className="block text-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground py-2"
              >
                Change Players / Setup
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Peek Word Modal */}
      {showPeekModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease-out_both]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowPeekModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-3xl border-t-3 border-x-3 border-black bg-void p-5 max-h-[85dvh] flex flex-col shadow-[0_-6px_0_0_#000] animate-[slide-up_0.25s_ease-out_both]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wide font-display text-lime">
                  👀 Peek Word
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Check your secret word privately
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setShowPeekModal(false);
                }}
                className="grid size-9 place-items-center rounded-xl border-2 border-black bg-surface text-foreground font-black shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {peekPlayerIdx === null ? (
              <div className="mt-4 space-y-3 pb-6 flex-1 overflow-y-auto">
                <p className="text-xs text-center text-muted-foreground uppercase tracking-wider mb-2 font-bold">
                  Select your name to peek:
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
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface border-2 border-black px-4 py-3 text-sm font-black uppercase text-foreground hover:border-lime shadow-[3px_3px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px] cursor-pointer"
                    >
                      {renderAvatar(p.emoji, "size-4 text-lime")} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center justify-center text-center space-y-5 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    buzz(10);
                    setPeekPlayerIdx(null);
                    setPeekHeld(false);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-white"
                >
                  ← Select different player
                </button>

                <div className="w-full max-w-sm rounded-2xl border-3 border-black bg-surface p-6 flex flex-col items-center justify-center min-h-[180px] shadow-[4px_4px_0_0_#000]">
                  {peekHeld ? (
                    <div className="w-full flex flex-col items-center animate-[fade-in_0.15s_ease-out_both]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                        {fraudsIndices.includes(peekPlayerIdx)
                          ? "YOUR DECOY WORD"
                          : "YOUR SECRET WORD"}
                      </span>
                      <div
                        className={`text-2xl font-black font-mono tracking-widest uppercase py-4 px-3 w-full rounded-xl bg-void border-2 border-black mb-3 shadow-[2px_2px_0_0_#000] ${
                          fraudsIndices.includes(peekPlayerIdx) ? "text-magenta" : "text-lime"
                        }`}
                      >
                        {fraudsIndices.includes(peekPlayerIdx) ? bluffWord : targetWord}
                      </div>
                      <span className="text-xs font-black uppercase text-muted-foreground">
                        ROLE: {fraudsIndices.includes(peekPlayerIdx) ? "FRAUD" : "BRO"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Fingerprint className="size-12 text-lime animate-pulse mb-2" />
                      <p className="text-xs text-muted-foreground max-w-[20ch] uppercase font-bold">
                        Press and hold below to view your word
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
                  className="w-full rounded-2xl bg-lime px-6 py-4.5 text-base font-black uppercase tracking-wide text-void border-3 border-black shadow-[4px_4px_0_0_var(--color-magenta)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none touch-none select-none min-h-[54px] cursor-pointer"
                >
                  {peekHeld ? "Release to Hide" : "Hold to Peek Word"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
