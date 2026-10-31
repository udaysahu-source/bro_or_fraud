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
  Sparkles,
  Type,
  ShieldAlert,
  Trophy,
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
import { PassTheBombItem } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";
import { loadActiveRoster } from "@/lib/roster";

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
  { id: "none", name: "Standard Round", desc: "Say a valid answer and pass quickly!", icon: Zap },
  {
    id: "reverse",
    name: "Reverse Direction!",
    desc: "Direction reversed! Pass to your opposite side.",
    icon: RotateCcw,
  },
  {
    id: "double",
    name: "Double Trouble!",
    desc: "You must name TWO answers before passing!",
    icon: Sparkles,
  },
  {
    id: "alphabet",
    name: "Alphabet Lock!",
    desc: "Your answer must start with the locked letter!",
    icon: Type,
  },
  {
    id: "no-obvious",
    name: "No Obvious Answers!",
    desc: "Skip the top 3 easiest answers or you fail!",
    icon: ShieldAlert,
  },
];

const ALPHABET_POOL = ["A", "B", "C", "D", "K", "M", "P", "R", "S", "T"];
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

export function PassTheBombEngine() {
  const navigate = useNavigate();
  const [matchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game setup
  const [players, setPlayers] = useState<Player[]>(() => {
    const roster = loadActiveRoster();
    return roster.map((name, i) => ({
      id: `p_${i + 1}`,
      name,
      avatar: AVATAR_POOL[i % AVATAR_POOL.length] || "Smile",
      lives: 3,
      isEliminated: false,
      passesCount: 0,
      timesExploded: 0,
    }));
  });
  const [newPlayerName, setNewPlayerName] = useState("");
  const [phase, setPhase] = useState<"setup" | "playing" | "exploded" | "podium">("setup");

  // Round State
  const [currentItem, setCurrentItem] = useState<PassTheBombItem | null>(null);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [passDirection, setPassDirection] = useState<1 | -1>(1);
  const [activeModifier, setActiveModifier] = useState(MODIFIERS[0]);
  const [lockedLetter, setLockedLetter] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showStuckDrawer, setShowStuckDrawer] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [elapsedRoundSeconds, setElapsedRoundSeconds] = useState(0);

  // Hidden Fuse
  const fuseSecondsRef = useRef<number>(25);
  const roundStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

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
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, [phase]);

  // Alive players
  const alivePlayers = players.filter((p) => !p.isEliminated);
  const isSuddenDeath = alivePlayers.length === 2;

  const triggerExplosion = (victimIdx: number) => {
    if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    if (soundEnabled) playTimerAlarmSound();
    buzz([80, 50, 100]);

    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx === victimIdx) {
          const nextLives = p.lives - 1;
          return {
            ...p,
            lives: nextLives,
            isEliminated: nextLives <= 0,
            timesExploded: p.timesExploded + 1,
          };
        }
        return p;
      }),
    );

    setPhase("exploded");
  };

  const startRound = () => {
    buzz(25);
    if (soundEnabled) playRoleRevealSound();

    const item = getContentItem("pass-the-bomb") as PassTheBombItem;
    setCurrentItem(item);

    // Modifier
    let chosenMod = MODIFIERS[0];
    if (roundNumber > 1 && Math.random() < 0.6) {
      const candidates = MODIFIERS.slice(1);
      chosenMod = candidates[Math.floor(Math.random() * candidates.length)];
    }
    setActiveModifier(chosenMod);

    if (chosenMod.id === "alphabet") {
      setLockedLetter(ALPHABET_POOL[Math.floor(Math.random() * ALPHABET_POOL.length)]);
    } else {
      setLockedLetter(null);
    }

    setPassDirection(chosenMod.id === "reverse" ? -1 : 1);

    // Fuse duration 18 to 42s
    const randomFuse = Math.floor(Math.random() * (42 - 18 + 1)) + 18;
    fuseSecondsRef.current = randomFuse;
    roundStartTimeRef.current = Date.now();
    setElapsedRoundSeconds(0);

    const firstAliveIdx = players.findIndex((p) => !p.isEliminated);
    setActivePlayerIndex(firstAliveIdx >= 0 ? firstAliveIdx : 0);

    setShowStuckDrawer(false);
    setShowChallengeModal(false);
    setPhase("playing");

    if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    timerIntervalRef.current = setTimeout(() => {
      triggerExplosion(activePlayerIndex);
    }, randomFuse * 1000);

    tickIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTimeRef.current) / 1000);
      setElapsedRoundSeconds(elapsed);
      if (soundEnabled) playTimerTickSound(elapsed > 20);
      buzz(10);
    }, 1000);
  };

  const handlePassBomb = () => {
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === activePlayerIndex ? { ...p, passesCount: p.passesCount + 1 } : p,
      ),
    );

    let nextIdx = activePlayerIndex;
    const n = players.length;
    for (let step = 1; step <= n; step++) {
      const candidate = (activePlayerIndex + step * passDirection + n * 10) % n;
      if (!players[candidate].isEliminated) {
        nextIdx = candidate;
        break;
      }
    }

    setActivePlayerIndex(nextIdx);

    // Update timer callback target
    if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    const elapsed = Math.floor((Date.now() - roundStartTimeRef.current) / 1000);
    const remaining = Math.max(1, fuseSecondsRef.current - elapsed);

    timerIntervalRef.current = setTimeout(() => {
      triggerExplosion(nextIdx);
    }, remaining * 1000);
  };

  const handleResolveChallenge = (victimIdx: number) => {
    setShowChallengeModal(false);
    triggerExplosion(victimIdx);
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

  const activePlayer = players[activePlayerIndex];
  const lang = matchSettings.language || "hinglish";
  const ModifierIcon = activeModifier.icon;

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
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">Pass the Bomb</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)] tabular-nums">
            R{roundNumber}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Toggle sound"
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--pink-text)] border border-[var(--separator)]">
                <Bomb className="size-3 text-[var(--pink-text)]" strokeWidth={1.5} />
                Speed Shouting Game
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Pass the Bomb!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Shout your answer, tap Pass, and hand the phone before it blows up!
              </p>
            </div>

            {/* Rules card */}
            <div
              className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-2 text-xs"
              style={{
                boxShadow: "0 0 24px -6px rgba(240, 80, 138, 0.2)",
              }}
            >
              <div className="font-bold text-[var(--gold-text)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" strokeWidth={1.5} />
                <span>Quick Rules</span>
              </div>
              <ul className="space-y-1 text-[var(--text-secondary)] text-[11px]">
                <li>• Read the category aloud when you receive the phone.</li>
                <li>• Shout a unique valid answer, tap Pass, and hand over the phone!</li>
                <li>• The fuse is secret (18-42s) — it can explode at any instant.</li>
                <li>• 3 lives each. Last student standing wins!</li>
              </ul>
            </div>

            {/* Players list */}
            <div className="rounded-[var(--radius-group)] bg-[var(--card)] p-3 border border-[var(--separator)] space-y-2">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                Players ({players.length})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-[0.5rem] bg-[var(--chip)] text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      {renderAvatar(p.avatar, "size-4 text-[var(--gold-text)]")}
                      <span className="text-[var(--text)] truncate">{p.name}</span>
                    </div>
                    {players.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => removePlayer(p.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--pink-text)] text-xs px-1"
                      >
                        <X size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add friend's name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
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

            <div className="pt-2">
              <button
                type="button"
                onClick={startRound}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="size-4 fill-current" />
                <span>Start Round 1</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE GAMEPLAY */}
        {phase === "playing" && currentItem && (
          <div className="space-y-4 select-none">
            {/* Modifier banner if active */}
            {activeModifier.id !== "none" && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand-gold)]/15 border border-[var(--brand-gold)]/30 text-[var(--gold-text)] text-xs font-bold">
                <ModifierIcon className="size-3.5" strokeWidth={1.5} />
                <span>{activeModifier.name}</span>
                {lockedLetter && (
                  <span className="underline ml-1">Starts with '{lockedLetter}'</span>
                )}
              </div>
            )}

            {/* Prompt Box */}
            <motion.div
              key={currentItem.id}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] text-center space-y-3"
              style={{
                boxShadow: "0 0 24px -6px rgba(240, 80, 138, 0.25)",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--gold-text)] flex items-center justify-center gap-1">
                <Flame className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                <span>Shout Valid Answer:</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-[var(--text)]">
                {getLocalizedText(currentItem.prompt || (currentItem as any).category, lang)}
              </h2>
              {currentItem.bannedWords && currentItem.bannedWords.length > 0 && (
                <div className="pt-2 border-t border-[var(--separator)] text-[11px] text-[var(--pink-text)] font-semibold">
                  <span>Banned: </span>
                  {currentItem.bannedWords.join(", ")}
                </div>
              )}
            </motion.div>

            {/* Active Player Card with pulsing bomb */}
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Holding the bomb right now
              </span>
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--brand-pink)]/40">
                <div className="size-10 rounded-[0.5rem] bg-[var(--chip)] grid place-items-center text-[var(--pink-text)]">
                  {renderAvatar(activePlayer.avatar, "size-5 text-current")}
                </div>
                <div className="text-left">
                  <div className="text-base font-bold text-[var(--text)]">{activePlayer.name}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`size-3.5 ${
                          i < activePlayer.lives
                            ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]"
                            : "fill-[var(--chip)] text-[var(--chip)]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Giant PASS Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePassBomb}
                className="w-full min-h-[64px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <div className="flex items-center gap-2">
                  <span>PASS BOMB!</span>
                  <ArrowRight className="size-5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] opacity-80 font-normal">
                  Say answer, tap here, hand phone!
                </span>
              </button>
            </div>

            {/* Actions: Stuck hint & Challenge */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStuckDrawer((v) => !v)}
                className="flex-1 min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text)] text-xs font-semibold border border-[var(--separator)] flex items-center justify-center gap-1.5 hover:bg-[var(--chip)]/80 cursor-pointer"
              >
                <HelpCircle className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
                <span>Stuck? Hint</span>
              </button>
              <button
                type="button"
                onClick={() => setShowChallengeModal(true)}
                className="flex-1 min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--pink-text)] text-xs font-semibold border border-[var(--separator)] flex items-center justify-center gap-1.5 hover:bg-[var(--chip)]/80 cursor-pointer"
              >
                <AlertTriangle className="size-3.5" strokeWidth={1.5} />
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
                  className="overflow-hidden p-3 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] text-xs space-y-1.5"
                >
                  <div className="font-bold text-[var(--gold-text)]">
                    Example answers (shout one of these):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentItem.examples.map((ex: any, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[var(--card)] text-[var(--text)] text-[11px]"
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
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--separator)] rounded-[var(--radius-card)] p-5 space-y-4">
                    <div className="flex items-center gap-2 text-[var(--pink-text)] font-bold">
                      <AlertTriangle className="size-5" strokeWidth={1.5} />
                      <span>Challenge / Repeat</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Did <strong className="text-[var(--text)]">{activePlayer.name}</strong> repeat
                      an answer already said or make up something invalid?
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleResolveChallenge(activePlayerIndex)}
                        className="w-full min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--brand-pink)] text-white font-bold text-xs cursor-pointer"
                      >
                        Yes, Repeated / Invalid (Lose Life)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChallengeModal(false)}
                        className="w-full min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text)] font-bold text-xs cursor-pointer"
                      >
                        False Alarm, Resume
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-1 flex-col justify-between py-4 text-center"
          >
            <div className="space-y-2">
              <div className="size-16 rounded-full bg-[var(--brand-pink)]/20 text-[var(--pink-text)] mx-auto grid place-items-center">
                <Bomb className="size-8 text-[var(--pink-text)] animate-bounce" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-bold text-[var(--pink-text)] tracking-tight">
                BOOM! IT EXPLODED!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                The bomb went off in{" "}
                <strong className="text-[var(--text)]">{activePlayer.name}</strong>'s hands!
              </p>
            </div>

            {/* Life Lost Graphic */}
            <div className="my-auto w-full p-5 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] max-w-xs mx-auto space-y-3">
              <div className="size-12 rounded-[0.75rem] bg-[var(--chip)] mx-auto grid place-items-center text-[var(--pink-text)]">
                {renderAvatar(activePlayer.avatar, "size-6 text-current")}
              </div>
              <div className="font-bold text-sm text-[var(--text)]">{activePlayer.name}</div>
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`size-5 ${
                      i < activePlayer.lives
                        ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]"
                        : "fill-[var(--chip)] text-[var(--chip)]"
                    }`}
                  />
                ))}
              </div>
              {activePlayer.isEliminated ? (
                <div className="text-xs font-bold text-[var(--pink-text)] bg-[var(--brand-pink)]/20 py-1 px-2 rounded-lg">
                  Eliminated from the game
                </div>
              ) : (
                <div className="text-xs text-[var(--text-secondary)] tabular-nums">
                  {activePlayer.lives} lives remaining
                </div>
              )}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => {
                  if (alivePlayers.length <= 1) {
                    setPhase("podium");
                    if (soundEnabled) playVictorySound();
                  } else {
                    setRoundNumber((r) => r + 1);
                    startRound();
                  }
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{alivePlayers.length <= 1 ? "View Champion" : "Next Round"}</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}

        {/* PODIUM SCREEN */}
        {phase === "podium" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                <Trophy className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                Survivor Champion!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                The only student to survive without getting blasted.
              </p>
            </div>

            {alivePlayers[0] && (
              <div
                className="my-auto w-full p-5 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-2"
                style={{
                  boxShadow: "0 0 24px -6px rgba(251, 191, 36, 0.2)",
                }}
              >
                <div className="size-12 rounded-[0.75rem] bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)]">
                  {renderAvatar(alivePlayers[0].avatar, "size-6 text-current")}
                </div>
                <div className="text-xl font-bold text-[var(--text)]">{alivePlayers[0].name}</div>
                <div className="text-xs text-[var(--gold-text)] font-semibold tabular-nums">
                  Survived with {alivePlayers[0].lives} lives • {alivePlayers[0].passesCount} passes
                  made
                </div>
              </div>
            )}

            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
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
