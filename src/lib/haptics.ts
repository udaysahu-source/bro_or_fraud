export function buzz(pattern: number | number[] = 30) {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("bof.settings.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hapticsEnabled === false) return;
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
}

// Tuned presets for high-stakes moments — punchier, more physical.
export const HAPTICS = {
  tap: 15,
  press: 25,
  select: [20, 30, 20],
  // "double-thump then rest" — feels like a lock clicking into place
  success: [40, 40, 20, 40, 60, 30, 90],
  // sharp triple buzz — reads as "nope"
  error: [80, 50, 80, 50, 120],
  // rising anticipation for room codes
  reveal: [10, 30, 20, 40, 30, 60, 40, 80],
} as const;

export const success = () => buzz([...HAPTICS.success]);
export const error = () => buzz([...HAPTICS.error]);
export const reveal = () => buzz([...HAPTICS.reveal]);
