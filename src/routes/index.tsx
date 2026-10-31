import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HelpCircle,
  Settings as SettingsIcon,
  Users,
  Flame,
  Sparkles,
  ChevronRight,
  X,
  Play,
} from "lucide-react";
import {
  buzz,
  success as hapticSuccess,
  error as hapticError,
  reveal as hapticReveal,
} from "@/lib/haptics";
import { createRoomOptimistic, joinRoomOptimistic, type Room } from "@/lib/room";
import { fetchCustomPacks, type CustomPack } from "@/lib/customPacks";
import { PACKS as BUILTIN_PACKS } from "@/lib/mcp/packs";
import { getHubGames, type GameCategoryChip } from "@/lib/games/registry";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Bro or Fraud? — Catch the fraud before they catch you" },
      {
        name: "description",
        content:
          "A chaotic mobile-first party game for hostel groups. Pass the phone, bluff your way out, and roast your friends.",
      },
      { property: "og:title", content: "Bro or Fraud?" },
      {
        property: "og:description",
        content: "Catch the fraud. Or be the fraud. Play with your bros right now.",
      },
    ],
  }),
});

type SpiceLevel = "mild" | "spicy" | "chaos";

type Pack = {
  id: string;
  name: string;
  tag: string;
  badge: string;
  words: number;
  bg: string;
  ink: string;
  pattern: "grid" | "stripes" | "dots" | "bars" | "glitch";
  accent: string;
  emoji: string;
  spice: SpiceLevel;
};

const PACK_METAS: Record<string, { emoji: string; spice: SpiceLevel }> = {
  "college-life": { emoji: "🎓", spice: "spicy" },
  relationships: { emoji: "💔", spice: "spicy" },
  "gen-z": { emoji: "🧢", spice: "chaos" },
  "indian-parents": { emoji: "🩴", spice: "spicy" },
  food: { emoji: "🍕", spice: "mild" },
  cricket: { emoji: "🏏", spice: "mild" },
  gaming: { emoji: "🎮", spice: "mild" },
  anime: { emoji: "⚔️", spice: "mild" },
  movies: { emoji: "🍿", spice: "mild" },
  bikes: { emoji: "🏍️", spice: "mild" },
  travel: { emoji: "✈️", spice: "mild" },
  "body-parts": { emoji: "👀", spice: "mild" },
  animals: { emoji: "🦁", spice: "mild" },
  vehicles: { emoji: "🚗", spice: "mild" },
  tech: { emoji: "💻", spice: "mild" },
  jobs: { emoji: "💼", spice: "mild" },
  brands: { emoji: "🏷️", spice: "mild" },
  "daily-life": { emoji: "☕", spice: "mild" },
};

const PACK_STYLES = [
  { bg: "bg-lime", ink: "text-void", pattern: "grid" as const, accent: "var(--color-magenta)" },
  { bg: "bg-magenta", ink: "text-white", pattern: "stripes" as const, accent: "var(--color-lime)" },
  { bg: "bg-white", ink: "text-void", pattern: "dots" as const, accent: "var(--color-magenta)" },
  { bg: "bg-magenta", ink: "text-white", pattern: "glitch" as const, accent: "var(--color-lime)" },
  { bg: "bg-lime", ink: "text-void", pattern: "bars" as const, accent: "var(--color-magenta)" },
  { bg: "bg-white", ink: "text-void", pattern: "stripes" as const, accent: "var(--color-magenta)" },
];

const PACKS: Pack[] = BUILTIN_PACKS.map((bp, i) => {
  const style = PACK_STYLES[i % PACK_STYLES.length];
  const meta = PACK_METAS[bp.id] || { emoji: "🔥", spice: "mild" };
  const initials = bp.name
    .split(/[\s-]+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: bp.id,
    name: bp.name,
    tag: bp.tag,
    badge: initials || bp.name.slice(0, 2).toUpperCase(),
    words: bp.words.length,
    emoji: meta.emoji,
    spice: meta.spice,
    ...style,
  };
});

