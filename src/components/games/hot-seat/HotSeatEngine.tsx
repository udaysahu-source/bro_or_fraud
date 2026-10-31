import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  User,
  Users,
  EyeOff,
  Eye,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
  Crown,
  Award,
  ChevronRight,
  Send,
  Lock,
  ArrowRight,
  Trophy,
  X,
} from "lucide-react";
import { buzz } from "@/lib/haptics";
import {
  playTimerTickSound,
  playRoleRevealSound,
  playVictorySound,
  playVoteConfirmSound,
} from "@/lib/audio";
import { loadSettings, MatchSettings } from "@/lib/settings";
import { getContentItem, getLocalizedText } from "@/lib/games/loader";
import { HotSeatItem } from "@/lib/games/types";
import { renderAvatar } from "@/routes/play.setup";

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
}

interface Submission {
  playerId: string;
  playerName: string;
  answer: string;
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

export function HotSeatEngine() {
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
  const [seatedPlayerIndex, setSeatedPlayerIndex] = useState(0);

  // Gameplay phases
  const [phase, setPhase] = useState<
    "setup" | "round-intro" | "handoff" | "submit" | "seated-reveal" | "round-recap" | "podium"
  >("setup");

  // Round data
  const [currentItem, setCurrentItem] = useState<HotSeatItem | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [guessedAuthors, setGuessedAuthors] = useState<Record<number, string>>({});
  const [roundNumber, setRoundNumber] = useState(1);

  const lang = matchSettings.language || "hinglish";
  const seatedPlayer = players[seatedPlayerIndex];
  const submittingPlayers = players.filter((_, idx) => idx !== seatedPlayerIndex);
  const currentSubmittingPlayer = submittingPlayers[currentVoterIndex];

  // Auto-hide when blurred
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
    const item = getContentItem("hot-seat") as HotSeatItem;
    setCurrentItem(item);
    setCurrentVoterIndex(0);
    setCurrentAnswer("");
    setSubmissions([]);
    setGuessedAuthors({});
    setPhase("round-intro");
  };

  const startSubmissionsHandoff = () => {
    buzz(20);
    setCurrentVoterIndex(0);
    setPhase("handoff");
  };

  const handleSubmitAnswer = (isPreset = false, presetText = "") => {
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    const textToSave = isPreset
      ? presetText
      : currentAnswer.trim() || "Always borrowing chargers without returning them.";

    const newSub: Submission = {
      playerId: currentSubmittingPlayer.id,
      playerName: currentSubmittingPlayer.name,
      answer: textToSave,
    };

    const nextSubs = [...submissions, newSub];
    setSubmissions(nextSubs);
    setCurrentAnswer("");

    if (currentVoterIndex + 1 < submittingPlayers.length) {
      setCurrentVoterIndex((i) => i + 1);
      setPhase("handoff");
    } else {
      // Shuffle submissions so seated player cannot infer order
      const shuffled = [...nextSubs].sort(() => Math.random() - 0.5);
      setSubmissions(shuffled);
      setPhase("seated-reveal");
    }
  };

  const handleGuessAuthor = (subIdx: number, authorId: string) => {
    buzz(15);
    setGuessedAuthors((prev) => ({
      ...prev,
      [subIdx]: authorId,
    }));
  };

