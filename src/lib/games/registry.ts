import { getAllGameModes } from "./loader";
import { GameMode } from "./types";

export interface GameHubItem {
  id: string;
  name: string;
  tagline: string;
  category: string;
  emoji: string;
  moodTag: string;
  players: { min: number; max: number };
  estimatedMinutes: { min: number; max: number };
  route: string;
  isFlagship?: boolean;
  gameMode?: GameMode;
}

const GAME_METAS: Record<string, { emoji: string; moodTag: string }> = {
  "pass-the-bomb": { emoji: "💣", moodTag: "Fast & Tense" },
  "heads-up-tilt": { emoji: "📱", moodTag: "Forehead Guess" },
  "confession-roulette": { emoji: "👻", moodTag: "Decoys & Bluffs" },
  "never-have-i-ever": { emoji: "🫣", moodTag: "Spilling Tea" },
  "would-you-rather": { emoji: "🤔", moodTag: "Tough Dilemmas" },
  "garma-garam-takes": { emoji: "☕", moodTag: "Hot Takes" },
  "hot-seat": { emoji: "🔥", moodTag: "Friendly Roast" },
};

export function getHubGames(): GameHubItem[] {
  // Bro or Fraud stays first and untouched
  const flagship: GameHubItem = {
    id: "bro-or-fraud",
    name: "Bro or Fraud?",
    tagline: "Catch the fraud before they catch you.",
    category: "social-deduction",
    emoji: "🕵️‍♂️",
    moodTag: "Spyfall / Bluff",
    players: { min: 3, max: 20 },
    estimatedMinutes: { min: 5, max: 15 },
    route: "/play/setup",
    isFlagship: true,
  };

  const dynamicModes = getAllGameModes().map((gm) => {
    const meta = GAME_METAS[gm.id] || { emoji: "🎮", moodTag: "Party Chaos" };
    return {
      id: gm.id,
      name: gm.name,
      tagline: gm.tagline,
      category: gm.category,
      emoji: meta.emoji,
      moodTag: meta.moodTag,
      players: gm.players,
      estimatedMinutes: gm.estimatedMinutes,
      route: `/games/${gm.id}`,
      gameMode: gm,
    };
  });

  return [flagship, ...dynamicModes];
}