function PatternLayer({ pattern, accent }: { pattern: Pack["pattern"]; accent: string }) {
  switch (pattern) {
    case "grid":
      return (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
            backgroundSize: "10px 10px",
          }}
        />
      );
    case "stripes":
      return (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0 4px, transparent 4px 10px)`,
          }}
        />
      );
    case "dots":
      return (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(${accent} 1.5px, transparent 1.6px)`,
            backgroundSize: "9px 9px",
          }}
        />
      );
    case "bars":
      return (
        <div className="absolute inset-x-0 bottom-0 flex h-3 gap-1 px-2 opacity-90">
          {[6, 10, 4, 12, 7, 9, 5].map((h, i) => (
            <span
              key={i}
              className="w-1.5"
              style={{ background: accent, height: `${h * 2}px`, alignSelf: "flex-end" }}
            />
          ))}
        </div>
      );
    case "glitch":
      return (
        <>
          <div className="absolute inset-x-0 top-2 h-1 opacity-70" style={{ background: accent }} />
          <div
            className="absolute left-0 top-6 h-0.5 w-2/3 opacity-60"
            style={{ background: accent }}
          />
          <div
            className="absolute right-0 bottom-3 h-0.5 w-1/2 opacity-60"
            style={{ background: accent }}
          />
        </>
      );
  }
}

function PackSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="shrink-0 w-44 rounded-2xl border-2 border-border bg-surface overflow-hidden min-h-[175px]"
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <div
        className="skeleton-shimmer h-20 border-b-2 border-border"
        style={{ animationDelay: `${delay}ms` }}
      />
      <div className="p-3.5 space-y-2.5">
        <div
          className="skeleton-shimmer h-3.5 w-3/4 rounded"
          style={{ animationDelay: `${delay}ms` }}
        />
        <div
          className="skeleton-shimmer h-2.5 w-1/2 rounded"
          style={{ animationDelay: `${delay + 120}ms` }}
        />
        <div
          className="skeleton-shimmer h-4 w-1/3 rounded-full mt-2"
          style={{ animationDelay: `${delay + 200}ms` }}
        />
      </div>
    </div>
  );
}

