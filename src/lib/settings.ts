export type RevealStyle = "hold" | "tap" | "auto";

export interface MatchSettings {
  rounds: number;
  timerSeconds: number;
  revealStyle: RevealStyle;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: MatchSettings = {
  rounds: 5,
  timerSeconds: 30,
  revealStyle: "hold",
  soundEnabled: true,
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
