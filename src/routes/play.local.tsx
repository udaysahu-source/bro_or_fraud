import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { buzz, success as hapticSuccess, error as hapticError, reveal as hapticReveal } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, User, ShieldAlert, Sparkles, Fingerprint } from "lucide-react";
import { PACKS } from "@/lib/mcp/packs";
import { fetchCustomPacks, type CustomPack } from "@/lib/customPacks";
import { renderAvatar } from "./play.setup";

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
  chaosMode: boolean;
  selectedPacks: string[];
  categoryName: string;
  targetWord: string;
  bluffWord: string;
  fraudsIndices: number[];
  currentRound: number;
  scores: Record<string, number>;
  usedWords?: string[];
}

type Phase = "pass" | "reveal" | "discussion" | "voting" | "verdict";

const ROASTS_WIN = [
  "Bro got cooked faster than Maggi in a hostel kettle 💀",
  "Bros saw right through your bluff, clean your glasses next time 🤓",
  "You lied worse than a student claiming they read the syllabus 📚",
  "Fraud got caught red-handed. Go back to acting school 🎭",
  "Bro was shaking while bluffing. Rizz level: -100 📉",
];

const ROASTS_LOSE = [
  "Fraud escaped. Bros got played worse than a proxy attendance scam 🕵️",
  "The Fraud was literally right there and you voted for a Bro. Brain cell count: 0 🧠",
  "Bro got gaslit into thinking they were clean. Rizz Master at work 👑",
  "The Fraud is laughing all the way back to their hostel room 🏃‍♂️",
  "Bros are certified clowns. You got absolutely cooked 🤡",
];

// Generates a masked letter hint for the Fraud
function getWordHint(word: string): string {
  if (!word) return "";
  return word
    .split(" ")
    .map((w) => {
      if (w.length <= 2) return w;
      const first = w[0];
      const last = w[w.length - 1];
      const middle = "_ ".repeat(w.length - 2).trim();
      return `${first} ${middle} ${last}`;
    })
    .join("   ");
}

// Renders the secret word as a clean, highly-legible text block
function renderCleanWord(word: string, isFraud: boolean) {
  if (!word) return null;
  return (
    <div className="my-2 py-2.5 px-4 rounded-xl bg-void/80 border border-white/5 flex flex-col items-center justify-center min-h-[60px] w-full">
      <div className={`text-2xl font-black tracking-widest uppercase font-mono select-none ${
        isFraud 
          ? "text-magenta drop-shadow-[0_0_10px_rgba(255,45,85,0.4)]" 
          : "text-lime drop-shadow-[0_0_10px_rgba(255,214,0,0.4)]"
      }`}>
        {word}
      </div>
    </div>
  );
}

