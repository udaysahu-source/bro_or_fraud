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
import { getContent } from "@/lib/games/loader";
import { ConfessionRouletteItem } from "@/lib/games/types";

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
  votes: Record<string, string>; // voterId -> guessedPlayerId or 'ghost'
}

export function ConfessionRouletteEngine() {
  const navigate = useNavigate();
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(loadSettings());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Setup state
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Player 1", avatar: "😎", score: 0, hasShield: true, hasFrame: true },
    { id: "2", name: "Player 2", avatar: "🤠", score: 0, hasShield: true, hasFrame: true },
    { id: "3", name: "Player 3", avatar: "🤓", score: 0, hasShield: true, hasFrame: true },
    { id: "4", name: "Player 4", avatar: "👻", score: 0, hasShield: true, hasFrame: true },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string>("all");
  const [enableChaosPowers, setEnableChaosPowers] = useState(true);

  // Phases: setup -> round-intro -> handoff -> submit -> cards-hub -> card-interrogation -> card-vote -> card-reveal -> round-summary -> podium
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
  const [currentVoteSelection, setCurrentVoteSelection] = useState<string>("");
  const [currentVotePlayerIndex, setCurrentVotePlayerIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  // Interrogation Timer (30s)
  const [interrogationSeconds, setInterrogationSeconds] = useState(30);
  const timerIntervalRef = useRef<any>(null);

  const lang = matchSettings.language || "hinglish";
  const currentSubmittingPlayer = players[currentVoterIndex];

  // Add / Remove players
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

  // Start round
  const startRound = () => {
    const item = getContent<ConfessionRouletteItem>("confession-roulette", {
      packId: selectedPackId === "all" ? undefined : selectedPackId,
      spiceLevel: matchSettings.contentLevel,
    });
    setCurrentItem(item);
    setConfessionCards([]);
    setCurrentVoterIndex(0);
    setCurrentInputText("");
    setActiveCardIndex(0);
    setPhase("round-intro");
    buzz(25);
    if (soundEnabled) playRoleRevealSound();
  };

  // Begin submission handoffs
  const startSubmissions = () => {
    setCurrentVoterIndex(0);
    setCurrentInputText("");
    setPhase("handoff");
    buzz(20);
  };

  // Submit confession
  const handleSubmitConfession = (text: string) => {
    if (!text.trim() || !currentSubmittingPlayer) return;
    buzz(20);
    if (soundEnabled) playVoteConfirmSound();

    const newCards: ConfessionCard[] = [
      ...confessionCards,
      {
        id: `conf-${Date.now()}-${currentSubmittingPlayer.id}`,
        text: text.trim(),
        isGhost: false,
        realAuthorId: currentSubmittingPlayer.id,
        realAuthorName: currentSubmittingPlayer.name,
        votes: {},
      },
    ];
    setConfessionCards(newCards);
    setCurrentInputText("");

    if (currentVoterIndex + 1 < players.length) {
      setCurrentVoterIndex((i) => i + 1);
      setPhase("handoff");
    } else {
      // All players submitted! Now inject 1 or 2 Ghost Decoy answers from currentItem
      const finalCards = [...newCards];
      if (currentItem && currentItem.ghostAnswers && currentItem.ghostAnswers.length > 0) {
        const decoysCount = Math.min(2, currentItem.ghostAnswers.length);
        const shuffledDecoys = [...currentItem.ghostAnswers]
          .sort(() => Math.random() - 0.5)
          .slice(0, decoysCount);
        shuffledDecoys.forEach((decoy, i) => {
          finalCards.push({
            id: `ghost-${Date.now()}-${i}`,
            text: decoy[lang] || decoy.hinglish,
            isGhost: true,
            realAuthorId: "ghost",
            realAuthorName: "Ghost Decoy 👻",
            votes: {},
          });
        });
      }

      // Shuffle order completely so no one can deduce who submitted when
      finalCards.sort(() => Math.random() - 0.5);
      setConfessionCards(finalCards);
      setActiveCardIndex(0);
      setPhase("cards-hub");
    }
  };

  // Interrogation Timer
  const startInterrogation = (cardIdx: number) => {
    setActiveCardIndex(cardIdx);
    setInterrogationSeconds(30);
    setPhase("card-interrogation");
    buzz(20);
    if (soundEnabled) playTimerTickSound();
  };

  useEffect(() => {
    if (phase !== "card-interrogation") {
      clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setInterrogationSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (soundEnabled) playTimerAlarmSound();
          buzz([100, 50, 100]);
          return 0;
        }
        if (prev <= 6 && soundEnabled) {
          playTimerTickSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [phase, soundEnabled]);

  // Start voting for this card
  const startVoting = () => {
    setCurrentVotePlayerIndex(0);
    setCurrentVoteSelection("");
    setPhase("card-vote");
    buzz(20);
  };

  // Cast vote for card
  const handleCastVote = (suspectId: string) => {
    const voter = players[currentVotePlayerIndex];
    const card = confessionCards[activeCardIndex];
    if (!voter || !card) return;

    buzz(15);
    if (soundEnabled) playVoteConfirmSound();

    const updatedCard = {
      ...card,
      votes: {
        ...card.votes,
        [voter.id]: suspectId,
      },
    };

    const newCards = confessionCards.map((c, i) => (i === activeCardIndex ? updatedCard : c));
    setConfessionCards(newCards);

    if (currentVotePlayerIndex + 1 < players.length) {
      setCurrentVotePlayerIndex((i) => i + 1);
      setCurrentVoteSelection("");
    } else {
      // All players voted on this card! Reveal the truth!
      buzz(30);
      if (soundEnabled) playRoleRevealSound();
      setPhase("card-reveal");
    }
  };

  // Move to next card or finish round
  const handleNextCard = () => {
    if (activeCardIndex + 1 < confessionCards.length) {
      startInterrogation(activeCardIndex + 1);
    } else {
      // Calculate scores for round
      const scoreDeltas: Record<string, number> = {};
      players.forEach((p) => (scoreDeltas[p.id] = 0));

      confessionCards.forEach((card) => {
        const correctTarget = card.isGhost ? "ghost" : card.realAuthorId;
        let correctGuesses = 0;

        Object.entries(card.votes).forEach(([voterId, guessedId]) => {
          if (guessedId === correctTarget) {
            scoreDeltas[voterId] = (scoreDeltas[voterId] || 0) + 1;
            correctGuesses++;
          }
        });

        // If it was a real player and NO ONE caught them, author gets +2 bluff bonus!
        if (!card.isGhost && correctGuesses === 0) {
          scoreDeltas[card.realAuthorId] = (scoreDeltas[card.realAuthorId] || 0) + 2;
        }
      });

      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          score: p.score + (scoreDeltas[p.id] || 0),
        })),
      );

      setPhase("round-summary");
    }
  };

  const activeCard = confessionCards[activeCardIndex];
  const currentVotingPlayer = players[currentVotePlayerIndex];

  return (
    <div className="min-h-screen bg-[#0D0D12] text-slate-100 flex flex-col justify-between selection:bg-purple-500/30">
      {/* Top Bar */}
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 bg-[#0D0D12]/80">
        <Link
          to="/"
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          ← Hub
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-wide bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            👻 CONFESSION ROULETTE
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
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                👻
              </div>
              <h1 className="text-2xl font-black">Confession Roulette</h1>
              <p className="text-xs text-slate-400">
                Submit raw confessions or fake decoys. The engine injects ghost decoys. Can you spot
                who's bluffing?
              </p>
            </div>

            {/* How to play */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Game Rules:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Each player submits a confession or picks a fake decoy.</li>
                <li>The engine secretly mixes in Ghost AI decoys 👻.</li>
                <li>30s Interrogation: question suspects across the room!</li>
                <li>Vote: Was it a friend, or was it a Ghost?</li>
              </ul>
            </div>

            {/* Squad */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Suspects Squad ({players.length})
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
                  placeholder="Add suspect..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm tracking-wide shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Ghost className="w-4 h-4 fill-current" /> START CONFESSIONS
            </button>
          </div>
        )}

        {/* ROUND INTRO */}
        {phase === "round-intro" && currentItem && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-6"
          >
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">
                Round {roundNumber}
              </span>
              <h1 className="text-2xl font-black text-white">Spicy Confession Topic:</h1>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-600/20 to-pink-600/10 border border-purple-500/30 shadow-2xl space-y-3">
              <div className="text-5xl">🤫</div>
              <h2 className="text-xl font-black text-white leading-snug">
                {currentItem.topic[lang] || currentItem.topic.hinglish}
              </h2>
              <p className="text-xs text-slate-300">
                You can write your true story, make up an insane lie, or pick a ghost answer!
              </p>
            </div>

            <button
              onClick={startSubmissions}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm text-white shadow-lg"
            >
              Start Confidential Submissions →
            </button>
          </motion.div>
        )}

        {/* HANDOFF SCREEN */}
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
                Secret Handoff
              </div>
              <h2 className="text-2xl font-black text-white">Pass phone to</h2>
              <div className="text-3xl font-black text-purple-400 flex items-center justify-center gap-2">
                <span>{currentSubmittingPlayer.avatar}</span>
                <span>{currentSubmittingPlayer.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Make sure no other eyes are watching the screen!
            </p>

            <button
              onClick={() => {
                buzz(20);
                setPhase("submit");
              }}
              className="w-full py-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-sm transition-all"
            >
              I Am {currentSubmittingPlayer.name} (Open)
            </button>
          </motion.div>
        )}

        {/* SUBMISSION SCREEN */}
        {phase === "submit" && currentItem && currentSubmittingPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
              <span className="font-semibold">{currentSubmittingPlayer.name}'s confession</span>
              <span>Keep it secret!</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1 text-center">
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                Topic:
              </div>
              <h3 className="text-sm font-black text-white">
                {currentItem.topic[lang] || currentItem.topic.hinglish}
              </h3>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Write your confession or wild lie:
              </label>
              <textarea
                rows={3}
                value={currentInputText}
                onChange={(e) => setCurrentInputText(e.target.value)}
                placeholder="Share the embarrassing truth or bluff your squad..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <button
                onClick={() => handleSubmitConfession(currentInputText)}
                disabled={!currentInputText.trim()}
                className="w-full py-3 rounded-xl bg-purple-600 disabled:opacity-40 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Written Confession
              </button>
            </div>

            {/* Or Quick Pick from Ghost Decoys */}
            {currentItem.ghostAnswers && currentItem.ghostAnswers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Or pick a pre-made decoy:
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {currentItem.ghostAnswers.map((ghost, i) => {
                    const text = ghost[lang] || ghost.hinglish;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSubmitConfession(text)}
                        className="w-full p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left text-xs text-slate-300 transition-colors"
                      >
                        "{text}"
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CARDS HUB: Overview of all cards */}
        {phase === "cards-hub" && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">
                All Confessions Loaded
              </span>
              <h2 className="text-2xl font-black text-white">The Roulette Wheel</h2>
              <p className="text-xs text-slate-400">
                {confessionCards.length} confessions submitted (including Ghost decoys). Let's
                investigate each one!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              {confessionCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl">🃏</span>
                  <span className="text-xs font-black text-white">Card #{idx + 1}</span>
                  <span className="text-[10px] text-purple-400 uppercase font-semibold">
                    Unrevealed
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => startInterrogation(0)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm text-white shadow-lg shadow-purple-600/30"
            >
              Start Interrogation with Card #1 🕵️‍♂️
            </button>
          </div>
        )}

        {/* INTERROGATION SCREEN */}
        {phase === "card-interrogation" && activeCard && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Card {activeCardIndex + 1} of {confessionCards.length}
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                <Timer className="w-3.5 h-3.5" />
                <span>{interrogationSeconds}s</span>
              </div>
            </div>

            {/* Big Confession Card */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-purple-900/30 via-white/[0.05] to-transparent border border-purple-500/30 shadow-2xl text-center space-y-4"
            >
              <div className="text-4xl">🃏</div>
              <div className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">
                Anonymous Confession:
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                "{activeCard.text}"
              </h2>
            </motion.div>

            <div className="text-center text-xs text-slate-400">
              🗣️ Grill each other! Who in this hostel room did this, or is this a complete Ghost
              Decoy?
            </div>

            <button
              onClick={startVoting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm text-white shadow-lg"
            >
              Done Interrogating → Cast Secret Votes!
            </button>
          </div>
        )}

        {/* VOTING SCREEN */}
        {phase === "card-vote" && activeCard && currentVotingPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                {currentVotingPlayer.avatar} {currentVotingPlayer.name}'s Vote
              </span>
              <span>Card #{activeCardIndex + 1}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300">
              "{activeCard.text}"
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400">Who confessed this?</div>
              <div className="grid grid-cols-2 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCastVote(p.id)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-2 text-xs font-semibold text-white transition-all active:scale-95"
                  >
                    <span className="text-lg">{p.avatar}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Ghost Decoy Button */}
              <button
                onClick={() => handleCastVote("ghost")}
                className="w-full p-3.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center gap-2 text-xs font-black text-purple-300 transition-all active:scale-95"
              >
                <span>👻</span>
                <span>It's a Ghost Decoy! (Fake)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* CARD REVEAL */}
        {phase === "card-reveal" && activeCard && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 py-4"
          >
            <div className="space-y-1">
              <div className="text-xs uppercase font-extrabold text-purple-400 tracking-widest">
                The Truth Revealed!
              </div>
              <h2 className="text-2xl font-black text-white">
                {activeCard.isGhost
                  ? "It Was a Ghost Decoy! 👻"
                  : `Authored by ${activeCard.realAuthorName}!`}
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
              "{activeCard.text}"
            </div>

            {/* Voting tally */}
            <div className="space-y-2 text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                How students voted:
              </div>
              {Object.entries(activeCard.votes).map(([voterId, suspectId]) => {
                const voter = players.find((p) => p.id === voterId);
                const suspectName =
                  suspectId === "ghost"
                    ? "Ghost 👻"
                    : players.find((p) => p.id === suspectId)?.name;
                const isCorrect = activeCard.isGhost
                  ? suspectId === "ghost"
                  : suspectId === activeCard.realAuthorId;

                return (
                  <div
                    key={voterId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                  >
                    <span>{voter?.name} voted for:</span>
                    <span
                      className={`font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {suspectName} {isCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleNextCard}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm text-white shadow-lg"
            >
              {activeCardIndex + 1 < confessionCards.length
                ? "Next Confession Card →"
                : "View Round Summary 📊"}
            </button>
          </motion.div>
        )}

        {/* ROUND SUMMARY */}
        {phase === "round-summary" && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-purple-400">Round {roundNumber} Scores!</h2>
              <p className="text-xs text-slate-400">Updated leaderboard standings:</p>
            </div>

            <div className="space-y-2">
              {players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-500">#{idx + 1}</span>
                      <span className="text-lg">{p.avatar}</span>
                      <span className="font-bold text-white">{p.name}</span>
                    </div>
                    <span className="font-black text-purple-300 text-sm">{p.score} pts</span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setRoundNumber((r) => r + 1);
                  startRound();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-lg"
              >
                Start Round {roundNumber + 1} →
              </button>
              <button
                onClick={() => {
                  setPhase("podium");
                  if (soundEnabled) playVictorySound();
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold"
              >
                Finish & Show Final Champion
              </button>
            </div>
          </div>
        )}

        {/* FINAL PODIUM */}
        {phase === "podium" && (
          <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
            <div className="text-5xl">🏆</div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-purple-400">Master of Deception!</h1>
              <p className="text-xs text-slate-400">
                Best intuition and deepest bluff in the hostel!
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
                        ? "bg-purple-500/10 border-purple-500/30"
                        : "bg-white/[0.03] border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm text-purple-400">#{idx + 1}</span>
                      <span className="text-xl">{p.avatar}</span>
                      <span className="font-bold text-white text-sm">{p.name}</span>
                    </div>
                    <div className="font-black text-purple-300 text-sm">{p.score} pts</div>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
                  setRoundNumber(1);
                  setPhase("setup");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-black text-sm text-white shadow-lg"
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
