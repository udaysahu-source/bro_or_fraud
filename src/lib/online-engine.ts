import { PACKS } from "./mcp/packs";
import { fetchCustomPacks } from "./customPacks";

export interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string; // Lucide icon key or emoji
  isReady: boolean;
  score: number;
  isHost: boolean;
  clue?: string; // One word clue submitted by player
  vote?: string; // Voted player's ID
}

export interface OnlineGameState {
  roomCode: string;
  hostId: string;
  phase: "LOBBY" | "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULTS";
  players: OnlinePlayer[];
  selectedPackId: string;
  targetWord: string;
  decoyWord: string;
  fraudPlayerId: string;
  votes: Record<string, string>; // voterId -> targetPlayerId
  clueTurnIndex: number; // Index of the player whose turn it is to say a clue
  timerSeconds: number;
  secondsLeft: number;
  timerActive: boolean;
  currentRound: number;
  usedWords: string[];
}

// Handler to trigger role distribution and word selection cleanly
export function assignOnlineRoles(
  state: OnlineGameState
): OnlineGameState {
  const playerIds = state.players.map((p) => p.id);
  if (playerIds.length === 0) return state;

  const randomFraudId = playerIds[Math.floor(Math.random() * playerIds.length)];
  
  // 1. Get words from the selected pack
  const selectedPackId = state.selectedPackId;
  const builtIn = PACKS.find((p) => p.id === selectedPackId);
  let selectedWords: string[] = ["Chai", "Coffee"];
  
  if (builtIn) {
    selectedWords = builtIn.words;
  } else {
    const customPacks = fetchCustomPacks();
    const custom = customPacks.find((p) => p.id === selectedPackId);
    if (custom) {
      selectedWords = custom.words;
    }
  }

  // Filter out already used words
  let availableWords = selectedWords.filter((w) => !state.usedWords.includes(w));
  if (availableWords.length === 0) {
    availableWords = selectedWords;
  }

  const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)] || "Chai";

  // 2. Select Fraud word from a different recognizable pack (different from selectedPackId)
  const otherPacks = PACKS.filter((p) => p.id !== selectedPackId);
  const randomOtherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
  const decoyWord = randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";

  // Reset players clues and votes for the new round
  const updatedPlayers = state.players.map((p) => ({
    ...p,
    clue: "",
    vote: "",
    isReady: false,
  }));

  return {
    ...state,
    phase: "ROLE_REVEAL",
    fraudPlayerId: randomFraudId,
    targetWord,
    decoyWord,
    votes: {},
    players: updatedPlayers,
    clueTurnIndex: 0,
    secondsLeft: state.timerSeconds,
    timerActive: false,
    usedWords: [...state.usedWords, targetWord],
  };
}
