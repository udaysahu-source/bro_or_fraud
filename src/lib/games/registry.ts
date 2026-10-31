import { getAllGameModes } from "./loader";
import { GameMode } from "./types";

export type GameCategoryChip = "all" | "bluff" | "tea" | "reflexes" | "debate";

export interface GameHubItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  chipCategory: GameCategoryChip;
  emoji: string;
  moodTag: string;
  hostelVibe: string;
  accentGradient: string;
  accentBorder: string;
  badgeBg: string;
  players: { min: number; max: number };
  estimatedMinutes: { min: number; max: number };
  route: string;
  isFlagship?: boolean;
  gameMode?: GameMode;
}

const GAME_METAS: Record<
  string,
  {
    emoji: string;
    moodTag: string;
    chipCategory: GameCategoryChip;
    hostelVibe: string;
    accentGradient: string;
    accentBorder: string;
    badgeBg: string;
  }
> = {
  "pass-the-bomb": {
    emoji: "💣",
    moodTag: "Fast & Tense",
    chipCategory: "reflexes",
    hostelVibe: "Don't let it explode in your hands!",
    accentGradient: "from-rose-500/20 via-surface to-surface",
    accentBorder: "border-rose-500/40 hover:border-rose-400",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
  "heads-up-tilt": {
    emoji: "📱",
    moodTag: "Forehead Guess",
    chipCategory: "reflexes",
    hostelVibe: "Tilt down for YES, tilt up to PASS!",
    accentGradient: "from-emerald-500/20 via-surface to-surface",
    accentBorder: "border-emerald-500/40 hover:border-emerald-400",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  "confession-roulette": {
    emoji: "👻",
    moodTag: "Decoys & Bluffs",
    chipCategory: "tea",
    hostelVibe: "Guess who confessed, dodge the AI decoys!",
    accentGradient: "from-purple-500/20 via-surface to-surface",
    accentBorder: "border-purple-500/40 hover:border-purple-400",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  "never-have-i-ever": {
    emoji: "🫣",
    moodTag: "Spilling Tea",
    chipCategory: "tea",
    hostelVibe: "Secret voting — see how many bros did it!",
    accentGradient: "from-amber-500/20 via-surface to-surface",
    accentBorder: "border-amber-500/40 hover:border-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  "would-you-rather": {
    emoji: "🤔",
    moodTag: "Tough Dilemmas",
    chipCategory: "debate",
    hostelVibe: "50/50 hostel splits + 20s defense debate!",
    accentGradient: "from-cyan-500/20 via-surface to-surface",
    accentBorder: "border-cyan-500/40 hover:border-cyan-400",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
};

export function getHubGames(): GameHubItem[] {
  // Bro or Fraud stays first and untouched
  const flagship: GameHubItem = {
    id: "bro-or-fraud",
    name: "Bro or Fraud?",
    tagline: "Catch the fraud before they catch you.",
    category: "social-deduction",
    chipCategory: "bluff",
    emoji: "🕵️‍♂️",
    moodTag: "Flagship Spyfall",
    hostelVibe: "Hostel Spyfall • 1 Fraud, everyone else Bros!",
    accentGradient: "from-lime/25 via-surface to-surface",
    accentBorder: "border-lime/50 shadow-lg shadow-lime/10",
    badgeBg: "bg-lime text-void font-black",
    players: { min: 3, max: 20 },
    estimatedMinutes: { min: 5, max: 15 },
    route: "/play/setup",
    isFlagship: true,
  };

  const dynamicModes = getAllGameModes().map((gm) => {
    const meta = GAME_METAS[gm.id] || {
      emoji: "🎮",
      moodTag: "Party Chaos",
      chipCategory: "bluff" as GameCategoryChip,
      hostelVibe: "Campus party mode",
      accentGradient: "from-white/10 via-surface to-surface",
      accentBorder: "border-border hover:border-white/30",
      badgeBg: "bg-white/10 text-white",
    };
    return {
      id: gm.id,
      name: gm.name,
      tagline: gm.tagline,
      category: gm.category,
      chipCategory: meta.chipCategory,
      emoji: meta.emoji,
      moodTag: meta.moodTag,
      hostelVibe: meta.hostelVibe,
      accentGradient: meta.accentGradient,
      accentBorder: meta.accentBorder,
      badgeBg: meta.badgeBg,
      players: gm.players,
      estimatedMinutes: gm.estimatedMinutes,
      route: `/games/${gm.id}`,
      gameMode: gm,
    };
  });

  return [flagship, ...dynamicModes];
}
