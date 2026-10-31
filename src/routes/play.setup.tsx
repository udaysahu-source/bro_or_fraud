import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { buzz, success as hapticSuccess, error as hapticError } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Settings,
  User,
  HelpCircle,
  Download,
  Upload,
  Users,
  Lock,
  ShieldAlert,
  ArrowLeft,
  X,
  Layers,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import Papa from "papaparse";
import {
  fetchCustomPacks,
  createCustomPack,
  deleteCustomPack,
  type CustomPack,
} from "@/lib/customPacks";
import { PACKS } from "@/lib/mcp/packs";
import { loadSettings, type MatchSettings } from "@/lib/settings";

export const Route = createFileRoute("/play/setup")({
  component: PlaySetup,
  head: () => ({
    meta: [
      { title: "Match Setup — Bro or Fraud?" },
      {
        name: "description",
        content: "Set up players, select topic packs, and configure the impostor counts.",
      },
    ],
  }),
});

const DEFAULT_PLAYERS = ["Player 1", "Player 2", "Player 3", "Player 4"];
const FUN_EMOJIS = [
  "Zap",
  "Crown",
  "Flame",
  "Ghost",
  "Skull",
  "Gamepad2",
  "Heart",
  "Star",
  "Trophy",
  "Target",
  "Shield",
  "Eye",
  "Bot",
  "Sun",
  "Smile",
  "User",
];

