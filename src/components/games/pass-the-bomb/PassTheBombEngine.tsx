import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bomb,
  Heart,
  Skull,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  Flame,
  Zap,
  Users,
  Settings as SettingsIcon,
  ChevronDown,
  Sparkles,
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
import { PassTheBombItem } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";

interface Player {
  id: string;
  name: string;
  avatar: string;
  lives: number;
  isEliminated: boolean;
  passesCount: number;
  timesExploded: number;
}

const MODIFIERS = [
  { id: "none", name: "Standard Round", desc: "Say a valid answer and pass quickly!", icon: "⚡" },
  {
    id: "reverse",
    name: "Reverse Direction!",
    desc: "Direction reversed! Pass to your opposite side.",
    icon: "🔄",
  },
  {
    id: "double",
    name: "Double Trouble!",
    desc: "You must name TWO answers before passing!",
    icon: "✌️",
  },
  {
    id: "alphabet",
    name: "Alphabet Lock!",
    desc: "Your answer must start with the locked letter!",
    icon: "🔤",
  },
  {
    id: "no-obvious",
    name: "No Obvious Answers!",
    desc: "Skip the top 3 easiest answers or you fail!",
    icon: "🚫",
  },
];

const ALPHABET_POOL = ["A", "B", "C", "D", "K", "M", "P", "R", "S", "T"];

