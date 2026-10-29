export type RevealStyle = "hold" | "tap" | "auto";
export type PresetKey = "quick" | "standard" | "chaos" | "custom";

export interface MatchSettings {
  rounds: number;
  timerSeconds: number;
  revealStyle: RevealStyle;
  soundEnabled: boolean;
  preset?: PresetKey;
}

export const SETTINGS_PRESETS: Record<
  "quick" | "standard" | "chaos",
  {
    name: string;
    description: string;
    emoji: string;
    settings: Omit<MatchSettings, "preset">;
  }
> = {
  quick: {
    name: "Quick Blitz",
    description: "Fast-paced, quick taps, short timers.",
    emoji: "⚡",
    settings: {
      rounds: 3,
      timerSeconds: 15,
      revealStyle: "tap",
      soundEnabled: true,
    },
  },
  standard: {
    name: "Standard",
    description: "Balanced hostel match with peeker-proof reveals.",
    emoji: "🎯",
    settings: {
      rounds: 5,
      timerSeconds: 30,
      revealStyle: "hold",
      soundEnabled: true,
    },
  },
  chaos: {
    name: "Pure Chaos",
    description: "Long rounds, tense timers, auto countdowns.",
    emoji: "🔥",
    settings: {
      rounds: 7,
      timerSeconds: 45,
      revealStyle: "auto",
      soundEnabled: true,
    },
  },
};

export const DEFAULT_SETTINGS: MatchSettings = {
  rounds: 5,
  timerSeconds: 30,
  revealStyle: "hold",
  soundEnabled: true,
  preset: "standard",
};

const KEY = "bof.settings.v1";

export function loadSettings(): MatchSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: MatchSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

