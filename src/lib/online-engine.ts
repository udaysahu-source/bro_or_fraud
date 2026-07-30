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

export type GameCategory = "WORD_DEDUCTION" | "HOTSEAT_PANELS";
export type PanelSubMode = "SOLO_BLUFF" | "TRIPLE_CLAIM" | "PHOTO_COUNTERFEIT";

export interface SoloBluffPayload {
  topic: string;
  realPrompt: string;
  bluffPrompt: string;
  fraudId: string;
  panelClaims: Record<string, string>; // panelistId -> clue/claim text
}

export interface TripleClaimPayload {
  claim: string;
  ownerId: string;
  bluffers: string[];
  panelClaims: Record<string, string>; // panelistId -> defense text
}

export interface PhotoCounterfeitPayload {
  realPhotoDescription: string;
  counterfeitPhotoDescription: string;
  counterfeitId: string;
  panelClaims: Record<string, string>; // panelistId -> description text
}

export interface OnlineGameState {
  roomCode: string;
  hostId: string;
  phase: "LOBBY" | "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULTS" | "PREPARATION" | "STAGE_ACTION" | "REVEAL";
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

  // Hotseat Panels additions
  category?: GameCategory;
  subMode?: PanelSubMode;
  panelIds?: string[];
  audienceIds?: string[];
  maxRounds?: number;
  payload?: SoloBluffPayload | TripleClaimPayload | PhotoCounterfeitPayload | null;
}

const TRIPLE_CLAIMS = [
  "I once sneaked into the opposite gender's hostel after midnight.",
  "I spent an entire month's allowance on online food orders in 3 days.",
  "I was caught sleeping during a presentation by the dean.",
  "I got locked out of my room in my towel while going for a bath.",
  "I have a secret stash of snacks hidden inside an empty CPU cabinet.",
  "I used ChatGPT to write an entire assignment 10 minutes before deadline and got an A.",
  "I once accidentally texted a meme criticizing a professor directly to the professor's personal WhatsApp.",
  "I survived on only 5-minute Maggi for a whole week during exams.",
  "I did proxy attendance for a classmate who was actually sleeping next to me in the same lecture.",
  "I bribed the security guard with a cup of hot tea to let me enter the campus after curfew."
];

const PHOTO_PROMPTS = [
  {
    real: "A dog wearing stylish sunglasses riding a tiny skateboard down a busy street.",
    counterfeit: "A cat wearing a wizard hat riding a surfboard on a giant blue wave."
  },
  {
    real: "A professor sleeping soundly on their desk while students quietly play video games.",
    counterfeit: "A student sleeping soundly on the floor while a cat writes complex formulas on the whiteboard."
  },
  {
    real: "An astronaut holding a cup of steaming hot chai on the surface of the moon.",
    counterfeit: "An alien eating a plate of spicy momos in a neon-lit futuristic market."
  },
  {
    real: "A hostel room completely filled with empty pizza boxes stacked up to the ceiling.",
    counterfeit: "A hostel room completely filled with floating water balloons and neon green lights."
  },
  {
    real: "A giant monkey playing a electric guitar on top of a red college building.",
    counterfeit: "A giant robot playing a drum kit in the middle of a crowded football field."
  }
];

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

export function assignHotseatRoles(
  state: OnlineGameState
): OnlineGameState {
  const allPlayers = [...state.players];
  if (allPlayers.length === 0) return state;

  // Shuffle players to pick panel and audience
  const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
  const panelCount = Math.min(4, shuffledPlayers.length);
  
  const panelIds = shuffledPlayers.slice(0, panelCount).map((p) => p.id);
  const audienceIds = shuffledPlayers.slice(panelCount).map((p) => p.id);

  const subMode = state.subMode || "SOLO_BLUFF";
  let payload: SoloBluffPayload | TripleClaimPayload | PhotoCounterfeitPayload | null = null;

  if (subMode === "SOLO_BLUFF") {
    // Word list selection
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

    let availableWords = selectedWords.filter((w) => !state.usedWords.includes(w));
    if (availableWords.length === 0) availableWords = selectedWords;

    const realPrompt = availableWords[Math.floor(Math.random() * availableWords.length)] || "Chai";
    const otherPacks = PACKS.filter((p) => p.id !== selectedPackId);
    const randomOtherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
    const bluffPrompt = randomOtherPack.words[Math.floor(Math.random() * randomOtherPack.words.length)] || "Coffee";

    const fraudId = panelIds[Math.floor(Math.random() * panelIds.length)];

    payload = {
      topic: "Solo Bluff",
      realPrompt,
      bluffPrompt,
      fraudId,
      panelClaims: {},
    };
  } else if (subMode === "TRIPLE_CLAIM") {
    const randomClaim = TRIPLE_CLAIMS[Math.floor(Math.random() * TRIPLE_CLAIMS.length)];
    const ownerId = panelIds[Math.floor(Math.random() * panelIds.length)];
    const bluffers = panelIds.filter((id) => id !== ownerId);

    payload = {
      claim: randomClaim,
      ownerId,
      bluffers,
      panelClaims: {},
    };
  } else if (subMode === "PHOTO_COUNTERFEIT") {
    const prompt = PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)];
    const counterfeitId = panelIds[Math.floor(Math.random() * panelIds.length)];

    payload = {
      realPhotoDescription: prompt.real,
      counterfeitPhotoDescription: prompt.counterfeit,
      counterfeitId,
      panelClaims: {},
    };
  }

  // Reset players clues and votes for the new round
  const updatedPlayers = state.players.map((p) => ({
    ...p,
    clue: "",
    vote: "",
    isReady: false,
  }));

  return {
    ...state,
    phase: "PREPARATION",
    players: updatedPlayers,
    votes: {},
    timerActive: false,
    secondsLeft: 0,
    panelIds,
    audienceIds,
    payload,
    clueTurnIndex: 0,
  };
}