  const finalizeSeatedGuesses = () => {
    buzz(30);
    let correctCount = 0;
    submissions.forEach((sub, idx) => {
      if (guessedAuthors[idx] === sub.playerId) {
        correctCount++;
      }
    });

    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === seatedPlayerIndex ? { ...p, score: p.score + correctCount } : p,
      ),
    );

    if (soundEnabled) playRoleRevealSound();
    setPhase("round-recap");
  };

  const handleNextRound = () => {
    if (roundNumber >= players.length) {
      setPhase("podium");
      if (soundEnabled) playVictorySound();
    } else {
      setSeatedPlayerIndex((i) => (i + 1) % players.length);
      setRoundNumber((r) => r + 1);
      startRound();
    }
  };

  const allGuessesMade = submissions.length > 0 && submissions.every((_, i) => !!guessedAuthors[i]);

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
          <span className="text-sm font-bold tracking-tight text-[var(--text)]">The Hot Seat</span>
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
                <Flame className="size-3 text-[var(--gold-text)]" strokeWidth={1.5} />
                Hostel Roasts & Archetypes
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2">
                The Hot Seat
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                One player sits in the hot seat. The room secretly submits roasts about them!
              </p>
            </div>

            {/* Rules */}
            <div
              className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-2 text-xs"
              style={{
                boxShadow: "0 0 24px -6px rgba(251, 146, 60, 0.2)",
              }}
            >
              <div className="font-bold text-[var(--gold-text)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" strokeWidth={1.5} />
                <span>How It Works</span>
              </div>
              <ul className="space-y-1 text-[var(--text-secondary)] text-[11px]">
                <li>• One student takes the Hot Seat.</li>
                <li>• Pass the phone to each friend to submit a secret answer.</li>
                <li>• The Hot Seat player reads all answers and guesses who wrote what!</li>
                <li>• +1 Point for each correct guess. Everyone gets a turn!</li>
              </ul>
            </div>

            {/* Players */}
            <div className="rounded-[var(--radius-group)] bg-[var(--card)] p-3 border border-[var(--separator)] space-y-2">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                Room Squad ({players.length})
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
                  placeholder="Friend's name..."
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
                <Flame className="size-4" strokeWidth={1.5} />
                <span>Start The Hot Seat</span>
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
                In The Hot Seat
              </h1>
            </div>

            <div
              className="my-auto w-full p-6 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3"
              style={{
                boxShadow: "0 0 24px -6px rgba(251, 146, 60, 0.2)",
              }}
            >
              <div className="size-16 rounded-[var(--radius-group)] bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                {renderAvatar(seatedPlayer.avatar, "size-8 text-current")}
              </div>
              <h2 className="text-3xl font-bold text-[var(--text)]">{seatedPlayer.name}</h2>
              <div className="p-3 rounded-[var(--radius-group)] bg-[var(--bg)] border border-[var(--separator)] text-xs font-semibold text-[var(--gold-text)]">
                "{getLocalizedText(currentItem.prompt || (currentItem as any).question, lang)}"
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {seatedPlayer.name} will step away while the rest of the room submits answers!
              </p>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={startSubmissionsHandoff}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Pass to Friends</span>
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
                Voter {currentVoterIndex + 1} of {submittingPlayers.length}
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
                Submit your answer about {seatedPlayer.name}.
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
                <span>I Am {currentSubmittingPlayer.name} · Answer</span>
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
                <span>{currentSubmittingPlayer.name}'s Turn</span>
                <span className="text-[var(--gold-text)]">Target: {seatedPlayer.name}</span>
              </div>
              <div className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)] font-semibold">
                {getLocalizedText(currentItem.prompt || (currentItem as any).question, lang)}
              </div>
            </div>

            <div className="my-auto space-y-3">
              <textarea
                rows={3}
                placeholder={`Type your roast/answer about ${seatedPlayer.name}...`}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="w-full p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs text-[var(--text)] outline-none focus:border-[var(--brand-gold)] resize-none"
              />

              {currentItem.presetAnswers && currentItem.presetAnswers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase block">
                    Or pick a fast archetype:
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {currentItem.presetAnswers.map((preset: any, idx) => {
                      const text = getLocalizedText(preset, lang);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSubmitAnswer(true, text)}
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
                onClick={() => handleSubmitAnswer(false)}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Submit & Pass Phone</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* SEATED REVEAL & GUESSING */}
        {phase === "seated-reveal" && (
          <div className="flex flex-1 flex-col justify-between py-4">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                {seatedPlayer.name}'s Guessing Time
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                Who said what about you?
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Assign each answer to the student who wrote it.
              </p>
            </div>

            <div className="my-auto space-y-3 max-h-[50dvh] overflow-y-auto pr-1">
              {submissions.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] space-y-2 text-xs"
                >
                  <div className="font-semibold text-[var(--text)]">"{sub.answer}"</div>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--separator)]">
                    {submittingPlayers.map((p) => {
                      const isSelected = guessedAuthors[idx] === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleGuessAuthor(idx, p.id)}
                          className={`px-2.5 py-1 rounded-[0.5rem] text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            isSelected
                              ? "bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold"
                              : "bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                          }`}
                        >
                          {renderAvatar(p.avatar, "size-3 text-current")}
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                disabled={!allGuessesMade}
                onClick={finalizeSeatedGuesses}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Reveal Answers & Score</span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* ROUND RECAP */}
        {phase === "round-recap" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--gold-text)] uppercase tracking-wider">
                Results
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] mt-1">
                The Truth Unveiled!
              </h2>
            </div>

            <div className="my-auto space-y-2 w-full max-h-[50dvh] overflow-y-auto pr-1 text-left">
              {submissions.map((sub, idx) => {
                const isCorrect = guessedAuthors[idx] === sub.playerId;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-group)] bg-[var(--card)] border border-[var(--separator)] text-xs space-y-1"
                  >
                    <div className="font-semibold text-[var(--text)]">"{sub.answer}"</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)]">
                        Written by: <strong>{sub.playerName}</strong>
                      </span>
                      <span
                        className={
                          isCorrect
                            ? "text-[var(--gold-text)] font-bold"
                            : "text-[var(--pink-text)] font-semibold"
                        }
                      >
                        {isCorrect ? "Correct! (+1)" : "Missed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={handleNextRound}
                className="w-full min-h-[52px] rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-base hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {roundNumber >= players.length ? "View Final Podium" : "Next Hot Seat Player"}
                </span>
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* PODIUM */}
        {phase === "podium" && (
          <div className="flex flex-1 flex-col justify-between py-4 text-center">
            <div className="space-y-1">
              <div className="size-16 rounded-full bg-[var(--chip)] mx-auto grid place-items-center text-[var(--gold-text)] mb-2">
                <Crown className="size-8 text-[var(--gold-text)]" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
                Hot Seat Champion!
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Who knows their hostel squad best?
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
                  setSeatedPlayerIndex(0);
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
