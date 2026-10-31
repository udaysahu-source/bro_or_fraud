/**
 * Shared active player roster loader.
 * Ensures player names and counts defined on the home screen/setup
 * are consistently applied across all game modes without re-entry.
 */

export const DEFAULT_ROSTER = ["Aarav", "Mehul", "Riya", "Kabir"];

export function loadActiveRoster(): string[] {
  if (typeof window === "undefined") return DEFAULT_ROSTER;
  try {
    const fromSession = sessionStorage.getItem("bof_active_players");
    if (fromSession) {
      const parsed = JSON.parse(fromSession);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.map((p) => String(p).trim()).filter(Boolean);
      }
    }
    const fromLocal = localStorage.getItem("bof_players");
    if (fromLocal) {
      const parsed = JSON.parse(fromLocal);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.map((p) => String(p).trim()).filter(Boolean);
      }
    }
  } catch {
    /* fallback to default */
  }
  return DEFAULT_ROSTER;
}

export function saveActiveRoster(players: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = players.map((p) => String(p).trim()).filter(Boolean);
    sessionStorage.setItem("bof_active_players", JSON.stringify(cleaned));
    localStorage.setItem("bof_players", JSON.stringify(cleaned));
  } catch {
    /* ignore */
  }
}
