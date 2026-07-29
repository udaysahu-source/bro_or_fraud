import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz, success as hapticSuccess, error as hapticError } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Shield, Settings, Info, User, HelpCircle } from "lucide-react";
import {
  fetchCustomPacks,
  createCustomPack,
  deleteCustomPack,
  type CustomPack,
} from "@/lib/customPacks";
import { PACKS } from "@/lib/mcp/packs";

export const Route = createFileRoute("/play/setup")({
  component: PlaySetup,
  head: () => ({
    meta: [
      { title: "Match Setup — Bro or Fraud?" },
      { name: "description", content: "Set up players, select topic packs, and configure the impostor counts." },
    ],
  }),
});

const DEFAULT_PLAYERS = ["Player 1", "Player 2", "Player 3", "Player 4"];
const FUN_EMOJIS = ["🦊", "🦁", "🐻", "🐯", "🐸", "🐙", "🐼", "🐨", "🐰", "🐹", "🐭", "🐱", "🐵", "🦄", "🐮", "🐷"];

interface Player {
  name: string;
  emoji: string;
}

export function PlaySetup() {
  const navigate = useNavigate();

  // Match Config State
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [impostorsCount, setImpostorsCount] = useState(1);
  const [selectedPacks, setSelectedPacks] = useState<string[]>(["hostel-life"]);
  const timerSeconds = 0; // No Limit
  const chaosMode = false;

  // Custom Packs State
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);
  const [showCreatePack, setShowCreatePack] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState("");
  const [newPackCategory, setNewPackCategory] = useState("");
  const [newPackWords, setNewPackWords] = useState("");
  const [creatingPack, setCreatingPack] = useState(false);

  // Load initial settings and custom packs
  useEffect(() => {
    // Load players from localStorage or use defaults
    const savedPlayers = localStorage.getItem("bof:roster");
    if (savedPlayers) {
      try {
        setPlayers(JSON.parse(savedPlayers));
      } catch {
        setPlayers(DEFAULT_PLAYERS.map((name, i) => ({ name, emoji: FUN_EMOJIS[i % FUN_EMOJIS.length] })));
      }
    } else {
      setPlayers(DEFAULT_PLAYERS.map((name, i) => ({ name, emoji: FUN_EMOJIS[i % FUN_EMOJIS.length] })));
    }

    // Check pre-selected topic pack from home screen
    const preselected = sessionStorage.getItem("bof_preselect_pack");
    if (preselected) {
      setSelectedPacks([preselected]);
      sessionStorage.removeItem("bof_preselect_pack");
    }

    setCustomPacks(fetchCustomPacks());
  }, []);

  // Roster Management
  const updatePlayerName = (index: number, newName: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], name: newName };
    setPlayers(updated);
    localStorage.setItem("bof:roster", JSON.stringify(updated));
  };

  const addPlayer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.length >= 20) {
      hapticError();
      return;
    }
    buzz(15);
    const emoji = FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)];
    const updated = [...players, { name: trimmed, emoji }];
    setPlayers(updated);
    localStorage.setItem("bof:roster", JSON.stringify(updated));
    setNewPlayerName("");
  };

  const quickAddPlayer = () => {
    if (players.length >= 20) {
      hapticError();
      return;
    }
    buzz(15);
    const nextNum = players.length + 1;
    const name = `Player ${nextNum}`;
    const emoji = FUN_EMOJIS[players.length % FUN_EMOJIS.length];
    const updated = [...players, { name, emoji }];
    setPlayers(updated);
    localStorage.setItem("bof:roster", JSON.stringify(updated));
  };

  const removePlayer = (index: number) => {
    buzz(15);
    const updated = players.filter((_, i) => i !== index);
    setPlayers(updated);
    localStorage.setItem("bof:roster", JSON.stringify(updated));
  };

  // Stepper limits for Frauds (scaling up to 5 for 20 players)
  const maxImpostors =
    players.length >= 17
      ? 5
      : players.length >= 13
      ? 4
      : players.length >= 9
      ? 3
      : players.length >= 6
      ? 2
      : 1;

  useEffect(() => {
    if (impostorsCount > maxImpostors) {
      setImpostorsCount(maxImpostors);
    }
  }, [players.length, maxImpostors]);

  // Pack Selection (Allow up to 2 packs)
  const togglePack = (id: string) => {
    buzz(20);
    setSelectedPacks((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Must have at least one pack selected
        return prev.filter((p) => p !== id);
      }
      if (prev.length >= 2) {
        // Replace the second selected pack
        return [prev[0], id];
      }
      return [...prev, id];
    });
  };

  // Handle custom pack creation
  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackTitle.trim() || !newPackCategory.trim() || !newPackWords.trim()) {
      hapticError();
      return;
    }

    setCreatingPack(true);
    buzz(20);
    try {
      const wordsArr = newPackWords
        .split(/[,\n]/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      if (wordsArr.length < 5) {
        alert("Please add at least 5 words to create a pack.");
        hapticError();
        setCreatingPack(false);
        return;
      }

      const pack = createCustomPack(newPackTitle, newPackCategory, wordsArr);
      setCustomPacks(fetchCustomPacks());
      hapticSuccess();
      setSelectedPacks([pack.id]);
      setShowCreatePack(false);
      setNewPackTitle("");
      setNewPackCategory("");
      setNewPackWords("");
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setCreatingPack(false);
    }
  };

  // Start Local Match state assembler
  const handleStartMatch = () => {
    if (players.length < 3) {
      hapticError();
      alert("You need at least 3 players to start!");
      return;
    }

    buzz([30, 20, 30]);

    // Choose target word based on selected packs
    let categoryName = "Random Blend";
    let targetWord = "Chai";
    let bluffWord = "Coffee";

    // Gather word lists
    const packsToUse: { title: string; pairs: [string, string][] }[] = [];

    selectedPacks.forEach((packId) => {
      const builtIn = PACKS.find((p) => p.id === packId);
      if (builtIn) {
        packsToUse.push({
          title: builtIn.name,
          pairs: builtIn.pairs,
        });
      } else {
        const custom = customPacks.find((p) => p.id === packId);
        if (custom) {
          // Map custom word array to virtual pairs
          const virtualPairs: [string, string][] = custom.words.map((word, i) => {
            const otherIdx = (i + 1) % custom.words.length;
            const otherWord = custom.words[otherIdx] || "???";
            return [word, otherWord];
          });
          packsToUse.push({
            title: custom.title,
            pairs: virtualPairs,
          });
        }
      }
    });

    if (packsToUse.length === 1) {
      categoryName = packsToUse[0].title;
      const pairs = packsToUse[0].pairs;
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)] || ["Chai", "Coffee"];
      targetWord = randomPair[0];
      bluffWord = randomPair[1];
    } else if (packsToUse.length >= 2) {
      categoryName = `${packsToUse[0].title} + ${packsToUse[1].title}`;
      // Flatten all pairs
      const allPairs = [...packsToUse[0].pairs, ...packsToUse[1].pairs];
      const randomPair = allPairs[Math.floor(Math.random() * allPairs.length)] || ["Chai", "Coffee"];
      targetWord = randomPair[0];
      bluffWord = randomPair[1];
    }

    // Shuffle roles (frauds indices) using Fisher-Yates
    const indices = Array.from({ length: players.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const fraudsIndices = indices.slice(0, impostorsCount);

    const matchConfig = {
      players,
      impostorsCount,
      timerSeconds,
      chaosMode,
      selectedPacks,
      categoryName,
      targetWord,
      bluffWord,
      fraudsIndices,
      currentRound: 1,
      scores: players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {}),
      usedWords: [targetWord],
    };

    sessionStorage.setItem("bof_match_config", JSON.stringify(matchConfig));
    navigate({ to: "/play/local" });
  };

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-28">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            ← Home
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Local Match Setup
          </span>
        </header>

        {/* Title */}
        <section className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-magenta">
            // pass-the-phone
          </p>
          <h1 className="mt-1.5 text-4xl font-black uppercase leading-[0.9]">
            Configure the<br />
            <span className="text-lime">Session 🎮</span>
          </h1>
        </section>

        {/* 1. Player Roster Management */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">// Player Roster ({players.length}/20)</h2>
            <button
              onClick={quickAddPlayer}
              disabled={players.length >= 20}
              className="text-[10px] font-black uppercase tracking-widest text-lime disabled:opacity-50"
            >
              + Quick Add
            </button>
          </div>

          {/* Player roster list with inline editing */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-surface px-3 py-2"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <button
                    type="button"
                    onClick={() => {
                      buzz(10);
                      const newEmoji = FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)];
                      const updated = [...players];
                      updated[idx] = { ...updated[idx], emoji: newEmoji };
                      setPlayers(updated);
                      localStorage.setItem("bof:roster", JSON.stringify(updated));
                    }}
                    className="text-xl shrink-0 hover:scale-110 transition-transform"
                    title="Tap to change avatar emoji"
                  >
                    {p.emoji}
                  </button>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayerName(idx, e.target.value)}
                    maxLength={15}
                    placeholder={`Player ${idx + 1}`}
                    className="w-full bg-transparent font-bold uppercase text-sm text-foreground focus:outline-none focus:border-b-2 focus:border-lime"
                  />
                </div>
                <button
                  onClick={() => removePlayer(idx)}
                  disabled={players.length <= 3}
                  className="text-muted-foreground hover:text-magenta disabled:opacity-30 p-1 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom player input */}
          <div className="mt-2.5 flex gap-2">
            <input
              type="text"
              placeholder="Add another player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addPlayer(newPlayerName);
              }}
              maxLength={15}
              className="flex-1 rounded-xl border-2 border-white/10 bg-void px-4 py-3 text-sm font-bold text-foreground focus:border-magenta focus:outline-none"
            />
            <button
              onClick={() => addPlayer(newPlayerName)}
              disabled={players.length >= 20 || !newPlayerName.trim()}
              className="grid size-12 place-items-center rounded-xl bg-magenta text-white border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
        </section>

        {/* 2. Fraud count selector */}
        <section className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide">Impostors / Frauds</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                Dynamic limits based on players
              </p>
            </div>
            <div className="flex items-center gap-3 border-2 border-white/10 rounded-xl bg-void p-1.5">
              <button
                onClick={() => { buzz(15); setImpostorsCount(Math.max(1, impostorsCount - 1)); }}
                disabled={impostorsCount <= 1}
                className="size-8 rounded-lg bg-surface border border-white/10 text-lg font-black grid place-items-center disabled:opacity-30"
              >
                -
              </button>
              <span className="w-6 text-center font-display text-lg font-black text-lime">{impostorsCount}</span>
              <button
                onClick={() => { buzz(15); setImpostorsCount(Math.min(maxImpostors, impostorsCount + 1)); }}
                disabled={impostorsCount >= maxImpostors}
                className="size-8 rounded-lg bg-surface border border-white/10 text-lg font-black grid place-items-center disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* 3. Topic & Pack Selector */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">// Select Packs</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Select up to 2 packs to blend word pools</p>
            </div>
            <button
              onClick={() => { buzz(15); setShowCreatePack(true); }}
              className="text-[10px] font-black uppercase tracking-widest text-lime"
            >
              + Create custom
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {/* Custom Packs */}
            {customPacks.map((pack) => {
              const active = selectedPacks.includes(pack.id);
              return (
                <div
                  key={pack.id}
                  onClick={() => togglePack(pack.id)}
                  className={`relative cursor-pointer rounded-xl border-2 p-3 text-left transition-all ${
                    active ? "border-magenta bg-magenta/10" : "border-white/10 bg-surface"
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-wide truncate text-foreground">{pack.title}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="inline-block size-1.5 rounded-full bg-magenta" />
                    {pack.words.length} words · Custom
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      buzz(20);
                      if (confirm(`Delete custom pack "${pack.title}"?`)) {
                        deleteCustomPack(pack.id);
                        setCustomPacks(fetchCustomPacks());
                        setSelectedPacks(["hostel-life"]);
                        hapticSuccess();
                      }
                    }}
                    className="absolute bottom-2 right-2 text-muted-foreground hover:text-magenta p-1 opacity-60 hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}

            {/* Built-in Packs */}
            {PACKS.map((pack) => {
              const active = selectedPacks.includes(pack.id);
              return (
                <button
                  key={pack.id}
                  onClick={() => togglePack(pack.id)}
                  className={`rounded-xl border-2 p-3 text-left transition-all tactile ${
                    active ? "border-lime bg-lime/10" : "border-white/10 bg-surface"
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-wide truncate text-foreground">{pack.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="inline-block size-1.5 rounded-full bg-lime" />
                    {pack.wordCount} words · Default
                  </div>
                </button>
              );
            })}
          </div>
        </section>



      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-full max-w-md px-5 pb-6 pt-3">
          <div className="rounded-2xl border-2 border-white/10 bg-black/60 p-3 backdrop-blur-md">
            <button
              onClick={handleStartMatch}
              className="block w-full rounded-xl bg-lime px-6 py-4.5 text-center text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press"
            >
              Start Local Match →
            </button>
          </div>
        </div>
      </div>

      {/* Create Custom Pack Drawer */}
      <AnimatePresence>
        {showCreatePack && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease-out_both]">
            <button
              aria-label="Close"
              onClick={() => setShowCreatePack(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative mx-auto w-full max-w-md rounded-t-2xl border-t-2 border-x-2 border-border bg-void max-h-[90dvh] flex flex-col p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-border">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wide">Create Custom Pack</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Add custom words for your party
                  </p>
                </div>
                <button
                  onClick={() => { buzz(15); setShowCreatePack(false); }}
                  className="grid size-9 place-items-center rounded-md border-2 border-border bg-surface text-foreground font-black"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePack} className="mt-4 space-y-4 pb-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Pack Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostel Room 104 Jokes"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    maxLength={30}
                    className="w-full mt-1.5 rounded-xl border-2 border-white/10 bg-surface px-4 py-3 text-sm font-bold text-foreground focus:border-lime focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inside Jokes"
                    value={newPackCategory}
                    onChange={(e) => setNewPackCategory(e.target.value)}
                    maxLength={20}
                    className="w-full mt-1.5 rounded-xl border-2 border-white/10 bg-surface px-4 py-3 text-sm font-bold text-foreground focus:border-lime focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Word List (Comma or Newline separated)
                  </label>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Min 5 words. (e.g. Chai, Maggi, Warden, Attendant, Bunk Bed)</p>
                  <textarea
                    required
                    placeholder="Enter words here..."
                    value={newPackWords}
                    onChange={(e) => setNewPackWords(e.target.value)}
                    rows={4}
                    className="w-full mt-1.5 rounded-xl border-2 border-white/10 bg-surface px-4 py-3 text-sm font-semibold text-foreground focus:border-lime focus:outline-none"
                  />
                </div>



                <button
                  type="submit"
                  disabled={creatingPack}
                  className="w-full rounded-xl bg-lime px-6 py-4 text-center text-md font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-magenta disabled:opacity-50"
                >
                  {creatingPack ? "Creating..." : "Save Custom Pack"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
