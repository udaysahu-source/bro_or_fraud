import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ghost,
  EyeOff,
  Users,
  Timer,
  Shield,
  Flame,
  Target,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  Lock,
  ArrowRight,
  Search,
  MessageSquare,
  Trophy,
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
import { ConfessionRouletteItem } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  hasShield: boolean;
  hasFrame: boolean;
}

interface ConfessionCard {
  id: string;
  text: string;
  isGhost: boolean;
  realAuthorId: string;
  realAuthorName: string;
  votes: Record<string, string>;
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

export function ConfessionRouletteEngine() {
  const navigate = useNavigate();
  const [matchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Setup state
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", avatar: "Smile", score: 0, hasShield: true, hasFrame: true },
    { id: "2", name: "Player 2", avatar: "Crown", score: 0, hasShield: true, hasFrame: true },
    { id: "3", name: "Player 3", avatar: "Sparkles", score: 0, hasShield: true, hasFrame: true },
    { id: "4", name: "Player 4", avatar: "Ghost", score: 0, hasShield: true, hasFrame: true },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [enableChaosPowers] = useState(true);

  // Phases
  const [phase, setPhase] = useState<
    | "setup"
    | "round-intro"
    | "handoff"
    | "submit"
    | "cards-hub"
    | "card-interrogation"
    | "card-vote"
    | "card-reveal"
    | "round-summary"
    | "podium"
  >("setup");

  // Round data
  const [currentItem, setCurrentItem] = useState<ConfessionRouletteItem | null>(null);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [currentInputText, setCurrentInputText] = useState("");
  const [confessionCards, setConfessionCards] = useState<ConfessionCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [currentVotePlayerIndex, setCurrentVotePlayerIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  // Interrogation Timer (30s)
  const [interrogationSeconds, setInterrogationSeconds] = useState(30);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lang = matchSettings.language || "hinglish";
  const currentSubmittingPlayer = players[currentVoterIndex];

  // Auto-hide when blurred or backgrounded
  useEffect(() => {
    const handleHide = () => {
      if (phase === "submit") {
        setPhase("handoff");
      }
    };
    window.addEventListener("blur", handleHide);
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      window.removeEventListener("blur", handleHide);
      document.removeEventListener("visibilitychange", handleHide);
    };
  }, [phase]);

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
        hasShield: true,
        hasFrame: true,
      },
    ]);
    setNewPlayerName("");
    buzz(15);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 3) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    buzz(15);
  };

  const startRound = () => {
    buzz(25);
    const item = getContentItem("confession-roulette") as ConfessionRouletteItem;
    setCurrentItem(item);
    setCurrentVoterIndex(0);
    setCurrentInputText("");
    setConfessionCards([]);
    setPhase("round-intro");
  };

  const startSubmissionsHandoff = () => {
    buzz(20);
    setCurrentVoterIndex(0);
    setPhase("handoff");
  };

  const handleConfessionSubmit = (isDecoyPreset = false, presetText = "") => {
    buzz(25);
    if (soundEnabled) playVoteConfirmSound();

    const textToSubmit = isDecoyPreset
      ? presetText
      : currentInputText.trim() || "I took a nap during an exam.";

    const newCard: ConfessionCard = {
      id: `c_${Date.now()}_${currentVoterIndex}`,
      text: textToSubmit,
      isGhost: false,
      realAuthorId: currentSubmittingPlayer.id,
      realAuthorName: currentSubmittingPlayer.name,
      votes: {},
    };

    const updatedCards = [...confessionCards, newCard];
    setConfessionCards(updatedCards);
    setCurrentInputText("");

    if (currentVoterIndex + 1 < players.length) {
      setCurrentVoterIndex((i) => i + 1);
      setPhase("handoff");
    } else {
      // Inject ghost AI decoy
      if (currentItem?.ghostDecoys && currentItem.ghostDecoys.length > 0) {
        const decoy =
          currentItem.ghostDecoys[Math.floor(Math.random() * currentItem.ghostDecoys.length)];
        const ghostCard: ConfessionCard = {
          id: `ghost_${Date.now()}`,
          text: getLocalizedText(decoy, lang),
          isGhost: true,
          realAuthorId: "ghost",
          realAuthorName: "Ghost Decoy",
          votes: {},
        };
        updatedCards.push(ghostCard);
      }

      // Shuffle cards so identity is hidden
      const shuffled = [...updatedCards].sort(() => Math.random() - 0.5);
      setConfessionCards(shuffled);
      setPhase("cards-hub");
    }
  };

  const startInterrogation = (cardIdx: number) => {
    buzz(25);
    setActiveCardIndex(cardIdx);
    setInterrogationSeconds(30);
    setPhase("card-interrogation");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setInterrogationSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (soundEnabled) playTimerAlarmSound();
          return 0;
        }
        if (prev <= 5) {
          buzz(15);
          if (soundEnabled) playTimerTickSound(true);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startVoting = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    buzz(20);
    setCurrentVotePlayerIndex(0);
    setPhase("card-vote");
  };

  const handleCastVote = (suspectId: string) => {
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    const voterId = players[currentVotePlayerIndex].id;
    setConfessionCards((prev) =>
      prev.map((c, idx) =>
        idx === activeCardIndex ? { ...c, votes: { ...c.votes, [voterId]: suspectId } } : c,
      ),
    );

    if (currentVotePlayerIndex + 1 < players.length) {
      setCurrentVotePlayerIndex((i) => i + 1);
    } else {
      calculateCardScores();
      setPhase("card-reveal");
    }
  };

  const calculateCardScores = () => {
    const card = confessionCards[activeCardIndex];
    if (!card) return;

    setPlayers((prev) =>
      prev.map((p) => {
        let delta = 0;
        const voterGuess = card.votes[p.id];
        if (voterGuess) {
          if (card.isGhost && voterGuess === "ghost") delta += 100;
          else if (!card.isGhost && voterGuess === card.realAuthorId) delta += 100;
        }

        // Author bonus if they fooled the room
        if (!card.isGhost && p.id === card.realAuthorId) {
          const wrongGuesses = Object.values(card.votes).filter(
            (g) => g !== card.realAuthorId,
          ).length;
          delta += wrongGuesses * 30;
        }

        return { ...p, score: p.score + delta };
      }),
    );
  };

  const handleNextCard = () => {
    if (activeCardIndex + 1 < confessionCards.length) {
      startInterrogation(activeCardIndex + 1);
    } else {
      setPhase("round-summary");
    }
  };

  const activeCard = confessionCards[activeCardIndex];
  const currentVotingPlayer = players[currentVotePlayerIndex];

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
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">
            Confession Roulette
          </span>
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                <Ghost className="size-3 text-[var(--gold-text)]" strokeWidth={1.5} />
                Hostel Anonymous Secrets
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Confession Roulette
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Submit raw confessions or decoys. Spot who in the room is guilty!
              </p>
            </div>

            {/* Rules card */}
            <div
              className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-2 text-xs"
              style={{
                boxShadow: "0 0 24px -6px rgba(167, 139, 250, 0.2)",
              }}
            >
              <div className="font-bold text-[var(--gold-text)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" strokeWidth={1.5} />
                <span>How to Play</span>
              </div>
              <ul className="space-y-1 text-[var(--text-secondary)] text-[11px]">
                <li>• Each player secretly submits a confession or selects a decoy.</li>
                <li>• The engine mixes in Ghost AI decoys.</li>
                <li>• 30s Interrogation: question suspects across the room!</li>
                <li>• Vote: Was it a friend, or was it a Ghost?</li>
              </ul>
            </div>

            {/* Players list */}
            <div className="rounded-[var(--radius-group)] bg-[var(--card)] p-3 border border-[var(--separator)] space-y-2">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                Suspects ({players.length})
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
                    {players.length > 3 && (
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
                  placeholder="Add suspect..."
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
                <Ghost className="size-4" strokeWidth={1.5} />
                <span>Start Confessions</span>
              </button>
            </div>
          </div>
        )}

        {/* ROUND INTRO */}
        {phase === "round-intro" && currentItem && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                Round {roundNumber}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                Confession Topic
              </h1>
            </div>

            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3"
              style={{
                boxShadow: "0 0 24px -6px rgba(167, 139, 250, 0.2)",
              }}
            >
              <div className="size-12 rounded-[0.75rem] bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)]">
                <MessageSquare className="size-6" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] leading-snug">
                {getLocalizedText(currentItem.prompt || (currentItem as any).topic, lang)}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Write your true story, make up a lie, or pick a ghost answer!
              </p>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={startSubmissionsHandoff}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Pass Phone to Player 1</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* HANDOFF */}
        {phase === "handoff" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--text-secondary)] border border-[var(--separator)]">
                <Lock className="size-3 text-[var(--brand-pink)]" strokeWidth={1.5} />
                Private Submission
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                Pass the phone
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Player {currentVoterIndex + 1} of {players.length}
              </p>
            </div>

            <div className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] flex flex-col items-center">
              <div className="size-20 rounded-[var(--radius-group)] bg-[var(--chip)] border border-[var(--separator)] grid place-items-center mb-3 text-[var(--gold-text)]">
                {renderAvatar(currentSubmittingPlayer.avatar, "size-10 text-current")}
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text)]">
                {currentSubmittingPlayer.name}
              </h2>
              <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[28ch]">
                Shield the screen to submit your anonymous confession or decoy.
              </p>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => {
                  buzz(20);
                  setPhase("submit");
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I Am {currentSubmittingPlayer.name} · Write</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* SUBMIT */}
        {phase === "submit" && currentItem && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{currentSubmittingPlayer.name}'s Secret</span>
                <span className="text-[var(--gold-text)]">Confidential</span>
              </div>
              <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)] font-semibold">
                {getLocalizedText(currentItem.prompt || (currentItem as any).topic, lang)}
              </div>
            </div>

            <div className="my-auto space-y-3">
              <textarea
                rows={3}
                placeholder="Type your anonymous confession here..."
                value={currentInputText}
                onChange={(e) => setCurrentInputText(e.target.value)}
                className="w-full p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)] outline-none focus:border-[var(--brand-gold)] resize-none"
              />

              {/* Decoy Presets */}
              {currentItem.decoyPresets && currentItem.decoyPresets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                    Or pick a fast decoy preset:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {currentItem.decoyPresets.map((preset: any, idx) => {
                      const text = getLocalizedText(preset, lang);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleConfessionSubmit(true, text)}
                          className="w-full p-2.5 rounded-[0.5rem] bg-[var(--chip)] text-left text-xs font-semibold text-[var(--text)] hover:bg-[var(--chip)]/80 transition-colors"
                        >
                          "{text}"
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => handleConfessionSubmit(false)}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Submit Confession & Pass</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* CARDS HUB */}
        {phase === "cards-hub" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--gold-text)] border border-[var(--separator)]">
                Anonymous Vault
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                {confessionCards.length} Confessions Locked In
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Cards are shuffled. Interrogate the room one by one!
              </p>
            </div>

            <div className="my-auto space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
              {confessionCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                      #{idx + 1}
                    </span>
                    <span className="text-[var(--text)]">Anonymous Card</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startInterrogation(idx)}
                    className="min-h-[36px] px-3 py-1 rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-xs"
                  >
                    Interrogate
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => startInterrogation(0)}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start with Card #1</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* INTERROGATION */}
        {phase === "card-interrogation" && activeCard && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>
                Card {activeCardIndex + 1} of {confessionCards.length}
              </span>
              <span className="font-mono font-bold text-[var(--gold-text)] tabular-nums flex items-center gap-1">
                <Timer className="size-3.5" strokeWidth={1.5} />
                <span>{interrogationSeconds}s</span>
              </span>
            </div>

            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3"
              style={{
                boxShadow: "0 0 24px -6px rgba(167, 139, 250, 0.2)",
              }}
            >
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider block">
                Anonymous Confession
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] leading-relaxed">
                "{activeCard.text}"
              </h2>
            </div>

            <div className="text-center text-xs text-[var(--text-secondary)]">
              Grill each other! Who in this hostel room did this, or is this a Ghost Decoy?
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={startVoting}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Cast Secret Votes</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* CARD VOTE */}
        {phase === "card-vote" && activeCard && currentVotingPlayer && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] border-b border-[var(--separator)] pb-2">
              <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                {renderAvatar(currentVotingPlayer.avatar, "size-4 text-[var(--gold-text)]")}
                <span>{currentVotingPlayer.name}'s Vote</span>
              </span>
              <span>Card #{activeCardIndex + 1}</span>
            </div>

            <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)]">
              "{activeCard.text}"
            </div>

            <div className="my-auto space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)]">
                Who confessed this?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCastVote(p.id)}
                    className="p-3 rounded-[0.75rem] bg-[var(--card)] border border-[var(--separator)] hover:bg-[var(--chip)] text-left flex items-center gap-2 text-xs font-semibold text-[var(--text)] cursor-pointer"
                  >
                    {renderAvatar(p.avatar, "size-4 text-[var(--gold-text)]")}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Ghost Decoy Button */}
              <button
                type="button"
                onClick={() => handleCastVote("ghost")}
                className="w-full p-3.5 rounded-[0.75rem] bg-[var(--chip)] border border-[var(--separator)] flex items-center justify-center gap-2 text-xs font-bold text-[var(--gold-text)] hover:bg-[var(--chip)]/80 cursor-pointer"
              >
                <Ghost className="size-4" strokeWidth={1.5} />
                <span>It's a Ghost Decoy! (Fake)</span>
              </button>
            </div>
          </div>
        )}

        {/* CARD REVEAL */}
        {phase === "card-reveal" && activeCard && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-[var(--gold-text)] tracking-wider">
                The Truth Revealed
              </span>
              <h2 className="text-2xl font-bold text-[var(--text)] mt-1">
                {activeCard.isGhost
                  ? "It Was a Ghost Decoy!"
                  : `Authored by ${activeCard.realAuthorName}!`}
              </h2>
            </div>

            <div className="my-auto space-y-3 w-full">
              <div className="p-4 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)]">
                "{activeCard.text}"
              </div>

              {/* Voting tally */}
              <div className="space-y-1.5 text-left max-h-48 overflow-y-auto pr-1">
                {Object.entries(activeCard.votes).map(([voterId, suspectId]) => {
                  const voter = players.find((p) => p.id === voterId);
                  const suspectName =
                    suspectId === "ghost"
                      ? "Ghost Decoy"
                      : players.find((p) => p.id === suspectId)?.name;
                  const isCorrect = activeCard.isGhost
                    ? suspectId === "ghost"
                    : suspectId === activeCard.realAuthorId;

                  return (
                    <div
                      key={voterId}
                      className="flex items-center justify-between p-2.5 rounded-[0.5rem] bg-[var(--chip)] text-xs font-semibold"
                    >
                      <span className="text-[var(--text-secondary)]">{voter?.name} voted for:</span>
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${isCorrect ? "text-[var(--gold-text)]" : "text-[var(--pink-text)]"}`}
                      >
                        {suspectName} {isCorrect ? <Check size={12} strokeWidth={2} /> : <X size={12} strokeWidth={2} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={handleNextCard}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {activeCardIndex + 1 < confessionCards.length
                    ? "Next Confession Card"
                    : "View Round Summary"}
                </span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* ROUND SUMMARY */}
        {phase === "round-summary" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                Round {roundNumber} Finished
              </span>
              <h2 className="text-2xl font-bold text-[var(--text)] mt-1">Scores & Standings</h2>
            </div>

            <div className="my-auto space-y-2 w-full max-h-[50dvh] overflow-y-auto pr-1">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--text-secondary)] tabular-nums">
                        #{idx + 1}
                      </span>
                      {renderAvatar(p.avatar, "size-4 text-[var(--gold-text)]")}
                      <span className="text-[var(--text)]">{p.name}</span>
                    </div>
                    <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                      {p.score} pts
                    </span>
                  </div>
                ))}
            </div>

            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setRoundNumber((r) => r + 1);
                  startRound();
                }}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Next Round</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("podium");
                  if (soundEnabled) playVictorySound();
                }}
                className="w-full min-h-[44px] rounded-[var(--radius-btn)] bg-[var(--chip)] text-xs font-semibold text-[var(--text)]"
              >
                Finish Game & See Champion
              </button>
            </div>
          </div>
        )}

        {/* PODIUM */}
        {phase === "podium" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                <Trophy className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                Hostel Sleuth Champion!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Sharpest detective at detecting confessions and decoys.
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
                        ? "bg-[var(--card)] border-[var(--brand-gold)]/50 shadow-[0_0_16px_rgba(251,191,36,0.15)]"
                        : "bg-[var(--card)] border-[var(--separator)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm text-[var(--gold-text)] font-bold tabular-nums">
                        #{idx + 1}
                      </span>
                      <div className="size-8 rounded-[0.5rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)]">
                        {renderAvatar(p.avatar, "size-4 text-current")}
                      </div>
                      <span className="text-[var(--text)]">{p.name}</span>
                    </div>
                    <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                      {p.score} pts
                    </span>
                  </div>
                ))}
            </div>

            <div className="w-full space-y-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
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
