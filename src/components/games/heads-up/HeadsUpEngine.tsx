import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer,
  Play,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Users,
  Award,
  Settings as SettingsIcon,
  ShieldAlert,
  Trophy,
  ArrowRight,
  HelpCircle,
  Check,
  X,
} from "lucide-react";
import { buzz } from "@/lib/haptics";
import {
  playTimerTickSound,
  playTimerAlarmSound,
  playRoleRevealSound,
  playVictorySound,
  playVoteConfirmSound,
} from "@/lib/audio";
import { loadSettings, MatchSettings } from "@/lib/settings";
import { getContentItem, getLocalizedText } from "@/lib/games/loader";
import { HeadsUpItem } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
}

interface RoundResultItem {
  item: HeadsUpItem;
  guessed: boolean;
}

const AVATAR_POOL = [
  "Smile",
  "Crown",
  "Sparkles",
  "Ghost",
  "Flame",
  "Bot",
  "Shield",
  "Zap",
  "Star",
  "User",
];

export function HeadsUpEngine() {
  const navigate = useNavigate();
  const [matchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Setup state
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", avatar: "Smile", score: 0 },
    { id: "2", name: "Player 2", avatar: "Crown", score: 0 },
    { id: "3", name: "Player 3", avatar: "Sparkles", score: 0 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [roundDuration, setRoundDuration] = useState<30 | 60 | 90>(60);
  const [enableForbiddenWords, setEnableForbiddenWords] = useState(true);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Phases: setup -> explainer -> countdown -> playing -> recap -> podium
  const [phase, setPhase] = useState<
    "setup" | "explainer" | "countdown" | "playing" | "recap" | "podium"
  >("setup");

  // Gameplay state
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [currentItem, setCurrentItem] = useState<HeadsUpItem | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResultItem[]>([]);
  const [flashFeedback, setFlashFeedback] = useState<"correct" | "pass" | null>(null);

  // Accelerometer / DeviceMotion state
  const [motionSupported, setMotionSupported] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  const motionLastActionTimeRef = useRef<number>(0);
  const isNeutralRef = useRef<boolean>(true);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  const lang = matchSettings.language || "hinglish";
  const activePlayer = players[activePlayerIndex];

  // Screen WakeLock during gameplay
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    if (phase === "playing") {
      (navigator as any).wakeLock
        ?.request("screen")
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [phase]);

  // Request motion permission (iOS Safari 13+ requires tap trigger)
  const requestMotionPermission = async () => {
    if (typeof window === "undefined") return;
    if (typeof (DeviceMotionEvent as any)?.requestPermission === "function") {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === "granted") {
          setMotionSupported(true);
          setMotionActive(true);
        }
      } catch (err) {
        console.warn("Motion permission denied or unavailable:", err);
      }
    } else if ("DeviceMotionEvent" in window) {
      setMotionSupported(true);
      setMotionActive(true);
    }
  };

  // DeviceMotion event listener
  useEffect(() => {
    if (phase !== "playing" || !motionActive || typeof window === "undefined") return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - motionLastActionTimeRef.current < 900) return;

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const z = acc.z || 0;
      const y = acc.y || 0;

      // Neutral check
      if (Math.abs(z) < 4 && Math.abs(y) > 7) {
        isNeutralRef.current = true;
      }

      if (!isNeutralRef.current) return;

      // Tilt Forward (towards floor) -> CORRECT
      if (z > 7.5 || (y < 2 && y > -4 && z > 6)) {
        isNeutralRef.current = false;
        motionLastActionTimeRef.current = now;
        handleAnswer(true);
      }
      // Tilt Backward (towards ceiling) -> PASS
      else if (z < -6.5 || (y < -7 && z < -3)) {
        isNeutralRef.current = false;
        motionLastActionTimeRef.current = now;
        handleAnswer(false);
      }
    };

    window.addEventListener("devicemotion", handleDeviceMotion);
    return () => window.removeEventListener("devicemotion", handleDeviceMotion);
  }, [phase, motionActive, currentItem]);

  // Start round countdown after explainer / permission
  const proceedToCountdown = async (withMotion: boolean) => {
    if (withMotion) {
      await requestMotionPermission();
    }
    setCountdownSeconds(3);
    setPhase("countdown");
    buzz(20);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        startGameplay();
      } else {
        setCountdownSeconds(count);
        buzz(15);
        if (soundEnabled) playTimerTickSound(true);
      }
    }, 1000);
  };

  const startGameplay = () => {
    setTimeRemaining(roundDuration);
    setRoundResults([]);
    setPhase("playing");
    drawNextCard();
    if (soundEnabled) playRoleRevealSound();
    buzz([30, 40]);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          endRound();
          return 0;
        }
        if (prev <= 5) {
          buzz(20);
          if (soundEnabled) playTimerTickSound(true);
        } else if (prev <= 10) {
          buzz(10);
          if (soundEnabled) playTimerTickSound(false);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const drawNextCard = () => {
    const item = getContentItem("heads-up-tilt") as HeadsUpItem;
    setCurrentItem(item);
  };

  const handleAnswer = (guessed: boolean) => {
    if (!currentItem) return;

    setRoundResults((prev) => [...prev, { item: currentItem, guessed }]);

    if (guessed) {
      buzz([30, 40]);
      if (soundEnabled) playVoteConfirmSound();
      setFlashFeedback("correct");
    } else {
      buzz(40);
      setFlashFeedback("pass");
    }

    setTimeout(() => {
      setFlashFeedback(null);
    }, 280);

    drawNextCard();
  };

  const endRound = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (soundEnabled) playTimerAlarmSound();
    buzz([50, 40, 60]);
    setPhase("recap");
  };

  const finalizeRoundRecap = () => {
    const correctCount = roundResults.filter((r) => r.guessed).length;
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex ? { ...p, score: p.score + correctCount } : p,
      ),
    );

    if (activePlayerIndex + 1 < players.length) {
      setActivePlayerIndex((i) => i + 1);
      setPhase("setup");
    } else {
      setPhase("podium");
      if (soundEnabled) playVictorySound();
    }
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const avatar = AVATAR_POOL[players.length % AVATAR_POOL.length];
    setPlayers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newPlayerName.trim(),
        avatar,
        score: 0,
      },
    ]);
    setNewPlayerName("");
    buzz(15);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    buzz(15);
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand-gold)]/20">
      {/* UNIFORM FRAME: TOP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--separator)]">
        <Link
          to="/"
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--chip)] transition-colors"
        >
          End game
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">Heads Up</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)] tabular-nums">
            P{activePlayerIndex + 1}/{players.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Toggle Sound"
            onClick={() => setSoundEnabled((v) => !v)}
            className="size-9 rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)] grid place-items-center cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="size-4 text-[var(--gold-text)]" strokeWidth={1.5} />
            ) : (
              <VolumeX className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* SETUP SCREEN */}
        {phase === "setup" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                <Smartphone className="size-3 text-[var(--gold-text)]" strokeWidth={1.5} />
                Forehead Charades
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Round Setup
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Hold phone to your forehead. Friends shout clues without saying taboo words.
              </p>
            </div>

            {/* Turn info */}
            <div
              className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] text-center space-y-2"
              style={{
                boxShadow: "0 0 24px -6px rgba(251, 191, 36, 0.2)",
              }}
            >
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Up next on forehead
              </span>
              <div className="flex items-center justify-center gap-2">
                <div className="size-10 rounded-[0.75rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)]">
                  {renderAvatar(activePlayer.avatar, "size-5 text-current")}
                </div>
                <span className="text-xl font-bold text-[var(--text)]">{activePlayer.name}</span>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                  Duration
                </label>
                <div className="flex gap-1">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRoundDuration(sec as any)}
                      className={`flex-1 py-1 rounded-[0.5rem] text-xs font-bold tabular-nums transition-colors ${
                        roundDuration === sec
                          ? "bg-[var(--brand-gold)] text-[var(--on-gold)]"
                          : "bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                  Taboo Mode
                </label>
                <button
                  type="button"
                  onClick={() => setEnableForbiddenWords((v) => !v)}
                  className={`w-full py-1 rounded-[0.5rem] text-xs font-bold transition-colors ${
                    enableForbiddenWords
                      ? "bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--brand-gold)]/40"
                      : "bg-[var(--chip)] text-[var(--text-secondary)]"
                  }`}
                >
                  {enableForbiddenWords ? "Taboo ON" : "Taboo OFF"}
                </button>
              </div>
            </div>

            {/* Players list */}
            <div className="rounded-[var(--radius-group)] bg-[var(--card)] p-3 border border-[var(--separator)] space-y-2">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                Players ({players.length})
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-[0.5rem] bg-[var(--chip)] text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      {renderAvatar(p.avatar, "size-4 text-[var(--gold-text)]")}
                      <span className="text-[var(--text)]">{p.name}</span>
                    </div>
                    {players.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => removePlayer(p.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--pink-text)] text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPlayer();
                  }}
                  placeholder="Add player..."
                  className="flex-1 bg-[var(--bg)] border border-[var(--separator)] rounded-[var(--radius-btn)] px-3 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--brand-gold)]"
                />
                <button
                  type="button"
                  onClick={addPlayer}
                  className="px-3 py-1.5 rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-bold text-[var(--text)] hover:bg-[var(--chip)]/80"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPhase("explainer")}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="size-4 fill-current" />
                <span>Start Forehead Round</span>
              </button>
            </div>
          </div>
        )}

        {/* SHORT EXPLAINER & TAP-TRIGGERED PERMISSION */}
        {phase === "explainer" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                Forehead Position
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Hold phone to forehead
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Screen faces outward towards friends.
              </p>
            </div>

            {/* Tilt instructions card */}
            <div className="my-auto w-full p-5 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-[0.5rem] bg-[var(--brand-gold)]/20 text-[var(--gold-text)] grid place-items-center shrink-0">
                  <ArrowDown className="size-4" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Tilt DOWN = Correct</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Nod phone towards floor when friends say you got it right.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-8 rounded-[0.5rem] bg-[var(--chip)] text-[var(--text-secondary)] grid place-items-center shrink-0">
                  <ArrowUp className="size-4" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Tilt UP = Pass</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Tilt head back towards ceiling to skip a tough word.
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--separator)] flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <CheckCircle2
                  className="size-3.5 text-[var(--gold-text)] shrink-0"
                  strokeWidth={1.5}
                />
                <span>On-screen buttons are always available if tilt isn't preferred.</span>
              </div>
            </div>

            {/* Actions: Enable Motion vs Fallback Buttons */}
            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={() => proceedToCountdown(true)}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enable Tilt & Start (3s)</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>

              <button
                type="button"
                onClick={() => proceedToCountdown(false)}
                className="w-full min-h-[46px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Play with buttons only
              </button>
            </div>
          </div>
        )}

        {/* 3-SECOND COUNTDOWN */}
        {phase === "countdown" && (
          <motion.div
            key={countdownSeconds}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center text-center my-auto py-12 space-y-4"
          >
            <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
              Get Ready
            </span>
            <div className="font-mono text-8xl font-bold text-[var(--gold-text)] tabular-nums animate-pulse">
              {countdownSeconds}
            </div>
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest">
              Hold Phone to Forehead!
            </div>
          </motion.div>
        )}

        {/* ACTIVE PLAYING SCREEN */}
        {phase === "playing" && currentItem && (
          <div
            className={`min-h-[75vh] flex flex-col justify-between p-4 rounded-[var(--radius-card)] transition-colors duration-200 border ${
              flashFeedback === "correct"
                ? "bg-[var(--brand-gold)]/20 border-[var(--brand-gold)]"
                : flashFeedback === "pass"
                  ? "bg-[var(--chip)] border-[var(--brand-pink)]/40"
                  : "bg-[var(--card)] border-[var(--separator)]"
            }`}
          >
            {/* Top Stats */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-[var(--chip)] text-[var(--text)] flex items-center gap-1.5 tabular-nums">
                <Timer className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                <span className="font-mono text-sm font-bold">{timeRemaining}s</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--chip)] text-[var(--gold-text)] font-mono font-bold tabular-nums">
                Score: {roundResults.filter((r) => r.guessed).length}
              </span>
            </div>

            {/* Word Card: Large readable text */}
            <div className="text-center space-y-3 my-auto select-none py-6">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--gold-text)]">
                {getLocalizedText(currentItem.word, "en")}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-[var(--text)] tracking-tight leading-tight">
                {getLocalizedText(currentItem.word, lang)}
              </h2>

              {/* Forbidden Words (Taboo) */}
              {enableForbiddenWords &&
                currentItem.forbiddenWords &&
                currentItem.forbiddenWords.length > 0 && (
                  <div className="p-3 rounded-[var(--radius-group)] bg-[var(--bg)] border border-[var(--brand-pink)]/30 max-w-xs mx-auto space-y-1">
                    <div className="text-[10px] font-bold text-[var(--pink-text)] uppercase tracking-wider flex items-center justify-center gap-1">
                      <ShieldAlert className="size-3 text-[var(--pink-text)]" strokeWidth={1.5} />
                      <span>Forbidden Taboo Words</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-secondary)]">
                      {currentItem.forbiddenWords
                        .map((w: any) => getLocalizedText(w, lang))
                        .join(" • ")}
                    </div>
                  </div>
                )}
            </div>

            {/* Always-on Fallback Tap Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="min-h-[56px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)] font-bold text-sm flex flex-col items-center justify-center border border-[var(--separator)] cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="size-4" strokeWidth={1.5} />
                  <span>PASS</span>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] font-normal">
                  (or Tilt Up)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="min-h-[56px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-sm flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowDown className="size-4" strokeWidth={2} />
                  <span>CORRECT</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal">(or Tilt Down)</span>
              </button>
            </div>
          </div>
        )}

        {/* ROUND RECAP */}
        {phase === "recap" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                Time's Up
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
                {activePlayer.name} scored{" "}
                <span className="font-mono text-[var(--gold-text)] tabular-nums">
                  {roundResults.filter((r) => r.guessed).length}
                </span>{" "}
                points!
              </h2>
            </div>

            {/* List of cards */}
            <div className="my-auto space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {roundResults.map((res, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-[0.75rem] border flex items-center justify-between text-xs font-semibold ${
                    res.guessed
                      ? "bg-[var(--brand-gold)]/15 border-[var(--brand-gold)]/30 text-[var(--text)]"
                      : "bg-[var(--chip)] border-[var(--separator)] text-[var(--text-secondary)] line-through"
                  }`}
                >
                  <span>{getLocalizedText(res.item.word, lang)}</span>
                  <span>{res.guessed ? "Guessed" : "Skipped"}</span>
                </div>
              ))}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={finalizeRoundRecap}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {activePlayerIndex + 1 < players.length
                    ? "Next Player's Turn"
                    : "View Final Leaderboard"}
                </span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* FINAL PODIUM */}
        {phase === "podium" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                <Trophy className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                Charades Champion!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Quickest wits and sharpest guessing in the hostel.
              </p>
            </div>

            <div className="my-auto space-y-2 w-full text-left">
              {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-[var(--radius-group)] border text-xs font-semibold ${
                      idx === 0
                        ? "bg-[var(--card)] border-[var(--brand-gold)]/50 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        : "bg-[var(--card)] border-[var(--separator)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-[var(--gold-text)] tabular-nums">
                        #{idx + 1}
                      </span>
                      <div className="size-8 rounded-[0.5rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)]">
                        {renderAvatar(p.avatar, "size-4 text-current")}
                      </div>
                      <span className="text-[var(--text)]">{p.name}</span>
                    </div>
                    <div className="font-mono font-bold text-[var(--gold-text)] tabular-nums">
                      {p.score} pts
                    </div>
                  </div>
                ))}
            </div>

            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
                  setActivePlayerIndex(0);
                  setPhase("setup");
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-4" strokeWidth={1.5} />
                <span>Play Again</span>
              </button>
              <Link
                to="/"
                className="block w-full py-2.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] text-center"
              >
                Back to Party Hub
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