export function PassTheBombEngine() {
  const navigate = useNavigate();
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game setup
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      name: "Player 1",
      avatar: "😎",
      lives: 3,
      isEliminated: false,
      passesCount: 0,
      timesExploded: 0,
    },
    {
      id: "2",
      name: "Player 2",
      avatar: "🤠",
      lives: 3,
      isEliminated: false,
      passesCount: 0,
      timesExploded: 0,
    },
    {
      id: "3",
      name: "Player 3",
      avatar: "🤓",
      lives: 3,
      isEliminated: false,
      passesCount: 0,
      timesExploded: 0,
    },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string>("all");
  const [phase, setPhase] = useState<"setup" | "playing" | "exploded" | "podium">("setup");

  // Round State
  const [currentItem, setCurrentItem] = useState<PassTheBombItem | null>(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [passDirection, setPassDirection] = useState<1 | -1>(1); // 1 = clockwise, -1 = counter-clockwise
  const [activeModifier, setActiveModifier] = useState(MODIFIERS[0]);
  const [lockedLetter, setLockedLetter] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showStuckDrawer, setShowStuckDrawer] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [elapsedRoundSeconds, setElapsedRoundSeconds] = useState(0);

  // Hidden Fuse
  const fuseSecondsRef = useRef<number>(25);
  const roundStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const tickIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  // Keep screen awake during gameplay
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

  // Audio helper
  const playWebAudioExplosion = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const alivePlayers = players.filter((p) => !p.isEliminated);
  const isSuddenDeath = alivePlayers.length === 2;

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
        lives: 3,
        isEliminated: false,
        passesCount: 0,
        timesExploded: 0,
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

  // Start new round
  const startRound = () => {
    const item = getContentItem<PassTheBombItem>("pass-the-bomb", {
      packId: selectedPackId === "all" ? undefined : selectedPackId,
      spiceLevel: matchSettings.contentLevel,
    });
    setCurrentItem(item);

    // Pick random fuse duration
    // Standard: 18 - 42 seconds; Sudden Death: 9 - 18 seconds
    const minFuse = isSuddenDeath ? 9 : 18;
    const maxFuse = isSuddenDeath ? 18 : 42;
    const fuse = Math.floor(Math.random() * (maxFuse - minFuse + 1)) + minFuse;
    fuseSecondsRef.current = fuse;
    roundStartTimeRef.current = Date.now();
    setElapsedRoundSeconds(0);
    setShowStuckDrawer(false);
    setShowChallengeModal(false);

    // Pick modifier (25% chance of special modifier in regular rounds)
    let modifier = MODIFIERS[0];
    let letter: string | null = null;
    const rand = Math.random();
    if (rand < 0.25) {
      const specialMods = MODIFIERS.slice(1);
      modifier = specialMods[Math.floor(Math.random() * specialMods.length)];
      if (modifier.id === "alphabet") {
        letter = ALPHABET_POOL[Math.floor(Math.random() * ALPHABET_POOL.length)];
      }
    }
    setActiveModifier(modifier);
    setLockedLetter(letter);
    setPassDirection(modifier.id === "reverse" ? -1 : 1);

    // Find first alive player starting from next index
    let nextIdx = (activePlayerIndex + 1) % players.length;
    while (players[nextIdx].isEliminated) {
      nextIdx = (nextIdx + 1) % players.length;
    }
    setActivePlayerIndex(nextIdx);

    setPhase("playing");
    buzz(30);
    if (soundEnabled) playRoleRevealSound();
  };

  // Handle pass
  const handlePassBomb = () => {
    if (phase !== "playing") return;
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    // Increment player's passes
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex ? { ...p, passesCount: p.passesCount + 1 } : p,
      ),
    );

    // Advance to next alive player
    let nextIdx = activePlayerIndex;
    const len = players.length;
    do {
      nextIdx = (nextIdx + passDirection + len) % len;
    } while (players[nextIdx].isEliminated && nextIdx !== activePlayerIndex);

    setActivePlayerIndex(nextIdx);
  };

  // Handle Explosion
  const triggerExplosion = (victimIdx: number) => {
    clearInterval(timerIntervalRef.current);
    clearInterval(tickIntervalRef.current);

    buzz([100, 50, 200, 50, 400]);
    playWebAudioExplosion();
    if (soundEnabled) playTimerAlarmSound();

    setPlayers((prev) => {
      const updated = prev.map((p, idx) => {
        if (idx === victimIdx) {
          const newLives = p.lives - 1;
          return {
            ...p,
            lives: newLives,
            timesExploded: p.timesExploded + 1,
            isEliminated: newLives <= 0,
          };
        }
        return p;
      });

      const stillAlive = updated.filter((p) => !p.isEliminated);
      if (stillAlive.length <= 1) {
        setTimeout(() => {
          setPhase("podium");
          if (soundEnabled) playVictorySound();
        }, 2200);
      }
      return updated;
    });

    setPhase("exploded");
  };

  // Ticking and Countdown loop
  useEffect(() => {
    if (phase !== "playing") return;

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - roundStartTimeRef.current) / 1000;
      setElapsedRoundSeconds(Math.floor(elapsed));

      if (elapsed >= fuseSecondsRef.current) {
        triggerExplosion(activePlayerIndex);
      }
    }, 250);

    // Accelerating audio tick
    const runTick = () => {
      if (phase !== "playing") return;
      const elapsed = (Date.now() - roundStartTimeRef.current) / 1000;
      const remainingRatio = Math.max(0.05, 1 - elapsed / fuseSecondsRef.current);
      if (soundEnabled) playTimerTickSound();
      buzz(10);

      // Delay scales from 900ms down to 120ms
      const nextDelay = 120 + remainingRatio * 780;
      tickIntervalRef.current = setTimeout(runTick, nextDelay);
    };

    tickIntervalRef.current = setTimeout(runTick, 800);

    return () => {
      clearInterval(timerIntervalRef.current);
      clearTimeout(tickIntervalRef.current);
    };
  }, [phase, activePlayerIndex, soundEnabled]);

  // Challenge resolution
  const handleResolveChallenge = (victimIdx: number) => {
    setShowChallengeModal(false);
    triggerExplosion(victimIdx);
  };

  const activePlayer = players[activePlayerIndex];
  const lang = matchSettings.language || "hinglish";

  return (
    <div className="min-h-screen bg-[#0D0D12] text-slate-100 flex flex-col justify-between selection:bg-rose-500/30">
      {/* Top Bar */}
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 bg-[#0D0D12]/80">
        <Link
          to="/"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          ← Hub
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-wide bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
            💣 PASS THE BOMB
          </span>
          {phase === "playing" && isSuddenDeath && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              Sudden Death
            </span>
          )}
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

      {/* Main Content Areas */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* SETUP SCREEN */}
        {phase === "setup" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-3xl shadow-lg shadow-rose-500/20">
                💣
              </div>
              <h1 className="text-2xl font-black">Pass the Bomb!</h1>
              <p className="text-xs text-slate-400">
                Think fast, shout your answer, pass the phone before it explodes in your hands!
              </p>
            </div>

            {/* Rules Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> How to Play:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Read the category aloud.</li>
                <li>Give a unique valid answer, tap Pass, and hand the phone!</li>
                <li>The fuse is secret (15-45s) — it will blow up at any time.</li>
                <li>3 lives each. Last student standing wins!</li>
              </ul>
            </div>

            {/* Players List */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Players ({players.length})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-lg">{p.avatar}</span>
                      <span className="text-xs font-semibold truncate">{p.name}</span>
                    </div>
                    {players.length > 2 && (
                      <button
                        onClick={() => removePlayer(p.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add player input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add friend's name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={addPlayer}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startRound}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 font-black text-sm tracking-wide shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> START ROUND 1
            </button>
          </div>
        )}

        {/* ACTIVE GAMEPLAY */}
        {phase === "playing" && currentItem && (
          <div className="space-y-6 select-none">
            {/* Round info bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-400 font-semibold border border-white/5">
                Round {roundNumber}
              </span>
              {activeModifier.id !== "none" && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[11px] animate-pulse">
                  <span>{activeModifier.icon}</span>
                  <span>{activeModifier.name}</span>
                  {lockedLetter && <span className="underline ml-1">Letter: '{lockedLetter}'</span>}
                </div>
              )}
            </div>

            {/* Prompt Box */}
            <motion.div
              key={currentItem.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 shadow-2xl space-y-3 text-center"
            >
              <div className="text-[11px] uppercase tracking-wider font-extrabold text-orange-400 flex items-center justify-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Name / Shout:
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
                {getLocalizedText(currentItem.prompt || (currentItem as any).category, lang)}
              </h2>
              {currentItem.bannedWords && currentItem.bannedWords.length > 0 && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-rose-400">
                  <span className="font-bold">🚫 Banned: </span>
                  {currentItem.bannedWords.join(", ")}
                </div>
              )}
            </motion.div>

            {/* Active Player Card with pulsing bomb */}
            <div className="text-center space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Holding the bomb right now:
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-lg shadow-rose-500/10"
              >
                <span className="text-3xl">{activePlayer.avatar}</span>
                <div className="text-left">
                  <div className="text-lg font-black text-rose-300">{activePlayer.name}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < activePlayer.lives
                            ? "fill-rose-500 text-rose-500"
                            : "fill-slate-700 text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Giant PASS Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handlePassBomb}
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-600 to-red-600 text-white font-black text-xl tracking-wider shadow-2xl shadow-rose-600/40 border border-white/20 flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>PASS BOMB!</span>
                  <ArrowRight className="w-6 h-6 stroke-[3]" />
                </div>
                <span className="text-xs font-normal text-rose-200">
                  Say answer, tap here, hand phone!
                </span>
              </motion.button>
            </div>

            {/* Actions: Stuck drawer toggle & Challenge / Repeat */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowStuckDrawer((v) => !v)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/5 flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Stuck? Hint</span>
              </button>
              <button
                onClick={() => setShowChallengeModal(true)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Call Repeat!</span>
              </button>
            </div>

            {/* Stuck Help Drawer */}
            <AnimatePresence>
              {showStuckDrawer && currentItem.examples && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5"
                >
                  <div className="font-bold text-amber-300">
                    💡 Example answers (shout one of these):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentItem.examples.map((ex: any, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[11px]"
                      >
                        {getLocalizedText(ex, lang)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Challenge Modal */}
            <AnimatePresence>
              {showChallengeModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-sm bg-[#16161E] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 font-black">
                      <AlertTriangle className="w-5 h-5" /> Challenge / Repeat!
                    </div>
                    <p className="text-xs text-slate-300">
                      Did <strong className="text-white">{activePlayer.name}</strong> repeat an
                      answer already said, or make up something completely invalid?
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleResolveChallenge(activePlayerIndex)}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Yes, Invalid/Repeated! (Lose Life)
                      </button>
                      <button
                        onClick={() => setShowChallengeModal(false)}
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs"
                      >
                        False Alarm, Resume Game
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* EXPLOSION SCREEN */}
        {phase === "exploded" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-6"
          >
            <div className="text-6xl animate-bounce">💥</div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-rose-500 tracking-tight">
                BOOM! IT EXPLODED!
              </h1>
              <p className="text-sm text-slate-300">
                The bomb went off in{" "}
                <strong className="text-white text-base">{activePlayer.name}</strong>'s hands!
              </p>
            </div>

            {/* Life Lost Graphic */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 max-w-xs mx-auto space-y-2">
              <div className="text-2xl">{activePlayer.avatar}</div>
              <div className="font-bold text-sm">{activePlayer.name}</div>
              <div className="flex items-center justify-center gap-2 text-rose-500">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-5 h-5 ${
                      i < activePlayer.lives
                        ? "fill-rose-500 text-rose-500"
                        : "fill-slate-800 text-slate-800"
                    }`}
                  />
                ))}
              </div>
              {activePlayer.isEliminated ? (
                <div className="text-xs font-black text-rose-400 bg-rose-500/20 py-1 px-2 rounded-lg">
                  💀 ELIMINATED FROM THE GAME!
                </div>
              ) : (
                <div className="text-xs text-slate-400">{activePlayer.lives} lives remaining</div>
              )}
            </div>

            {/* Next round button */}
            <button
              onClick={() => {
                setRoundNumber((r) => r + 1);
                startRound();
              }}
              className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              Next Round →
            </button>
          </motion.div>
        )}

        {/* PODIUM SCREEN */}
        {phase === "podium" && (
          <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
            <div className="text-5xl">🏆</div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-amber-400">Survivor Champion!</h1>
              <p className="text-xs text-slate-400">
                Only one student survived the bomb without getting blasted!
              </p>
            </div>

            {/* Winner Spotlight */}
            {alivePlayers[0] && (
              <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 space-y-2">
                <div className="text-4xl">{alivePlayers[0].avatar}</div>
                <div className="text-xl font-black text-white">{alivePlayers[0].name}</div>
                <div className="text-xs text-amber-300 font-semibold">
                  Survived with {alivePlayers[0].lives} ❤️ left • {alivePlayers[0].passesCount}{" "}
                  passes made
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Final Standings
              </label>
              {players
                .slice()
                .sort((a, b) => b.lives - a.lives || b.passesCount - a.passesCount)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">#{idx + 1}</span>
                      <span>{p.avatar}</span>
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{p.passesCount} passes</span>
                      <span>{p.isEliminated ? "💀" : `${p.lives} ❤️`}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Play again */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPlayers((prev) =>
                    prev.map((p) => ({
                      ...p,
                      lives: 3,
                      isEliminated: false,
                      passesCount: 0,
                      timesExploded: 0,
                    })),
                  );
                  setRoundNumber(1);
                  setPhase("setup");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 font-black text-sm text-white shadow-lg shadow-rose-600/30"
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

      {/* Footer */}
      <footer className="px-4 py-2 text-center text-[10px] text-slate-600 border-t border-white/5">
        Bro or Fraud? Hub • 100% Offline Hostel Games
      </footer>
    </div>
  );
}