export function PassPhoneGame() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MatchConfig | null>(null);
  
  // Game state
  const [phase, setPhase] = useState<Phase>("pass");
  const [currentPlayer, setCurrentPlayer] = useState(0);
  
  // Hold-to-reveal (Phase 1)
  const [held, setHeld] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef<number | null>(null);
  
  // Card flip (Phase 2)
  const [cardFlipped, setCardFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  
  // Timer state (Phase 3)
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  
  // Voting state (Phase 4)
  const [selectedSuspect, setSelectedSuspect] = useState<number | null>(null);
  const [votedPlayerIndex, setVotedPlayerIndex] = useState<number | null>(null);
  const [broWon, setBroWon] = useState(false);
  const [roastCopy, setRoastCopy] = useState("");
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  
  // Physical Voting states
  const [votingCountdown, setVotingCountdown] = useState<number | null>(null);
  const [voteTallies, setVoteTallies] = useState<Record<number, number>>({});

  // Discussion Starter (Phase 3)
  const [discussionStarter, setDiscussionStarter] = useState<number | null>(null);

  // Fetch custom packs list just in case we need to roll next round
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);

  // Load config from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("bof_match_config");
    if (!raw) {
      navigate({ to: "/play/setup" });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as MatchConfig;
      if (
        !parsed ||
        !Array.isArray(parsed.players) ||
        parsed.players.length === 0 ||
        !Array.isArray(parsed.fraudsIndices)
      ) {
        sessionStorage.removeItem("bof_match_config");
        navigate({ to: "/play/setup" });
        return;
      }
      setConfig(parsed);
      setSecondsLeft(parsed.timerSeconds ?? 30);
    } catch {
      sessionStorage.removeItem("bof_match_config");
      navigate({ to: "/play/setup" });
      return;
    }

    setCustomPacks(fetchCustomPacks());
  }, []);

  // Press-and-hold progress trigger for Phase 1
  useEffect(() => {
    if (!held) {
      setHoldProgress(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / 500); // 0.5s hold time
      setHoldProgress(p);
      if (p < 1) {
        holdRef.current = requestAnimationFrame(tick);
      } else {
        buzz([40, 30, 40]);
        // Auto transition to reveal phase once hold completes
        setPhase("reveal");
        setCardFlipped(false);
        setHeld(false);
      }
    };
    holdRef.current = requestAnimationFrame(tick);
    return () => {
      if (holdRef.current) cancelAnimationFrame(holdRef.current);
    };
  }, [held]);

  // Discussion countdown timer (Phase 3)
  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        // Haptic feedback below 10s
        if (next <= 10 && next >= 0) {
          buzz(15);
        }
        if (next === 0) {
          clearInterval(interval);
          setTimerActive(false);
          // Auto go to voting when time runs out
          setPhase("voting");
          setVotingCountdown(5);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

  // Physical point vote countdown ticker
  useEffect(() => {
    if (phase === "voting" && votingCountdown !== null) {
      if (votingCountdown > 0) {
        const timer = setTimeout(() => {
          setVotingCountdown((c) => (c !== null ? c - 1 : null));
          buzz(15);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setVotingCountdown(null);
          // Initialize vote tallies to 0
          const initialTallies: Record<number, number> = {};
          players.forEach((_, idx) => {
            initialTallies[idx] = 0;
          });
          setVoteTallies(initialTallies);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, votingCountdown]);

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
  const chaosMode = config.chaosMode || false;
  const categoryName = config.categoryName || "General";
  const targetWord = config.targetWord || "Chai";
  const bluffWord = config.bluffWord || "Coffee";
  const currentRound = config.currentRound || 1;
  const scores = config.scores || {};
  const isFraud = Array.isArray(fraudsIndices) && fraudsIndices.includes(currentPlayer);

  // Trigger role reveal haptics
  const handleCardFlip = () => {
    buzz(20);
    const nextFlipped = !cardFlipped;
    setCardFlipped(nextFlipped);
    if (nextFlipped) {
      setHasRevealed(true);
    }
  };

  // Move from Card Reveal to next state
  const handleDoneReveal = () => {
    buzz(30);
    if (currentPlayer + 1 < players.length) {
      setCurrentPlayer(currentPlayer + 1);
      setPhase("pass");
      setCardFlipped(false);
      setHasRevealed(false); // Reset reveal tracker for next player
    } else {
      // Last player seen card, select a random discussion starter
      const starterIdx = Math.floor(Math.random() * players.length);
      setDiscussionStarter(starterIdx);
      setPhase("discussion");
      if (config.timerSeconds > 0) {
        setSecondsLeft(config.timerSeconds);
        setTimerActive(true);
      }
    }
  };

  // Submit Suspect Vote
  const handleConfirmVote = () => {
    // Determine which player has the highest votes from the physical tally
    let maxVotes = -1;
    let suspectedIdx = 0;
    Object.entries(voteTallies).forEach(([idxStr, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        suspectedIdx = Number(idxStr);
      }
    });

    buzz([40, 20, 60]);
    setVotedPlayerIndex(suspectedIdx);

    // Is the voted player a fraud?
    const isVotedFraud = fraudsIndices.includes(suspectedIdx);
    const win = isVotedFraud;
    setBroWon(win);

    // Pick a funny roast
    const roasts = win ? ROASTS_WIN : ROASTS_LOSE;
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
    setRoastCopy(randomRoast);

    // Calculate score changes
    const changes: Record<string, number> = {};
    players.forEach((p, idx) => {
      const isPlayerFraud = fraudsIndices.includes(idx);
      if (win) {
        // Bros win: award points to all Bros who voted correctly
        // (For simplicity in local setup: all Bros get points, Fraud gets 0)
        changes[p.name] = isPlayerFraud ? 0 : 100;
      } else {
        // Fraud escapes: Fraud gets a getaway bonus, Bros get 0
        changes[p.name] = isPlayerFraud ? 150 : 0;
      }
    });
    setScoreChanges(changes);

    // Save updated scores to config
    const updatedScores = { ...scores };
    players.forEach((p) => {
      updatedScores[p.name] = (updatedScores[p.name] || 0) + (changes[p.name] || 0);
    });

    const newConfig = { ...config, scores: updatedScores };
    setConfig(newConfig);
    sessionStorage.setItem("bof_match_config", JSON.stringify(newConfig));

    if (win) {
      hapticSuccess();
    } else {
      hapticError();
    }
    setPhase("verdict");
  };

  // Instant reveal action
  const handleInstantReveal = () => {
    buzz([40, 20, 40]);
    setBroWon(false);
    setRoastCopy("Instant reveal triggered! Here are the answers.");
    
    // Set score changes to 0 for this instant reveal
    const changes: Record<string, number> = {};
    players.forEach((p) => {
      changes[p.name] = 0;
    });
    setScoreChanges(changes);
    setPhase("verdict");
  };

  // Start Next Round with same settings but fresh words & roles
  const handleNextRound = () => {
    buzz(30);

    // Determine packs to choose words from
    const packsToUse: { id: string; title: string; words: string[] }[] = [];
    config.selectedPacks.forEach((packId) => {
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

    let newCategory = categoryName;
    let newTarget = "Chai";
    let newBluff = "Coffee";
    const usedWords = config.usedWords || [];

    if (packsToUse.length === 1) {
      newCategory = packsToUse[0].title;
      let availableWords = packsToUse[0].words.filter((w) => !usedWords.includes(w));
      if (availableWords.length === 0) {
        availableWords = packsToUse[0].words;
        usedWords.splice(0, usedWords.length);
      }
      newTarget = availableWords[Math.floor(Math.random() * availableWords.length)] || "Chai";
      
      // Pick decoy word from a different pack
      const otherPacks = PACKS.filter((p) => p.id !== packsToUse[0].id);
      const randomOtherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
      newBluff = randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";
    } else if (packsToUse.length >= 2) {
      newCategory = `${packsToUse[0].title} + ${packsToUse[1].title}`;
      // Flatten all selected words for availability
      const allSelectedWords: string[] = [];
      packsToUse.forEach((pack) => allSelectedWords.push(...pack.words));
      
      let availableWords = allSelectedWords.filter((w) => !usedWords.includes(w));
      if (availableWords.length === 0) {
        availableWords = allSelectedWords;
        usedWords.splice(0, usedWords.length);
      }
      newTarget = availableWords[Math.floor(Math.random() * availableWords.length)] || "Chai";
      
      // Pick decoy word from a different pack (not selected)
      const selectedIds = packsToUse.map((p) => p.id);
      const otherPacks = PACKS.filter((p) => !selectedIds.includes(p.id));
      const randomOtherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
      newBluff = randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";
    }

    const updatedUsedWords = [...usedWords, newTarget];

    // Shuffle roles using Fisher-Yates
    const indices = Array.from({ length: players.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newFrauds = indices.slice(0, config.impostorsCount);

    const newConfig: MatchConfig = {
      ...config,
      categoryName: newCategory,
      targetWord: newTarget,
      bluffWord: newBluff,
      fraudsIndices: newFrauds,
      currentRound: currentRound + 1,
      usedWords: updatedUsedWords,
    };

    setConfig(newConfig);
    sessionStorage.setItem("bof_match_config", JSON.stringify(newConfig));

    // Reset loop state
    setPhase("pass");
    setCurrentPlayer(0);
    setCardFlipped(false);
    setHasRevealed(false); // Reset reveal tracker
    setSelectedSuspect(null);
    setVotedPlayerIndex(null);
    setSecondsLeft(config.timerSeconds);
    setTimerActive(false);
    setDiscussionStarter(null);
  };

  const currentSecondsFormatted = `0:${secondsLeft.toString().padStart(2, "0")}`;
  const timerWarn = secondsLeft <= 10;
  const timerPct = config.timerSeconds > 0 ? (secondsLeft / config.timerSeconds) * 100 : 100;

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-8">
        
        {/* Navigation / Round Info Header */}
        <header className="flex items-center justify-between">
          <Link
            to="/play/setup"
            onClick={() => buzz(20)}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"
          >
            ← Quit
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Round {currentRound} · Local
          </span>
        </header>

        {/* STATE MACHINE LAYOUTS */}
        
        {/* PHASE 1: PASS SCREEN */}
        {phase === "pass" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta animate-pulse">
              [ SECURE HANDOFF ]
            </span>
            <h1 className="mt-8 text-5xl font-black uppercase leading-[0.9]">
              Pass Phone to<br />
              <span className="text-lime text-glitch inline-flex items-center gap-2 mt-2">
                {renderAvatar(players[currentPlayer].emoji, "size-10 text-lime")} {players[currentPlayer].name}
              </span>
            </h1>
            <p className="mt-6 text-sm text-muted-foreground max-w-[28ch]">
              Hide the screen and pass it over. No peeking, or you are certified sus.
            </p>

            <div className="mt-12 grid size-40 place-items-center rounded-full border-2 border-dashed border-white/15 bg-surface/5 animate-scan overflow-hidden relative">
              <span className="text-7xl">👀</span>
              <div className="absolute inset-x-0 h-0.5 bg-magenta/60 top-1/2 shadow-[0_0_10px_2px_var(--color-magenta)]" />
            </div>

            <div className="flex-1" />

            {/* Hold to Confirm Player */}
            <button
              onPointerDown={() => { setHeld(true); buzz(15); }}
              onPointerUp={() => setHeld(false)}
              onPointerLeave={() => setHeld(false)}
              onPointerCancel={() => setHeld(false)}
              className="relative w-full overflow-hidden rounded-2xl border-2 border-white/15 bg-surface px-6 py-5 text-lg font-black uppercase tracking-wide backdrop-blur-md active:scale-98 transition-all duration-100 touch-none"
            >
              <div
                className="absolute inset-y-0 left-0 bg-lime/25 transition-[width] duration-75"
                style={{ width: `${holdProgress * 100}%` }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {held ? "Checking..." : `I am ${players[currentPlayer].name} (Hold)`}
              </span>
            </button>
          </div>
        )}

        {/* PHASE 2: REVEAL CARD */}
        {phase === "reveal" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
              [ ROLE VERIFICATION ]
            </span>
            
            <div
              className="relative mx-auto mt-6 w-72 h-[390px] cursor-pointer"
              style={{ perspective: 1000 }}
              onClick={handleCardFlip}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: cardFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Card Front (Step 1) */}
                <div
                  className="absolute inset-0 backface-hidden bg-[#12121A] border-2 border-white/10 rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-[0_0_20px_rgba(255,255,255,0.03)] hover:border-white/20 transition-colors"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <HelpCircle size={48} className="text-muted-foreground/30 animate-pulse" />
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Tap to Reveal</p>
                  <h2 className="mt-1 text-3xl font-title uppercase tracking-widest text-foreground">SECRET ROLE</h2>
                  <div className="absolute bottom-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/45">
                    PASS PHONE SECURELY
                  </div>
                </div>

                {/* Card Back (Step 3 & 4) */}
                <div
                  className={`absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col items-center justify-between text-center border-2 bg-gradient-to-b from-[#12121A] ${
                    isFraud
                      ? "to-[#1E1218] border-magenta/75 shadow-[0_0_25px_rgba(255,45,85,0.22)]"
                      : "to-[#181812] border-lime/75 shadow-[0_0_25px_rgba(255,214,0,0.22)]"
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>TOPIC</span>
                    <span className={isFraud ? "text-magenta font-black" : "text-lime font-black"}>{categoryName}</span>
                  </div>

                  <div className="my-auto text-center flex flex-col items-center">
                    <div className={`p-4.5 rounded-full border-2 mb-3 bg-surface shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${
                      isFraud
                        ? "border-magenta/40 text-magenta bg-magenta/5 shadow-[0_0_15px_rgba(255,45,85,0.12)] animate-pulse"
                        : "border-lime/40 text-lime bg-lime/5 shadow-[0_0_15px_rgba(255,214,0,0.12)]"
                    }`}>
                      {isFraud ? <ShieldAlert size={36} /> : <User size={36} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                      YOU ARE THE
                    </span>
                    <h2 className={`text-4xl font-black uppercase tracking-wide mt-1.5 font-title ${
                      isFraud
                        ? "text-magenta drop-shadow-[0_2px_10px_rgba(255,45,85,0.45)]"
                        : "text-lime drop-shadow-[0_2px_10px_rgba(255,214,0,0.45)]"
                    }`}>
                      {isFraud ? "FRAUD!" : "BRO!"}
                    </h2>
                  </div>

                  <div className={`w-full rounded-2xl p-4 border bg-surface/90 flex flex-col justify-center items-center ${
                    isFraud ? "border-magenta/30 shadow-[0_0_15px_rgba(255,45,85,0.05)]" : "border-lime/30 shadow-[0_0_15px_rgba(255,214,0,0.05)]"
                  }`}>
                    <div className="w-full text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                        {isFraud ? "Your Decoy Word" : "Secret Word"}
                      </span>
                      
                      {renderCleanWord(isFraud ? bluffWord : targetWord, isFraud)}

                      {isFraud ? (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-magenta/90 leading-tight">
                          Try to blend in with this word!
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-lime/90 leading-tight flex items-center justify-center gap-1">
                          <Sparkles size={10} className="inline shrink-0" /> DO NOT SHOW OTHERS <Sparkles size={10} className="inline shrink-0" />
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {cardFlipped ? "Tap card again to hide, or proceed below" : "Tap card to flip it and read your secret role"}
            </p>

            <div className="flex-1" />

            <button
              disabled={!hasRevealed}
              onClick={handleDoneReveal}
              className="w-full rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-30 disabled:pointer-events-none"
            >
              {currentPlayer + 1 < players.length ? "Hide & Next Player →" : "Start Discussion 💬"}
            </button>
          </div>
        )}

        {/* PHASE 3: DISCUSSION & TIMER */}
        {phase === "discussion" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lime animate-pulse">
              [ INTERROGATION PHASE ]
            </span>
            
            <h1 className="mt-6 text-4xl font-black uppercase leading-[0.9]">
              Let the<br />
              <span className="text-magenta">Roasting</span> Begin!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-[28ch]">
              Take turns giving one-word clues about the secret. Detect who is bluffing.
            </p>

            {discussionStarter !== null && (
              <div className="mt-6 w-full rounded-2xl border-2 border-magenta bg-magenta/10 p-4 brutal-shadow-pink animate-[bounce_2s_infinite]">
                <span className="text-[9px] font-black uppercase tracking-widest text-magenta block">
                  📢 Discussion Starter
                </span>
                <p className="mt-1 text-lg font-black uppercase text-foreground flex items-center justify-center gap-2">
                  {renderAvatar(players[discussionStarter].emoji, "size-6 text-magenta")} {players[discussionStarter].name} starts!
                </p>
              </div>
            )}

            {/* Countdown Clock */}
            {config.timerSeconds > 0 ? (
              <div className="mt-8 w-full rounded-2xl border-2 border-white/10 bg-surface p-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Time Remaining
                  </span>
                  <span className={`font-display text-4xl font-black tabular-nums ${
                    timerWarn ? "text-magenta animate-timer-warn" : "text-lime"
                  }`}>
                    {currentSecondsFormatted}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-void border border-white/5">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      secondsLeft > 15 ? "bg-lime" : secondsLeft > 5 ? "bg-yellow-400" : "bg-magenta"
                    }`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border-2 border-white/10 bg-surface px-6 py-5">
                <span className="text-5xl">💬</span>
                <div className="mt-2 text-sm font-black uppercase tracking-widest text-lime">
                  No Time Limit
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Discuss and debate until you are ready to vote.
                </p>
              </div>
            )}

            {/* Quick Player References */}
            <div className="mt-6 w-full text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Active Players:
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {players.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-surface/50 border border-white/5 px-3 py-2 text-xs">
                    {renderAvatar(p.emoji, "size-4 text-lime")}
                    <span className="font-bold uppercase truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => { buzz(25); setTimerActive(false); setPhase("voting"); setVotingCountdown(5); }}
              className="w-full rounded-xl bg-magenta px-6 py-5 text-lg font-black uppercase tracking-wide text-white border-2 border-void brutal-shadow-white tactile tactile-press"
            >
              Vote the Fraud Now →
            </button>
          </div>
        )}

        {phase === "voting" && votingCountdown !== null && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta animate-pulse">
              [ PHYSICAL POINT VOTE ]
            </span>
            
            <h1 className="mt-6 text-4xl font-black uppercase leading-none text-off-white">
              Get Ready to Point! 👆
            </h1>
            <p className="mt-3 text-xs text-muted-foreground max-w-[28ch] mx-auto leading-relaxed">
              On ZERO, everyone points to the person they want to vote out simultaneously!
            </p>

            <div className="my-12 flex items-center justify-center min-h-[140px]">
              <motion.div
                key={votingCountdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                className={`font-display text-8xl font-black ${
                  votingCountdown === 0 ? "text-magenta scale-150 animate-bounce" : "text-lime"
                }`}
              >
                {votingCountdown === 0 ? "POINT! 👉" : votingCountdown}
              </motion.div>
            </div>

            <button
              onClick={() => setVotingCountdown(null)}
              className="px-4 py-2 border border-white/10 rounded-xl bg-surface/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-white"
            >
              Skip Countdown ⏩
            </button>
          </div>
        )}

        {phase === "voting" && votingCountdown === null && (
          <div className="flex flex-1 flex-col">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta">
                [ VOTE COUNT TALLY ]
              </span>
              <h1 className="mt-3 text-3xl font-black uppercase leading-[0.9] text-off-white">
                Input Vote Tallies 📊
              </h1>
              <p className="mt-2 text-xs text-muted-foreground max-w-[30ch] mx-auto">
                Enter the number of physical points/votes received by each player.
              </p>
            </div>

            {/* Grid of Players with tally counter controls */}
            <div className="mt-6 space-y-3 max-h-80 overflow-y-auto pr-1">
              {players.map((p, idx) => {
                const currentTally = voteTallies[idx] || 0;
                // Calculate if they have the most votes (excluding 0)
                const maxTally = Math.max(...Object.values(voteTallies));
                const isLeader = currentTally > 0 && currentTally === maxTally;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-2xl border-2 p-4 bg-surface transition-all duration-200 ${
                      isLeader ? "border-magenta bg-magenta/5 shadow-[0_0_15px_rgba(255,45,85,0.1)]" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {renderAvatar(p.emoji, "size-10 text-magenta shrink-0")}
                      <div>
                        <div className="text-base font-black uppercase text-off-white">{p.name}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          {isLeader ? "🔥 MOST SUSPECTED" : `Player ${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    {/* Tally Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          buzz(10);
                          setVoteTallies((prev) => ({
                            ...prev,
                            [idx]: Math.max(0, (prev[idx] || 0) - 1),
                          }));
                        }}
                        className="size-8 rounded-lg border border-white/10 bg-void text-off-white text-lg font-black hover:border-magenta active:scale-95 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-lg font-black text-lime font-mono">
                        {currentTally}
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
                        className="size-8 rounded-lg border border-white/10 bg-void text-off-white text-lg font-black hover:border-lime active:scale-95 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex-1" />

            {/* Confirm Votes button */}
            <button
              onClick={handleConfirmVote}
              className="w-full rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press"
            >
              Submit Votes & Reveal Verdict →
            </button>
          </div>
        )}

        {/* PHASE 5: VERDICT & SCOREBOARD (Step 5 Score Reveal) */}
        {phase === "verdict" && (
          <div className="flex flex-1 flex-col items-center justify-between text-center animate-[fade-in_0.3s_ease-out_both]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <img
                src="/split-mask.png"
                alt="Dual Mask"
                className="size-24 rounded-2xl brutal-shadow-pink mb-3"
              />

              <p className="text-cyber-yellow text-2xl uppercase font-title tracking-wider">
                {broWon ? "Good Call, Bro!" : "Fraud Escaped!"}
              </p>

              <h1 className="mt-1 text-5xl font-title uppercase tracking-tight text-off-white drop-shadow-md">
                {broWon ? "+ 100 XP" : "+ 150 XP"}
              </h1>

              <p className="mt-2 text-xs text-muted-foreground max-w-[28ch] italic">
                "{roastCopy}"
              </p>

              {/* Secret Words & Identity Summary */}
              <div className="mt-4 w-full rounded-2xl border-2 border-border bg-surface p-4 text-left">
                <div className="grid grid-cols-2 gap-2 mb-3 border-b border-white/10 pb-3">
                  <div className="rounded-xl bg-void border border-white/5 p-2.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                      Secret Word
                    </span>
                    <span className="text-base font-title uppercase text-lime">
                      {targetWord}
                    </span>
                  </div>
                  <div className="rounded-xl bg-void border border-white/5 p-2.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                      Actual Fraud
                    </span>
                    <span className="text-base font-title uppercase text-magenta">
                      {fraudsIndices.map((i) => players[i]?.name).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Leaderboard Roster */}
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                  Session Scores
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {players.map((p, idx) => {
                    const isPlayerFraud = fraudsIndices.includes(idx);
                    const gained = scoreChanges[p.name] || 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-void px-3 py-2 border border-white/5 text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          {renderAvatar(p.emoji, "size-4 text-lime")}
                          <span className="uppercase text-off-white">{p.name}</span>
                          {isPlayerFraud && (
                            <span className="text-[8px] font-black bg-magenta/20 text-magenta px-1.5 py-0.5 rounded uppercase">
                              FRAUD
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {gained > 0 && (
                            <span className="text-lime text-[11px] font-black">+{gained}</span>
                          )}
                          <span className="font-mono text-off-white">{scores[p.name] || 0} pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <div className="w-full mt-6 space-y-2">
              <button
                onClick={handleNextRound}
                className="w-full bg-electric-pink text-off-white px-8 py-4 rounded-full text-xl font-title uppercase tracking-wider border-2 border-void brutal-shadow-white active:scale-95 transition-transform"
              >
                Next Round →
              </button>
              
              <Link
                to="/play/setup"
                onClick={() => buzz(20)}
                className="block w-full rounded-xl bg-void border-2 border-white/10 px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-muted-foreground tactile tactile-press"
              >
                Quit to Setup Menu
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
