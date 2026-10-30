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

export function HotSeatEngine() {
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
  const [seatedPlayerIndex, setSeatedPlayerIndex] = useState(0);

  // Gameplay phases: setup -> round-intro -> handoff -> submit -> seated-reveal -> seated-guessing -> round-recap -> podium
  const [phase, setPhase] = useState<
    "setup" | "round-intro" | "handoff" | "submit" | "seated-reveal" | "round-recap" | "podium"
  >("setup");

  // Round data
  const [currentItem, setCurrentItem] = useState<HotSeatItem | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [guessedAuthors, setGuessedAuthors] = useState<Record<number, string>>({}); // submissionIdx -> guessedPlayerId
  const [roundNumber, setRoundNumber] = useState(1);

  const lang = matchSettings.language || "hinglish";
  const seatedPlayer = players[seatedPlayerIndex];
  // Submitting players are all players EXCEPT the seated player
  const submittingPlayers = players.filter((_, idx) => idx !== seatedPlayerIndex);
  const currentSubmittingPlayer = submittingPlayers[currentVoterIndex];

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
    if (players.length <= 3) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    buzz(15);
  };

  // Start round
  const startRound = () => {
    const item = getContentItem<HotSeatItem>("hot-seat", {
      packId: selectedPackId === "all" ? undefined : selectedPackId,
      spiceLevel: matchSettings.contentLevel,
    });
    setCurrentItem(item);
    setSubmissions([]);
    setCurrentVoterIndex(0);
    setCurrentAnswer("");
    setGuessedAuthors({});
    setPhase("round-intro");
    buzz(25);
    if (soundEnabled) playRoleRevealSound();
  };

  // Begin submission handoffs
  const startSubmissions = () => {
    setCurrentVoterIndex(0);
    setCurrentAnswer("");
    setPhase("handoff");
    buzz(20);
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() || !currentSubmittingPlayer) return;
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    const newSubmissions = [
      ...submissions,
      {
        playerId: currentSubmittingPlayer.id,
        playerName: currentSubmittingPlayer.name,
        answer: currentAnswer.trim(),
      },
    ];
    setSubmissions(newSubmissions);
    setCurrentAnswer("");

    // Next voter or finish
    if (currentVoterIndex + 1 < submittingPlayers.length) {
      setCurrentVoterIndex((i) => i + 1);
      setPhase("handoff");
    } else {
      // Shuffle submissions so seated player doesn't know turn order!
      const shuffled = [...newSubmissions].sort(() => Math.random() - 0.5);
      setSubmissions(shuffled);
      setPhase("seated-reveal");
    }
  };

  // Guess author of a submission
  const handleGuessAuthor = (subIdx: number, playerId: string) => {
    buzz(20);
    setGuessedAuthors((prev) => ({
      ...prev,
      [subIdx]: playerId,
    }));
  };

  // Finalize round scoring
  const handleFinishGuessing = () => {
    buzz(30);
    if (soundEnabled) playRoleRevealSound();

    let seatedPointsGained = 0;
    submissions.forEach((sub, idx) => {
      const guessed = guessedAuthors[idx];
      if (guessed === sub.playerId) {
        seatedPointsGained += 1;
      }
    });

    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx === seatedPlayerIndex) {
          return { ...p, score: p.score + seatedPointsGained };
        }
        return p;
      }),
    );

    setPhase("round-recap");
  };

  // Advance to next seated player
  const handleNextRound = () => {
    const nextSeatedIdx = (seatedPlayerIndex + 1) % players.length;
    setSeatedPlayerIndex(nextSeatedIdx);
    setRoundNumber((r) => r + 1);

    // End after all players had a turn in the hot seat
    if (roundNumber >= players.length) {
      setPhase("podium");
      if (soundEnabled) playVictorySound();
    } else {
      startRound();
    }
  };

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
          <span className="text-sm font-black tracking-wide bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
            🔥 THE HOT SEAT
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

      {/* Main Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        {/* SETUP SCREEN */}
        {phase === "setup" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-red-500/20">
                🔥
              </div>
              <h1 className="text-2xl font-black">The Hot Seat</h1>
              <p className="text-xs text-slate-400">
                One player sits in the hot seat. The room secretly submits roasts and archetypes
                about them!
              </p>
            </div>

            {/* Rules */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> How it Works:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>One student takes the Hot Seat.</li>
                <li>Pass the phone privately to each friend to submit an answer.</li>
                <li>The Hot Seat player reads all answers and guesses who wrote what!</li>
                <li>+1 Point for each correct guess. Everyone gets a turn in the hot seat!</li>
              </ul>
            </div>

            {/* Players */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Room Squad ({players.length})
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
                    {players.length > 3 && (
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

              {/* Add player */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Friend's name..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={addPlayer}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>

            <button
              onClick={startRound}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 font-black text-sm tracking-wide shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-current" /> START HOT SEAT
            </button>
          </div>
        )}

        {/* ROUND INTRO SCREEN: Announce Seated Player */}
        {phase === "round-intro" && currentItem && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-6"
          >
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                Round {roundNumber} of {players.length}
              </span>
              <h1 className="text-3xl font-black text-white">In the Hot Seat:</h1>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-b from-red-500/20 to-amber-500/10 border border-red-500/30 shadow-2xl space-y-3 max-w-xs mx-auto">
              <div className="text-6xl animate-bounce">{seatedPlayer.avatar}</div>
              <div className="text-2xl font-black text-amber-300">{seatedPlayer.name}</div>
              <div className="text-xs text-slate-300 font-medium">
                Sit tight! Your friends are about to answer a prompt about you.
              </div>
            </div>

            {/* Prompt preview */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 text-center space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Question for the room:
              </div>
              <div className="text-sm font-black text-white">
                {getLocalizedText(currentItem.prompt, lang)}
              </div>
            </div>

            <button
              onClick={startSubmissions}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 font-black text-sm text-white shadow-lg shadow-red-600/30"
            >
              Hand Phone to Friends →
            </button>
          </motion.div>
        )}

        {/* PRIVACY HANDOFF */}
        {phase === "handoff" && currentSubmittingPlayer && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <EyeOff className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Confidential Handoff
              </div>
              <h2 className="text-2xl font-black text-white">Pass phone to</h2>
              <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
                <span>{currentSubmittingPlayer.avatar}</span>
                <span>{currentSubmittingPlayer.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Keep the screen hidden from <strong>{seatedPlayer.name}</strong>!
            </p>

            <button
              onClick={() => {
                buzz(20);
                setPhase("submit");
              }}
              className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all"
            >
              I Am {currentSubmittingPlayer.name} (Reveal)
            </button>
          </motion.div>
        )}

        {/* SUBMISSION SCREEN */}
        {phase === "submit" && currentItem && currentSubmittingPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
              <span className="font-semibold">{currentSubmittingPlayer.name}'s turn</span>
              <span>Hot Seat: {seatedPlayer.name}</span>
            </div>

            {/* Prompt */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-center">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Question about {seatedPlayer.name}:
              </div>
              <h3 className="text-lg font-black text-white">
                {getLocalizedText(currentItem.prompt, lang)}
              </h3>
            </div>

            {/* Choice or Input */}
            {currentItem.options && currentItem.options.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  Select an archetype / option:
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {currentItem.options.map((opt, idx) => {
                    const text = getLocalizedText(opt, lang);
                    const isSelected = currentAnswer === text;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentAnswer(text);
                          buzz(10);
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-md"
                            : "bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.07]"
                        }`}
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : currentItem.type === "rating" ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 text-center">
                  Rate from 1 to 10:
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const num = String(i + 1);
                    const isSelected = currentAnswer === num;
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setCurrentAnswer(num);
                          buzz(10);
                        }}
                        className={`py-3 rounded-xl border font-black text-sm transition-all ${
                          isSelected
                            ? "bg-amber-500 border-amber-400 text-slate-950 scale-105"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">
                  Type your answer secretly:
                </label>
                <textarea
                  rows={3}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Be creative, funny, or savage..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-40 text-white font-black text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Confidential Answer
            </button>
          </motion.div>
        )}

        {/* SEATED REVEAL & GUESSING */}
        {phase === "seated-reveal" && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                Hot Seat Guessing Time!
              </span>
              <h2 className="text-xl font-black text-white">
                {seatedPlayer.name}, who wrote what?
              </h2>
              <p className="text-xs text-slate-400">
                Tap each card and guess which friend submitted it. You score +1 per correct guess!
              </p>
            </div>

            {/* Submissions list */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {submissions.map((sub, idx) => {
                const guessedId = guessedAuthors[idx];
                const guessedPlayer = players.find((p) => p.id === guessedId);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3"
                  >
                    <div className="text-sm font-black text-white bg-white/5 p-3 rounded-xl border border-white/5">
                      "{sub.answer}"
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Guessed author:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {submittingPlayers.map((p) => {
                          const isSelected = guessedId === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleGuessAuthor(idx, p.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                isSelected
                                  ? "bg-amber-500 border-amber-400 text-slate-950 font-bold"
                                  : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              {p.avatar} {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleFinishGuessing}
              disabled={Object.keys(guessedAuthors).length < submissions.length}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-40 text-white font-black text-sm shadow-lg shadow-red-600/30"
            >
              Lock In Guesses & Reveal Truth!
            </button>
          </div>
        )}

        {/* ROUND RECAP */}
        {phase === "round-recap" && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-amber-400">Round Results!</h2>
              <p className="text-xs text-slate-400">Here's who actually wrote each answer:</p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {submissions.map((sub, idx) => {
                const guessedId = guessedAuthors[idx];
                const isCorrect = guessedId === sub.playerId;
                const actualPlayer = players.find((p) => p.id === sub.playerId);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-rose-500/10 border-rose-500/30"
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-300">"{sub.answer}"</div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Actual Author:</span>
                        <strong className="text-white">
                          {actualPlayer?.avatar} {actualPlayer?.name}
                        </strong>
                      </div>
                      <div className="font-bold">
                        {isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct! (+1)
                          </span>
                        ) : (
                          <span className="text-rose-400">Wrong guess</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleNextRound}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-sm shadow-lg shadow-red-600/30"
            >
              {roundNumber >= players.length ? "View Final Podium 🏆" : "Next Hot Seat Player →"}
            </button>
          </div>
        )}

        {/* FINAL PODIUM */}
        {phase === "podium" && (
          <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
            <div className="text-5xl">👑</div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-amber-400">Hot Seat Champion!</h1>
              <p className="text-xs text-slate-400">Who knows their hostel squad the best?</p>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2 text-left">
              {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs ${
                      idx === 0
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-white/[0.03] border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm text-amber-400">#{idx + 1}</span>
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-bold text-white text-sm">{p.name}</span>
                    </div>
                    <div className="font-black text-amber-300 text-sm">{p.score} pts</div>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
                  setRoundNumber(1);
                  setSeatedPlayerIndex(0);
                  setPhase("setup");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 font-black text-sm text-white shadow-lg"
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