export function renderAvatar(emoji: string, className = "size-5 text-current") {
  const IconComponent = (
    LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string; strokeWidth?: number }>
    >
  )[emoji];
  if (IconComponent) {
    return <IconComponent className={className} strokeWidth={1.5} />;
  }
  return <User className={className} strokeWidth={1.5} />;
}

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
  const [selectedPacks, setSelectedPacks] = useState<string[]>(["college-life"]);
  const [votingMode, setVotingMode] = useState<"pointing" | "secret">("pointing");
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(loadSettings());
  const chaosMode = false;
  const [showHelp, setShowHelp] = useState(false);

  // Custom Packs State
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);
  const [showCreatePack, setShowCreatePack] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState("");
  const [newPackCategory, setNewPackCategory] = useState("");
  const [newPackWords, setNewPackWords] = useState("");
  const [creatingPack, setCreatingPack] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial settings and custom packs
  useEffect(() => {
    setMatchSettings(loadSettings());
    // Load players from localStorage or use defaults
    const savedPlayers = localStorage.getItem("bof:roster");
    if (savedPlayers) {
      try {
        setPlayers(JSON.parse(savedPlayers));
      } catch {
        setPlayers(
          DEFAULT_PLAYERS.map((name, i) => ({ name, emoji: FUN_EMOJIS[i % FUN_EMOJIS.length] })),
        );
      }
    } else {
      setPlayers(
        DEFAULT_PLAYERS.map((name, i) => ({ name, emoji: FUN_EMOJIS[i % FUN_EMOJIS.length] })),
      );
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

  // Pack Selection (Allow multiple packs)
  const togglePack = (id: string) => {
    buzz(20);
    setSelectedPacks((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Must have at least one pack selected
        return prev.filter((p) => p !== id);
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

  const handleExportPack = (pack: CustomPack) => {
    buzz(20);
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pack, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${pack.title.replace(/\s+/g, "_").toLowerCase()}_pack.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    hapticSuccess();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          let title = "Imported JSON Pack";
          let category = "Custom";
          let words: string[] = [];

          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed)) {
              words = parsed;
            } else {
              title = parsed.title || parsed.name || title;
              category = parsed.category || category;
              words = Array.isArray(parsed.words) ? parsed.words : [];
            }
          }

          if (words.length < 5) {
            alert("JSON pack must contain at least 5 words.");
            return;
          }

          setNewPackTitle(title);
          setNewPackCategory(category);
          setNewPackWords(words.join(", "));
          hapticSuccess();
        } catch {
          alert("Invalid JSON format.");
          hapticError();
        }
      } else if (file.name.endsWith(".csv")) {
        Papa.parse(text, {
          complete: (results) => {
            const data = results.data as string[][];
            if (!data || data.length === 0) {
              alert("Empty CSV file.");
              return;
            }

            const title = "Imported CSV Pack";
            const category = "Custom";
            let words: string[] = [];

            const flatCells = data
              .flat()
              .map((c) => c.trim())
              .filter(Boolean);
            if (flatCells.length < 5) {
              alert("CSV pack must contain at least 5 words.");
              return;
            }

            words = flatCells;

            setNewPackTitle(title);
            setNewPackCategory(category);
            setNewPackWords(words.join(", "));
            hapticSuccess();
          },
          error: () => {
            alert("Failed to parse CSV.");
            hapticError();
          },
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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
    const packsToUse: { id: string; title: string; words: string[] }[] = [];

    selectedPacks.forEach((packId) => {
      const builtIn = PACKS.find((p) => p.id === packId);
      if (builtIn) {
        packsToUse.push({
          id: builtIn.id,
          title: builtIn.name,
          words: builtIn.words,
        });
      } else {
        const custom = customPacks.find((p) => p.id === packId);
        if (custom) {
          packsToUse.push({
            id: custom.id,
            title: custom.title,
            words: custom.words,
          });
        }
      }
    });

    if (packsToUse.length === 1) {
      categoryName = packsToUse[0].title;
      const words = packsToUse[0].words;
      targetWord = words[Math.floor(Math.random() * words.length)] || "Chai";

      const otherPacks = PACKS.filter((p) => p.id !== packsToUse[0].id);
      const randomOtherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
      bluffWord =
        randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";
    } else if (packsToUse.length >= 2) {
      if (packsToUse.length === 2) {
        categoryName = `${packsToUse[0].title} + ${packsToUse[1].title}`;
      } else {
        categoryName = `${packsToUse[0].title} + ${packsToUse.length - 1} Packs`;
      }
      const chosenPack = packsToUse[Math.floor(Math.random() * packsToUse.length)];
      targetWord = chosenPack.words[Math.floor(Math.random() * chosenPack.words.length)] || "Chai";

      const selectedIds = packsToUse.map((p) => p.id);
      const otherPacks = PACKS.filter((p) => !selectedIds.includes(p.id));
      const randomOtherPack =
        otherPacks.length > 0
          ? otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0]
          : PACKS[0];
      bluffWord =
        randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";
    }

    // Assign frauds indices avoiding recent frauds (session-persistent history)
    const recentFrauds: string[] = [];
    try {
      const saved = sessionStorage.getItem("bof_recent_frauds");
      if (saved) recentFrauds.push(...JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }

    const nonRecentIndices: number[] = [];
    const recentIndices: number[] = [];
    players.forEach((p, index) => {
      if (recentFrauds.includes(p.name)) {
        recentIndices.push(index);
      } else {
        nonRecentIndices.push(index);
      }
    });

    const shuffleArray = (arr: number[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    shuffleArray(nonRecentIndices);
    shuffleArray(recentIndices);

    const combinedIndices = [...nonRecentIndices, ...recentIndices];
    const fraudsIndices = combinedIndices.slice(0, impostorsCount);

    // Keep track of recent frauds to prevent repetition
    const newFraudNames = fraudsIndices.map((idx) => players[idx].name);
    const maxRecentWindow = Math.max(1, players.length - impostorsCount);
    const updatedRecent = [
      ...newFraudNames,
      ...recentFrauds.filter((name) => !newFraudNames.includes(name)),
    ].slice(0, maxRecentWindow);
    sessionStorage.setItem("bof_recent_frauds", JSON.stringify(updatedRecent));

    const latestSettings = loadSettings();
    const matchConfig = {
      players,
      impostorsCount,
      timerSeconds: latestSettings.timerSeconds,
      rounds: latestSettings.rounds,
      revealStyle: latestSettings.revealStyle,
      soundEnabled: latestSettings.soundEnabled,
      chaosMode,
      selectedPacks,
      categoryName,
      targetWord,
      bluffWord,
      fraudsIndices,
      currentRound: 1,
      scores: players.reduce((acc, p) => ({ ...acc, [p.name]: 0 }), {}),
      usedWords: [targetWord],
      votingMode,
    };

    sessionStorage.setItem("bof_match_config", JSON.stringify(matchConfig));
    navigate({ to: "/play/local" });
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-safe pb-32">
        {/* Header */}
        <header className="flex items-center justify-between pt-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Home</span>
          </Link>
          <Link
            to="/settings"
            onClick={() => buzz(15)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--brand-gold)] transition-all min-h-[36px]"
          >
            <Settings size={12} strokeWidth={1.5} />
            <span className="tabular-nums">
              {matchSettings.rounds}R · {matchSettings.timerSeconds}s · {matchSettings.revealStyle}
            </span>
          </Link>
        </header>

        {/* Title */}
        <section className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-pink)]">
              Pass-the-Phone Config
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">Setup Match</h1>
          </div>
          <button
            onClick={() => {
              buzz(15);
              setShowHelp(true);
            }}
            className="grid size-11 place-items-center rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--card)] text-[var(--brand-gold)] hover:border-[var(--brand-gold)] active:scale-95 cursor-pointer shrink-0 transition-all min-h-[44px] min-w-[44px]"
            title="How to Play"
            aria-label="How to Play"
          >
            <HelpCircle size={22} strokeWidth={1.5} />
          </button>
        </section>

        {/* 1. Player Roster Management */}
        <section className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Player Roster{" "}
              <span className="text-[var(--brand-gold)] tabular-nums">({players.length}/20)</span>
            </h2>
            <button
              onClick={quickAddPlayer}
              disabled={players.length >= 20}
              className="text-xs font-semibold text-[var(--brand-gold)] hover:underline disabled:opacity-40 min-h-[44px] flex items-center"
            >
              + Quick Add
            </button>
          </div>

          {/* Player roster list with inline editing */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {players.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--card)] px-3.5 py-2.5"
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
                    className="grid size-9 place-items-center rounded-xl bg-[var(--chip)] text-[var(--brand-gold)] shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title="Tap to change avatar"
                    aria-label="Change avatar"
                  >
                    {renderAvatar(p.emoji, "size-4.5")}
                  </button>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayerName(idx, e.target.value)}
                    maxLength={15}
                    placeholder={`Player ${idx + 1}`}
                    className="w-full bg-transparent font-semibold text-base text-[var(--text)] focus:outline-none focus:text-[var(--brand-gold)]"
                  />
                </div>
                <button
                  onClick={() => removePlayer(idx)}
                  disabled={players.length <= 3}
                  className="text-[var(--text-secondary)] hover:text-[var(--brand-pink)] disabled:opacity-20 p-2 shrink-0 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 size={16} strokeWidth={1.5} />
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
              className="flex-1 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--card)] px-4 py-3 text-base font-semibold text-[var(--text)] placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--brand-gold)] focus:outline-none min-h-[44px]"
            />
            <button
              onClick={() => addPlayer(newPlayerName)}
              disabled={players.length >= 20 || !newPlayerName.trim()}
              className="grid size-12 place-items-center rounded-[var(--radius-group)] bg-[var(--brand-pink)] text-white hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label="Add Player"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </section>

        {/* 2. Fraud count selector */}
        <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={16} strokeWidth={1.5} className="text-[var(--brand-pink)]" />
                <h2 className="text-sm font-bold tracking-tight">Frauds / Impostors</h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                {impostorsCount === 1
                  ? "1 fraud among the bros"
                  : `${impostorsCount} frauds infiltrating`}
              </p>
            </div>
            <div className="flex items-center gap-3 border border-[var(--separator)] rounded-[var(--radius-group)] bg-[var(--chip)] p-1">
              <button
                onClick={() => {
                  buzz(15);
                  setImpostorsCount(Math.max(1, impostorsCount - 1));
                }}
                disabled={impostorsCount <= 1}
                aria-label="Decrease frauds"
                className="size-8 rounded-lg bg-[var(--card)] text-base font-bold grid place-items-center disabled:opacity-30 active:scale-95 transition-transform cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center text-lg font-bold text-[var(--brand-pink)] tabular-nums">
                {impostorsCount}
              </span>
              <button
                onClick={() => {
                  buzz(15);
                  setImpostorsCount(Math.min(maxImpostors, impostorsCount + 1));
                }}
                disabled={impostorsCount >= maxImpostors}
                aria-label="Increase frauds"
                className="size-8 rounded-lg bg-[var(--card)] text-base font-bold grid place-items-center disabled:opacity-30 active:scale-95 transition-transform cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* Voting Mode Selector */}
        <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Voting Mechanism</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Choose how players cast their votes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-group)] p-1 bg-[var(--chip)]">
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setVotingMode("pointing");
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                  votingMode === "pointing"
                    ? "bg-[var(--brand-gold)] text-[var(--btn-text-on-gold)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <Users size={14} strokeWidth={1.5} />
                <span>Show of Hands</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setVotingMode("secret");
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                  votingMode === "secret"
                    ? "bg-[var(--brand-gold)] text-[var(--btn-text-on-gold)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                <Lock size={14} strokeWidth={1.5} />
                <span>Secret Ballot</span>
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {votingMode === "pointing"
                ? "Simultaneous pointing on zero. Fast and loud, ideal for large groups."
                : "Pass the phone secretly to cast individual votes. Maximum deception!"}
            </p>
          </div>
        </section>

        {/* 3. Topic & Pack Selector */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Select Packs
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Select 1 or more packs to blend word pools
              </p>
            </div>
            <button
              onClick={() => {
                buzz(15);
                setShowCreatePack(true);
              }}
              className="text-xs font-semibold text-[var(--brand-gold)] hover:underline min-h-[44px] flex items-center cursor-pointer"
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
                  className={`relative cursor-pointer rounded-[var(--radius-group)] border p-3 text-left transition-all ${
                    active
                      ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10"
                      : "border-[var(--separator)] bg-[var(--card)]"
                  }`}
                >
                  <div className="text-xs font-bold tracking-tight truncate text-[var(--text)]">
                    {pack.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                    <span className="inline-block size-1.5 rounded-full bg-[var(--brand-pink)]" />
                    <span className="tabular-nums">{pack.words.length} words</span> · Custom
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPack(pack);
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--text)] p-1 cursor-pointer"
                      title="Export pack as JSON"
                      aria-label="Export pack"
                    >
                      <Download size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        buzz(20);
                        if (confirm(`Delete custom pack "${pack.title}"?`)) {
                          deleteCustomPack(pack.id);
                          setCustomPacks(fetchCustomPacks());
                          setSelectedPacks(["college-life"]);
                          hapticSuccess();
                        }
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--brand-pink)] p-1 cursor-pointer"
                      title="Delete pack"
                      aria-label="Delete pack"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
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
                  className={`rounded-[var(--radius-group)] border p-3 text-left transition-all cursor-pointer ${
                    active
                      ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10"
                      : "border-[var(--separator)] bg-[var(--card)]"
                  }`}
                >
                  <div className="text-xs font-bold tracking-tight truncate text-[var(--text)]">
                    {pack.name}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                    <span className="inline-block size-1.5 rounded-full bg-[var(--brand-gold)]" />
                    <span className="tabular-nums">{pack.wordCount} words</span> · Default
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/95 to-transparent pt-6 pb-safe pointer-events-none">
        <div className="mx-auto w-full max-w-md px-5 pb-4 pointer-events-auto">
          <div className="rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)]/95 p-3.5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] px-1 pb-2.5">
              <span className="flex items-center gap-1.5 text-[var(--text)]">
                <span className="size-2 rounded-full bg-[var(--brand-gold)] animate-pulse" />
                <span className="tabular-nums">{players.length}</span> Players (
                <span className="tabular-nums">{impostorsCount}</span>{" "}
                {impostorsCount === 1 ? "Fraud" : "Frauds"})
              </span>
              <span className="text-[var(--brand-gold)] tabular-nums">
                {selectedPacks.length} Selected
              </span>
            </div>
            <button
              onClick={handleStartMatch}
              className="block w-full rounded-[var(--radius-btn)] bg-[var(--brand-gold)] px-6 py-4 text-center text-base font-bold text-[var(--btn-text-on-gold)] shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
            >
              Start Local Match →
            </button>
          </div>
        </div>
      </div>

      {/* Create Custom Pack Drawer */}
      <AnimatePresence>
        {showCreatePack && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
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
              className="relative mx-auto w-full max-w-md rounded-t-[var(--radius-card)] border-t border-x border-[var(--separator)] bg-[var(--card)] max-h-[90dvh] flex flex-col p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--separator)]">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Create Custom Pack</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Add custom words for your party
                  </p>
                </div>
                <button
                  onClick={() => {
                    buzz(15);
                    setShowCreatePack(false);
                  }}
                  className="grid size-9 place-items-center rounded-xl bg-[var(--chip)] text-[var(--text)] hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px]"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleCreatePack} className="mt-4 space-y-4 pb-6">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Pack Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostel Room 104 Jokes"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    maxLength={30}
                    className="w-full mt-1.5 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] px-4 py-3 text-base font-semibold text-[var(--text)] focus:border-[var(--brand-gold)] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inside Jokes"
                    value={newPackCategory}
                    onChange={(e) => setNewPackCategory(e.target.value)}
                    maxLength={20}
                    className="w-full mt-1.5 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] px-4 py-3 text-base font-semibold text-[var(--text)] focus:border-[var(--brand-gold)] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Word List (Comma or Newline separated)
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-[var(--brand-gold)] hover:underline flex items-center gap-1 cursor-pointer min-h-[44px]"
                    >
                      <Upload size={12} strokeWidth={1.5} /> Import CSV/JSON
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFile}
                      accept=".json,.csv"
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Min 5 words. (e.g. Chai, Maggi, Warden, Attendant, Bunk Bed)
                  </p>
                  <textarea
                    required
                    placeholder="Enter words here..."
                    value={newPackWords}
                    onChange={(e) => setNewPackWords(e.target.value)}
                    rows={4}
                    className="w-full mt-1.5 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] px-4 py-3 text-base font-medium text-[var(--text)] focus:border-[var(--brand-gold)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingPack}
                  className="w-full rounded-[var(--radius-btn)] bg-[var(--brand-gold)] px-6 py-4 text-center text-sm font-bold text-[var(--btn-text-on-gold)] shadow-md hover:brightness-105 disabled:opacity-50 min-h-[48px] cursor-pointer"
                >
                  {creatingPack ? "Creating..." : "Save Custom Pack"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* How to Play Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <button
              aria-label="Close"
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative mx-auto w-full max-w-md rounded-t-[var(--radius-card)] border-t border-x border-[var(--separator)] bg-[var(--card)] max-h-[85dvh] flex flex-col p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--separator)]">
                <div>
                  <h3 className="text-base font-bold tracking-tight">How To Play</h3>
                  <p className="text-xs text-[var(--text-secondary)]">The 3-Step Simple Rulebook</p>
                </div>
                <button
                  onClick={() => {
                    buzz(15);
                    setShowHelp(false);
                  }}
                  className="grid size-9 place-items-center rounded-xl bg-[var(--chip)] text-[var(--text)] hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px]"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* 3 Rule Cards */}
              <div className="mt-5 space-y-3 pb-8">
                {/* Step 1 */}
                <div className="rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-xs font-bold tabular-nums">
                      1
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Rule 1: Get Secret Word
                    </h4>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    Everyone gets the{" "}
                    <strong className="text-[var(--brand-gold)] font-bold">same secret word</strong>{" "}
                    (e.g. MAGGI), except the{" "}
                    <strong className="text-[var(--brand-pink)] font-bold">Fraud</strong>, who gets
                    a{" "}
                    <strong className="text-[var(--brand-pink)] font-bold">
                      different decoy word
                    </strong>{" "}
                    (e.g. MESS) or no word.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-[var(--brand-gold)]/20 text-[var(--brand-gold)] text-xs font-bold tabular-nums">
                      2
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Rule 2: Say 1-Word Clues
                    </h4>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    Go around in a circle. Everyone says{" "}
                    <strong className="text-[var(--brand-gold)] font-bold">ONE WORD ONLY</strong>{" "}
                    related to their secret word.
                    <br />
                    <span className="text-[11px] text-[var(--text-secondary)]/80 mt-1 block">
                      Example: Bro says &quot;Noodles&quot;. Fraud (who has MESS) says
                      &quot;Food&quot;.
                    </span>
                  </p>
                </div>

                {/* Step 3 */}
                <div className="rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-xs font-bold tabular-nums">
                      3
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Rule 3: Vote Out The Fraud
                    </h4>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                    After one round of clues, debate for{" "}
                    <strong className="text-[var(--brand-pink)] font-bold">60 seconds</strong> and
                    vote on who gave the most sus clue. Find the impostor before they blend in!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