function PackCard({
  p,
  i,
  compact = false,
  onSelect,
}: {
  p: Pack;
  i: number;
  compact?: boolean;
  onSelect?: (p: Pack) => void;
}) {
  const spiceBadge =
    p.spice === "chaos"
      ? { label: "Chaos 🌶️", bg: "bg-magenta/20 border-magenta/40 text-magenta" }
      : p.spice === "spicy"
        ? { label: "Spicy 🔥", bg: "bg-orange-500/20 border-orange-500/40 text-orange-400" }
        : { label: "Mild 🟢", bg: "bg-lime/20 border-lime/40 text-lime" };

  return (
    <button
      type="button"
      onClick={() => {
        buzz(20);
        if (onSelect) onSelect(p);
      }}
      className={`pack-card ${
        compact ? "w-full min-h-[135px]" : "shrink-0 w-48 snap-start h-auto"
      } rounded-2xl border-2.5 border-black bg-surface text-left overflow-hidden shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_var(--color-magenta)] animate-[fade-in_0.35s_ease-out_both] flex flex-col justify-between transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000]`}
      style={{ animationDelay: `${i * 30}ms` }}
    >
      <div
        className={`relative ${p.bg} ${p.ink} ${
          compact ? "h-16" : "h-22"
        } border-b-2.5 border-black overflow-hidden shrink-0`}
      >
        <PatternLayer pattern={p.pattern} accent={p.accent} />
        <div className="badge-shine absolute inset-0" />
        <div className="relative flex h-full items-end justify-between px-3.5 pb-2 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl leading-none">{p.emoji}</span>
            <span
              className={`${
                compact ? "text-xl" : "text-2xl"
              } font-black leading-none tracking-tighter`}
              style={{ textShadow: `2px 2px 0 ${p.accent}` }}
            >
              {p.badge}
            </span>
          </div>
          <span className="mb-0.5 rounded border border-current px-1.5 py-0.5 text-[11px] font-black uppercase tracking-widest">
            {p.tag}
          </span>
        </div>
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-surface">
        <div>
          <div className="text-xs font-black uppercase leading-tight text-foreground line-clamp-2">
            {p.name}
          </div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {p.words} words · 3–20 players
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-black uppercase tracking-widest border ${spiceBadge.bg}`}
          >
            {spiceBadge.label}
          </span>
          <span className="text-[11px] text-lime font-black">Play →</span>
        </div>
      </div>
    </button>
  );
}

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"online" | "local">("local");
  const [packsReady, setPacksReady] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [howToPlayStep, setHowToPlayStep] = useState(0);
  const [savedRosterCount, setSavedRosterCount] = useState<number | null>(null);
  const hubGames = getHubGames();
  const [activeGameCategory, setActiveGameCategory] = useState<GameCategoryChip>("all");
  const filteredHubGames =
    activeGameCategory === "all"
      ? hubGames
      : hubGames.filter((g) => g.chipCategory === activeGameCategory || g.isFlagship);

  const [pending, setPending] = useState<null | {
    kind: "create" | "join";
    room: Room;
    status: "pending" | "confirmed" | "failed";
    errorMessage?: string;
  }>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinDigits, setJoinDigits] = useState<string[]>(["", "", "", ""]);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const t = setTimeout(() => setPacksReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Check saved roster and onboarding state from localStorage
  useEffect(() => {
    try {
      const rosterRaw = localStorage.getItem("bof:roster");
      if (rosterRaw) {
        const parsed = JSON.parse(rosterRaw);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setSavedRosterCount(parsed.length);
        }
      }
      const onboarded = localStorage.getItem("bof_onboarded_v1");
      if (!onboarded) {
        setShowHowToPlay(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Custom Packs local state
  const [customPacks, setCustomPacks] = useState<CustomPack[]>([]);

  useEffect(() => {
    setCustomPacks(fetchCustomPacks());
  }, []);

  // Merge built-in and user-created custom packs
  const allPacks: Pack[] = [
    ...customPacks.map((cp) => ({
      id: cp.id,
      name: cp.title,
      tag: "CUSTOM",
      badge: cp.category.slice(0, 2).toUpperCase(),
      words: cp.words.length,
      bg: "bg-magenta",
      ink: "text-white",
      pattern: "glitch" as const,
      accent: "var(--color-lime)",
      emoji: "⚡",
      spice: "spicy" as SpiceLevel,
    })),
    ...PACKS,
  ];

  useEffect(() => {
    if (!showAll && !showHowToPlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAll, showHowToPlay]);

  function handleCloseHowToPlay() {
    buzz(15);
    setShowHowToPlay(false);
    try {
      localStorage.setItem("bof_onboarded_v1", "true");
    } catch {
      /* noop */
    }
  }

  function handlePrimary() {
    buzz([30, 20, 30]);
    if (mode === "local") {
      navigate({ to: "/play/setup" });
      return;
    }
    const { room, confirmed } = createRoomOptimistic("online");
    setPending({ kind: "create", room, status: "pending" });
    hapticReveal();
    confirmed
      .then((r) => {
        setPending((p) =>
          p && p.room.code === r.code ? { ...p, room: r, status: "confirmed" } : p,
        );
        hapticSuccess();
        sessionStorage.setItem("bof:hosting", r.code.toUpperCase());
        setTimeout(() => navigate({ to: "/online/room/$code", params: { code: r.code } }), 550);
      })
      .catch((e: Error & { room?: Room }) => {
        setPending((p) =>
          p && (!e.room || p.room.code === e.room.code)
            ? { ...p, status: "failed", errorMessage: e.message }
            : p,
        );
        hapticError();
      });
  }

  function handleJoinSubmit() {
    const code = joinDigits.join("").toUpperCase();
    if (code.length !== 4) return;
    buzz([20, 20]);
    const { room, confirmed } = joinRoomOptimistic(code);
    setPending({ kind: "join", room, status: "pending" });
    confirmed
      .then((r) => {
        setPending((p) =>
          p && p.room.code === r.code ? { ...p, room: r, status: "confirmed" } : p,
        );
        hapticSuccess();
        sessionStorage.removeItem("bof:hosting");
        setTimeout(() => navigate({ to: "/online/room/$code", params: { code: r.code } }), 550);
      })
      .catch((e: Error & { room?: Room }) => {
        setPending((p) =>
          p && (!e.room || p.room.code === e.room.code)
            ? { ...p, status: "failed", errorMessage: e.message }
            : p,
        );
        hapticError();
      });
  }

  function retryPending() {
    if (!pending) return;
    if (pending.kind === "create") {
      setPending(null);
      handlePrimary();
    } else {
      setPending(null);
      handleJoinSubmit();
    }
  }

  function dismissPending() {
    buzz(15);
    setPending(null);
    setJoinDigits(["", "", "", ""]);
  }

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "").slice(-1);
    setJoinDigits((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < 3) joinRefs.current[i + 1]?.focus();
  }

  const handleSelectPack = (pack: Pack) => {
    sessionStorage.setItem("bof_preselect_pack", pack.id);
    setShowAll(false);
    navigate({ to: "/play/setup" });
  };

  const ONBOARDING_STEPS = [
    {
      title: "1. Secret Word Handoff",
      emoji: "🤫",
      description:
        "Pass one phone around the table. All Bros get the exact same secret word. One of you is the FRAUD who gets a fake decoy word (or nothing at all)!",
      tip: "Keep a poker face — don't let anyone see your screen.",
    },
    {
      title: "2. Blend In & Interrogate",
      emoji: "🗣️",
      description:
        "Take turns giving 1-word or short subtle clues about your secret word. Too obvious? The Fraud figures it out. Too vague? Your Bros vote YOU out!",
      tip: "Watch who hesitates or gives suspiciously generic answers.",
    },
    {
      title: "3. Vote & Roast",
      emoji: "🗳️",
      description:
        "Countdown 3-2-1 and point at who is bluffing. Catch the fraud to score points. If the fraud tricks you and escapes, they win the round and roast you!",
      tip: "The roast is mandatory. Headphones off, volume up.",
    },
  ];

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-5 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/app-logo.png"
              alt="Bro or Fraud Logo"
              className="size-9 rounded-xl border-2 border-border object-cover shrink-0 shadow-md"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground leading-none">
                Bro or Fraud?
              </span>
              <span className="mt-0.5 px-1.5 py-0.2 text-[10px] font-black uppercase tracking-widest text-lime bg-lime/10 rounded border border-lime/20 inline-block w-fit">
                v1 · hostel edition
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                buzz(20);
                setShowHowToPlay(true);
              }}
              aria-label="How to play"
              className="grid size-10 place-items-center rounded-xl border-2 border-border bg-surface text-foreground tactile tactile-press hover:border-white/20 transition-colors"
            >
              <HelpCircle className="size-5 text-lime" />
            </button>
            <Link
              to="/settings"
              onClick={() => buzz(20)}
              aria-label="Match Settings"
              className="grid size-10 place-items-center rounded-xl border-2 border-border bg-surface text-foreground tactile tactile-press hover:border-white/20 transition-colors"
            >
              <SettingsIcon className="size-5 text-foreground" />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-[clamp(0.75rem,3vw,1.5rem)] relative">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="sticker-badge bg-lime text-void rotate-[-1.5deg]">
              ⚡ 100% OFFLINE
            </span>
            <span className="sticker-badge bg-magenta text-white rotate-[1deg]">
              🚫 ZERO SIGNUP
            </span>
            <span className="sticker-badge bg-white text-void rotate-[-1deg]">
              🎮 {hubGames.length} PARTY MODES
            </span>
          </div>

          <h1 className="text-hero font-black uppercase tracking-tight select-none">
            <span
              className="inline-block text-white"
              style={{
                textShadow: "4px 4px 0 #000, 6px 6px 0 var(--color-magenta)",
              }}
            >
              Bro or
            </span>
            <br />
            <span
              className="inline-block text-lime mt-1"
              style={{
                textShadow: "4px 4px 0 #000, 6px 6px 0 var(--color-magenta)",
              }}
            >
              Fraud?
            </span>
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-lime animate-ping" />
            <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
              One of you is bluffing. The rest roast them.
            </p>
          </div>
        </section>

        {/* Segmented Mode Selector with clear active state */}
        <div
          className="relative mt-5 grid grid-cols-2 rounded-2xl border-2 border-black p-1 bg-void shadow-[4px_4px_0_0_#000]"
          role="radiogroup"
          aria-label="Game Mode"
        >
          <div
            className={`pointer-events-none absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-lime border-2 border-black shadow-[2px_2px_0_0_#000] transition-transform duration-200 ${
              mode === "local" ? "translate-x-1" : "translate-x-[calc(100%+4px)]"
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setMode("local");
              buzz(15);
            }}
            className={`relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 min-h-[46px] ${
              mode === "local" ? "text-void" : "text-muted-foreground hover:text-white"
            }`}
          >
            <span>📱 Pass Phone</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("online");
              buzz(15);
            }}
            className={`relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 min-h-[46px] ${
              mode === "online" ? "text-void" : "text-muted-foreground hover:text-white"
            }`}
          >
            <span>🌐 Online Room</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                mode === "online"
                  ? "bg-void text-lime border-black"
                  : "bg-magenta/20 text-magenta border-magenta/40"
              }`}
            >
              P2P
            </span>
          </button>
        </div>

        {/* Mode helper text */}
        <p className="mt-2 text-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
          {mode === "local"
            ? "Pass one phone around the table. No signup, no wifi drama."
            : "Experimental peer-to-peer online mode for separate devices."}
        </p>

        {/* Primary CTA Area */}
        <section className="mt-4 space-y-3">
          {mode === "local" ? (
            <>
              <button
                type="button"
                onClick={handlePrimary}
                className="group relative block w-full rounded-2xl bg-lime px-6 py-4.5 text-center text-lg font-black uppercase tracking-wide text-void border-3 border-black shadow-[5px_5px_0_0_var(--color-magenta)] hover:shadow-[7px_7px_0_0_var(--color-magenta)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_0_var(--color-magenta)] transition-all min-h-[58px]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Start Pass-the-Phone</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  buzz(25);
                  navigate({ to: "/play/setup" });
                }}
                className="flex items-center justify-between w-full rounded-2xl border-2 border-white/20 bg-surface px-5 py-3.5 text-xs font-black uppercase tracking-widest text-foreground shadow-[4px_4px_0_0_#000] hover:border-lime hover:shadow-[4px_4px_0_0_var(--color-lime)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all min-h-[52px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-lime/10 border border-lime/30 grid place-items-center text-lime">
                    <Users className="size-4" />
                  </div>
                  <span className="font-bold">
                    {savedRosterCount
                      ? `Roster (${savedRosterCount} Players)`
                      : "Add Players & Setup"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-lime">
                  <span>Custom Packs & Frauds</span>
                  <ChevronRight className="size-4" />
                </div>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePrimary}
                disabled={!!pending}
                className="block w-full rounded-2xl bg-lime px-6 py-4 text-center text-base font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press disabled:opacity-90 min-h-[54px]"
              >
                {pending?.kind === "create" ? "Spinning up room…" : "Create Room →"}
              </button>
              <div className="rounded-2xl border-2 border-border bg-surface px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Join with 4-Digit Code
                  </span>
                  {joinOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setJoinOpen(false);
                        setJoinDigits(["", "", "", ""]);
                      }}
                      className="text-[11px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2.5 flex justify-center gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        joinRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={joinDigits[i]}
                      onFocus={() => {
                        if (!joinOpen) setJoinOpen(true);
                      }}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !joinDigits[i] && i > 0) {
                          joinRefs.current[i - 1]?.focus();
                        }
                      }}
                      aria-label={`Digit ${i + 1}`}
                      className="grid size-12 place-items-center rounded-xl border-2 border-border bg-void text-center text-xl font-black text-foreground caret-lime focus:border-lime focus:outline-none"
                    />
                  ))}
                </div>
                {joinDigits.every((d) => d) && (
                  <button
                    type="button"
                    onClick={handleJoinSubmit}
                    disabled={!!pending}
                    className="mt-3 w-full rounded-xl bg-magenta px-4 py-3 text-xs font-black uppercase tracking-widest text-white border-2 border-void tactile tactile-press disabled:opacity-70"
                  >
                    {pending?.kind === "join"
                      ? "Connecting…"
                      : `Join Room ${joinDigits.join("")} →`}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Hostel Party Games Hub */}
        <section className="mt-8">
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] flex items-center gap-1.5 text-foreground">
              <span>Party Game Modes</span>
              <span className="text-lime">//</span>
            </h2>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 tracking-wider">
              {hubGames.length} Offline Modes
            </span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-1 px-1">
            {[
              { id: "all" as GameCategoryChip, label: "🔥 All" },
              { id: "tea" as GameCategoryChip, label: "🤫 Tea & Roast" },
              { id: "reflexes" as GameCategoryChip, label: "⚡ Fast Reflexes" },
              { id: "debate" as GameCategoryChip, label: "🗣️ Hot Debates" },
              { id: "bluff" as GameCategoryChip, label: "🕵️ Spyfall" },
            ]
              .map((cat) => {
                const count =
                  cat.id === "all"
                    ? hubGames.length
                    : hubGames.filter((g) => g.chipCategory === cat.id).length;
                return { ...cat, count };
              })
              .filter((cat) => cat.count > 0)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    buzz(15);
                    setActiveGameCategory(cat.id);
                  }}
                  className={`text-xs font-black px-4 py-2.5 min-h-[40px] rounded-full whitespace-nowrap transition-all border shrink-0 ${
                    activeGameCategory === cat.id
                      ? "bg-foreground text-background border-foreground shadow-md shadow-foreground/10 scale-[1.02]"
                      : "bg-surface/90 text-muted-foreground border-border hover:text-foreground hover:border-white/20"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredHubGames.map((game, idx) => (
              <motion.button
                key={game.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  buzz(25);
                  navigate({ to: game.route as any });
                }}
                className={`group relative flex items-center justify-between p-4 rounded-2xl border-2.5 border-black text-left transition-all duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] bg-gradient-to-br ${game.accentGradient} shadow-[4px_4px_0_0_#000]`}
              >
                <div className="flex items-start gap-3.5 overflow-hidden pr-2">
                  <div className="text-2xl size-12 rounded-xl bg-void border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#000] group-hover:scale-105 transition-transform">
                    {game.emoji}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-lime transition-colors">
                        {game.name}
                      </span>
                      {game.isFlagship && (
                        <span className="sticker-badge bg-lime text-void text-[9px] py-0 px-1.5 rotate-[1deg]">
                          Flagship
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/80 font-bold truncate mt-0.5">
                      {game.hostelVibe || game.tagline}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-white/70 font-black uppercase tracking-wider">
                      <span className="bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        👥 {game.players.min}-{game.players.max}
                      </span>
                      <span className="bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        ⏱️ {game.estimatedMinutes.min}-{game.estimatedMinutes.max}m
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border border-black font-black uppercase ${game.badgeBg}`}
                      >
                        {game.moodTag}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pl-1">
                  <div className="size-9 rounded-xl bg-black border-2 border-white/20 flex items-center justify-center group-hover:bg-lime group-hover:border-black group-hover:text-void text-lime shadow-[2px_2px_0_0_#000] transition-colors">
                    <ChevronRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Trending Packs */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] flex items-center gap-1.5 text-foreground">
              <span>Trending Packs</span>
              <span className="text-magenta">//</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                buzz(20);
                setShowAll(true);
              }}
              className="text-xs font-black uppercase tracking-widest text-lime tactile tactile-press hover:underline"
            >
              See all ({allPacks.length}) →
            </button>
          </div>
          <div className="relative -mx-5">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {!packsReady ? (
                [0, 120, 240, 360].map((d, i) => <PackSkeleton key={i} delay={d} />)
              ) : allPacks.length === 0 ? (
                <div className="w-full text-center py-8 px-4 rounded-2xl border-2 border-border bg-surface text-muted-foreground text-xs">
                  No word packs found. Tap Setup to add or import packs!
                </div>
              ) : (
                allPacks
                  .slice(0, 8)
                  .map((p, i) => <PackCard key={p.id} p={p} i={i} onSelect={handleSelectPack} />)
              )}
              <div className="shrink-0 w-2" aria-hidden />
            </div>
            {/* Right edge fade hint */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-8"
              style={{ background: "linear-gradient(to left, var(--color-void), transparent)" }}
              aria-hidden
            />
          </div>
        </section>

        <div className="flex-1 min-h-6" />

        <footer className="pt-4 text-center text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
          best played loud · headphones off · roast on
        </footer>
      </div>

      {/* How to Play 3-Step Onboarding Modal */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl border-2 border-border bg-surface p-6 text-foreground brutal-shadow-pink"
            >
              <button
                type="button"
                onClick={handleCloseHowToPlay}
                aria-label="Close rules"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg border border-border bg-void text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-lime bg-lime/10 rounded border border-lime/20">
                  Quick Guide
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Step {howToPlayStep + 1} of 3
                </span>
              </div>

              <div className="mt-4 text-center">
                <div className="text-4xl mb-2">{ONBOARDING_STEPS[howToPlayStep].emoji}</div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground font-display">
                  {ONBOARDING_STEPS[howToPlayStep].title}
                </h3>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                  {ONBOARDING_STEPS[howToPlayStep].description}
                </p>
                <div className="mt-3 rounded-xl bg-void/80 border border-border p-2.5 text-xs font-semibold text-lime">
                  💡 {ONBOARDING_STEPS[howToPlayStep].tip}
                </div>
              </div>

              {/* Step indicator dots */}
              <div className="mt-5 flex justify-center gap-1.5">
                {ONBOARDING_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      buzz(15);
                      setHowToPlayStep(idx);
                    }}
                    aria-label={`Go to step ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      howToPlayStep === idx ? "w-6 bg-lime" : "w-2 bg-border"
                    }`}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex gap-2">
                {howToPlayStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      buzz(20);
                      setHowToPlayStep((s) => s + 1);
                    }}
                    className="flex-1 rounded-xl bg-lime px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-void border-2 border-void tactile tactile-press"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseHowToPlay}
                    className="flex-1 rounded-xl bg-lime px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-void border-2 border-void brutal-shadow-pink tactile tactile-press"
                  >
                    Got It, Let's Play! →
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "All Packs" Bottom Sheet Drawer */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease-out_both]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowAll(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-3xl border-t-2 border-x-2 border-border bg-void max-h-[85dvh] flex flex-col animate-[slide-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-2 border-border">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wide">All Word Packs</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {allPacks.length} packs · tap to select for match
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  buzz(15);
                  setShowAll(false);
                }}
                className="grid size-9 place-items-center rounded-xl border-2 border-border bg-surface text-foreground font-black tactile tactile-press"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 pb-8">
              {allPacks.map((p, i) => (
                <PackCard key={p.id} p={p} i={i} compact onSelect={handleSelectPack} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimistic room overlay */}
      <AnimatePresence>
        {pending && (
          <motion.div
            key="pending-overlay"
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={pending.status === "failed" ? dismissPending : undefined}
          >
            <motion.div
              key={pending.status}
              onClick={(e) => e.stopPropagation()}
              className={`mx-5 w-full max-w-sm rounded-2xl border-2 bg-surface p-6 text-center brutal-shadow-pink ${
                pending.status === "failed" ? "border-magenta" : "border-border"
              }`}
              initial={{ y: 24, opacity: 0, scale: 0.94 }}
              animate={
                pending.status === "failed"
                  ? { y: 0, opacity: 1, scale: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }
                  : pending.status === "confirmed"
                    ? { y: 0, opacity: 1, scale: [1, 1.05, 1] }
                    : { y: 0, opacity: 1, scale: 1 }
              }
              exit={{ y: 16, opacity: 0, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 28,
                mass: 0.6,
                scale: { duration: 0.35, ease: "easeOut" },
                x: { duration: 0.5, ease: "easeInOut" },
              }}
            >
              <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
                {pending.status === "failed"
                  ? pending.kind === "create"
                    ? "Room failed"
                    : "Join failed"
                  : pending.kind === "create"
                    ? "Room ready"
                    : "Joining room"}
              </p>

              <motion.div
                className={`mt-3 text-6xl font-black tracking-[0.35em] ${
                  pending.status === "failed"
                    ? "text-magenta line-through decoration-4"
                    : "text-lime"
                }`}
                style={{
                  textShadow:
                    pending.status === "failed"
                      ? "3px 3px 0 var(--color-void)"
                      : "3px 3px 0 var(--color-magenta)",
                }}
              >
                {pending.room.code}
              </motion.div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                <span
                  className={`inline-block size-2 rounded-full ${
                    pending.status === "confirmed"
                      ? "bg-lime"
                      : pending.status === "failed"
                        ? "bg-magenta"
                        : "bg-magenta animate-pulse"
                  }`}
                />
                <span className={pending.status === "confirmed" ? "text-lime" : "text-magenta"}>
                  {pending.status === "confirmed"
                    ? "Confirmed · entering…"
                    : pending.status === "failed"
                      ? (pending.errorMessage ?? "Something broke")
                      : pending.kind === "create"
                        ? "Syncing with server…"
                        : "Knocking…"}
                </span>
              </div>

              {pending.status === "failed" ? (
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={dismissPending}
                    className="flex-1 rounded-xl border-2 border-border bg-void px-4 py-2.5 text-xs font-black uppercase tracking-widest text-foreground tactile tactile-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={retryPending}
                    className="flex-1 rounded-xl bg-lime px-4 py-2.5 text-xs font-black uppercase tracking-widest text-void border-2 border-void tactile tactile-press"
                  >
                    Retry →
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  {pending.status === "confirmed"
                    ? "Locked in · good luck"
                    : "Share this code with your bros"}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
