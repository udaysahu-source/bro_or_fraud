import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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

export function HeadsUpEngine() {
  const navigate = useNavigate();
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Setup state
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", avatar: "😎", score: 0 },
    { id: "2", name: "Player 2", avatar: "🤠", score: 0 },
    { id: "3", name: "Player 3", avatar: "🤓", score: 0 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string>("all");
  const [roundDuration, setRoundDuration] = useState<30 | 60 | 90>(60);
  const [enableForbiddenWords, setEnableForbiddenWords] = useState(true);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // Phases: setup -> countdown -> playing -> recap -> podium
  const [phase, setPhase] = useState<"setup" | "countdown" | "playing" | "recap" | "podium">(
    "setup",
  );

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
  const timerIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  const lang = matchSettings.language || "hinglish";
  const activePlayer = players[activePlayerIndex];

  // Screen WakeLock during gameplay
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    if (phase === "playing") {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
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

  // Request motion permission (iOS Safari 13+)
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
        console.warn("Motion permission denied:", err);
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
      if (now - motionLastActionTimeRef.current < 900) return; // Debounce actions

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      // In portrait orientation held on forehead facing outwards:
      // Z-axis or Y-axis tilts forward (screen towards floor) or backwards (screen towards ceiling)
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

  // Start round countdown
  const startCountdown = async () => {
    await requestMotionPermission();
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
        if (soundEnabled) playTimerTickSound();
      }
    }, 1000);
  };

  // Start gameplay
  const startGameplay = () => {
    const item = getContentItem<HeadsUpItem>("heads-up-tilt", {
      packId: selectedPackId === "all" ? undefined : selectedPackId,
      spiceLevel: matchSettings.contentLevel,
    });
    setCurrentItem(item);
    setRoundResults([]);
    setTimeRemaining(roundDuration);
    setFlashFeedback(null);
    setPhase("playing");
    buzz(30);
    if (soundEnabled) playRoleRevealSound();

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          finishRound();
          return 0;
        }
        if (prev <= 6 && soundEnabled) {
          playTimerTickSound();
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle guess or pass
  const handleAnswer = (guessed: boolean) => {
    if (!currentItem || phase !== "playing") return;

    if (guessed) {
      buzz(30);
      setFlashFeedback("correct");
      if (soundEnabled) playVoteConfirmSound();
    } else {
      buzz([10, 40, 10]);
      setFlashFeedback("pass");
    }

    setRoundResults((prev) => [...prev, { item: currentItem, guessed }]);

    setTimeout(() => {
      setFlashFeedback(null);
    }, 350);

    // Fetch next card
    const nextItem = getContentItem<HeadsUpItem>("heads-up-tilt", {
      packId: selectedPackId === "all" ? undefined : selectedPackId,
      spiceLevel: matchSettings.contentLevel,
    });
    setCurrentItem(nextItem);
  };

  // End of round
  const finishRound = () => {
    clearInterval(timerIntervalRef.current);
    buzz([100, 50, 100]);
    if (soundEnabled) playTimerAlarmSound();

    setPhase("recap");
  };

  // Tally score and proceed
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

  // Add / remove player
  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const avatars = ["😎", "🤠", "🤓", "👻", "🔥", "🤖", "🦊", "🍕", "⚡", "🚀"];
    const avatar = avatars[players.length % avatars.length];
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
    <div className="min-h-screen bg-[#0D0D12] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Bar */}
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 bg-[#0D0D12]/80">
        <Link
          to="/"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          ← Hub
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            📱 HEADS UP / TILT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <Link
            to="/settings"
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* SETUP SCREEN */}
        {phase === "setup" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                📱
              </div>
              <h1 className="text-2xl font-black">Heads Up / Forehead Tilt</h1>
              <p className="text-xs text-slate-400">
                Hold phone to your forehead! Friends shout clues. Tilt down for Correct, tilt up to
                Pass!
              </p>
            </div>

            {/* Turn info */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Up next on forehead:
              </span>
              <div className="text-xl font-black text-white flex items-center justify-center gap-2">
                <span>{activePlayer.avatar}</span>
                <span>{activePlayer.name}</span>
              </div>
            </div>

            {/* Timer duration & forbidden words toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Duration</label>
                <div className="flex gap-1">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setRoundDuration(sec as any)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                        roundDuration === sec
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Taboo Mode</label>
                <button
                  onClick={() => setEnableForbiddenWords((v) => !v)}
                  className={`w-full py-1 rounded-lg text-xs font-bold ${
                    enableForbiddenWords
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {enableForbiddenWords ? "Forbidden Words ON" : "Normal Only"}
                </button>
              </div>
            </div>

            {/* How to play instruction */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Quick Gesture Controls:
              </div>
              <p className="text-slate-400 text-[11px]">
                Tilt phone <strong>DOWN</strong> towards floor when guessed correctly (or tap green
                button). Tilt <strong>UP</strong> towards ceiling to Pass (or tap gray button).
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={startCountdown}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> PLACE ON FOREHEAD & START
            </button>
          </div>
        )}

        {/* 3-SECOND COUNTDOWN SCREEN */}
        {phase === "countdown" && (
          <motion.div
            key={countdownSeconds}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-center space-y-4 py-12"
          >
            <div className="text-7xl font-black text-emerald-400 font-mono animate-pulse">
              {countdownSeconds}
            </div>
            <div className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Hold Phone to Forehead!
            </div>
          </motion.div>
        )}

        {/* ACTIVE PLAYING SCREEN (Landscape friendly & high contrast) */}
        {phase === "playing" && currentItem && (
          <div
            className={`min-h-[75vh] flex flex-col justify-between p-4 rounded-3xl transition-colors duration-200 ${
              flashFeedback === "correct"
                ? "bg-emerald-600/40 border-2 border-emerald-400"
                : flashFeedback === "pass"
                  ? "bg-amber-600/40 border-2 border-amber-400"
                  : "bg-white/[0.04] border border-white/10"
            }`}
          >
            {/* Top Stats */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-base">{timeRemaining}s</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                Score: {roundResults.filter((r) => r.guessed).length}
              </span>
            </div>

            {/* Word Card (Extra large for friends across the room to read clearly) */}
            <div className="text-center space-y-4 my-auto select-none">
              <div className="text-[11px] uppercase font-black tracking-widest text-emerald-400">
                {getLocalizedText(currentItem.word, "en")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                {getLocalizedText(currentItem.word, lang)}
              </h2>

              {/* Forbidden Words (Taboo) */}
              {enableForbiddenWords &&
                currentItem.forbiddenWords &&
                currentItem.forbiddenWords.length > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-xs mx-auto space-y-1">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      🚫 Do NOT say these words:
                    </div>
                    <div className="text-xs font-semibold text-rose-200">
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
                onClick={() => handleAnswer(false)}
                className="py-5 rounded-2xl bg-white/10 active:bg-white/20 text-slate-300 font-black text-sm flex flex-col items-center justify-center gap-1 border border-white/10 shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  <span>PASS</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">(or Tilt Up)</span>
              </button>

              <button
                onClick={() => handleAnswer(true)}
                className="py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 active:brightness-125 text-white font-black text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/30 cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <ArrowDown className="w-4 h-4" />
                  <span>CORRECT ✓</span>
                </div>
                <span className="text-[10px] font-normal text-emerald-100">(or Tilt Down)</span>
              </button>
            </div>
          </div>
        )}

        {/* ROUND RECAP */}
        {phase === "recap" && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                Time's Up!
              </span>
              <h2 className="text-2xl font-black text-white">
                {activePlayer.name} scored {roundResults.filter((r) => r.guessed).length} points!
              </h2>
            </div>

            {/* List of cards */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {roundResults.map((res, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    res.guessed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-white font-bold"
                      : "bg-white/[0.03] border-white/5 text-slate-400 line-through"
                  }`}
                >
                  <span>{getLocalizedText(res.item.word, lang)}</span>
                  <span>{res.guessed ? "✓ Guessed" : "Skipped"}</span>
                </div>
              ))}
            </div>

            <button
              onClick={finalizeRoundRecap}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30"
            >
              {activePlayerIndex + 1 < players.length
                ? "Next Player's Turn →"
                : "View Final Leaderboard 🏆"}
            </button>
          </div>
        )}

        {/* FINAL PODIUM */}
        {phase === "podium" && (
          <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
            <div className="text-5xl">🏆</div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-emerald-400">Forehead Charades Champion!</h1>
              <p className="text-xs text-slate-400">
                Quickest wits and sharpest guessing in the hostel!
              </p>
            </div>

            <div className="space-y-2 text-left">
              {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs ${
                      idx === 0
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/[0.03] border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm text-emerald-400">#{idx + 1}</span>
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-bold text-white text-sm">{p.name}</span>
                    </div>
                    <div className="font-black text-emerald-300 text-sm">{p.score} pts</div>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
                  setActivePlayerIndex(0);
                  setPhase("setup");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-sm text-white shadow-lg"
              >
                Play Again
              </button>
              <Link
                to="/"
                className="block w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold text-center"
              >
                Back to Party Hub
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="px-4 py-2 text-center text-[10px] text-slate-600 border-t border-white/5">
        Bro or Fraud? Hub • 100% Offline Hostel Games
      </footer>
    </div>
  );
}
