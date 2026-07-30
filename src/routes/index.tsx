import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buzz, success as hapticSuccess, error as hapticError, reveal as hapticReveal } from "@/lib/haptics";
import { createRoomOptimistic, joinRoomOptimistic, type Room } from "@/lib/room";
import { fetchCustomPacks, type CustomPack } from "@/lib/customPacks";



export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Bro or Fraud? — Catch the fraud before they catch you" },
      { name: "description", content: "A chaotic party game for hostel groups. Create a room, pass the phone, and roast your friends." },
      { property: "og:title", content: "Bro or Fraud?" },
      { property: "og:description", content: "Catch the fraud. Or be the fraud. Play with your bros right now." },
    ],
  }),
});

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
};

const PACKS: Pack[] = [
  { id: "indian-internet", name: "Indian Internet", tag: "IN.NET", badge: "IN", words: 120, bg: "bg-lime", ink: "text-void", pattern: "grid", accent: "var(--color-magenta)" },
  { id: "hostel-life", name: "Hostel Life", tag: "HOSTEL", badge: "HL", words: 96, bg: "bg-magenta", ink: "text-white", pattern: "stripes", accent: "var(--color-lime)" },
  { id: "gen-z-slang", name: "Gen Z Slang", tag: "MEME", badge: "GZ", words: 110, bg: "bg-white", ink: "text-void", pattern: "dots", accent: "var(--color-magenta)" },
  { id: "bollywood-tropes", name: "Bollywood Tropes", tag: "BOLLY", badge: "BW", words: 108, bg: "bg-magenta", ink: "text-white", pattern: "glitch", accent: "var(--color-lime)" },
  { id: "cricket-bros", name: "Cricket Bros", tag: "CRICKET", badge: "CR", words: 88, bg: "bg-lime", ink: "text-void", pattern: "bars", accent: "var(--color-magenta)" },
  { id: "insta-reels", name: "Insta Reels", tag: "REELS", badge: "IG", words: 105, bg: "bg-white", ink: "text-void", pattern: "stripes", accent: "var(--color-magenta)" },
  { id: "indian-family", name: "Indian Family", tag: "DESI", badge: "FM", words: 90, bg: "bg-lime", ink: "text-void", pattern: "bars", accent: "var(--color-magenta)" },
  { id: "indian-dad", name: "Indian Dad", tag: "DAD", badge: "DD", words: 80, bg: "bg-magenta", ink: "text-white", pattern: "bars", accent: "var(--color-lime)" },
  { id: "food", name: "Food", tag: "FOOD", badge: "FD", words: 100, bg: "bg-lime", ink: "text-void", pattern: "dots", accent: "var(--color-magenta)" },
  { id: "anime", name: "Anime", tag: "ANIME", badge: "AN", words: 95, bg: "bg-white", ink: "text-void", pattern: "glitch", accent: "var(--color-magenta)" },
  { id: "bikes", name: "Bikes", tag: "BIKES", badge: "BK", words: 70, bg: "bg-magenta", ink: "text-white", pattern: "stripes", accent: "var(--color-lime)" },
  { id: "engineering", name: "Engineering", tag: "ENGG", badge: "EN", words: 92, bg: "bg-lime", ink: "text-void", pattern: "grid", accent: "var(--color-magenta)" },
  { id: "dating", name: "Dating", tag: "DATE", badge: "DT", words: 85, bg: "bg-white", ink: "text-void", pattern: "dots", accent: "var(--color-magenta)" },
  { id: "gaming", name: "Gaming", tag: "GAME", badge: "GM", words: 90, bg: "bg-magenta", ink: "text-white", pattern: "glitch", accent: "var(--color-lime)" },
  { id: "movies", name: "Movies", tag: "MOVIE", badge: "MV", words: 100, bg: "bg-lime", ink: "text-void", pattern: "stripes", accent: "var(--color-magenta)" },
  { id: "festivals", name: "Festivals", tag: "FEST", badge: "FS", words: 88, bg: "bg-white", ink: "text-void", pattern: "bars", accent: "var(--color-magenta)" },
  { id: "travel", name: "Travel", tag: "TRAVEL", badge: "TV", words: 82, bg: "bg-magenta", ink: "text-white", pattern: "dots", accent: "var(--color-lime)" },
  { id: "brainrot", name: "Brainrot", tag: "ROT", badge: "BR", words: 96, bg: "bg-lime", ink: "text-void", pattern: "glitch", accent: "var(--color-magenta)" },
  { id: "goat-debate", name: "GOAT Debate", tag: "GOAT", badge: "GT", words: 75, bg: "bg-white", ink: "text-void", pattern: "grid", accent: "var(--color-magenta)" },
  { id: "dark-but-funny", name: "Dark but Funny", tag: "DARK", badge: "DK", words: 78, bg: "bg-magenta", ink: "text-white", pattern: "glitch", accent: "var(--color-lime)" },
  { id: "indian-nostalgia", name: "Indian Nostalgia", tag: "NOST", badge: "NS", words: 98, bg: "bg-lime", ink: "text-void", pattern: "dots", accent: "var(--color-magenta)" },
  { id: "chaotic-pack", name: "Chaotic Pack", tag: "CHAOS", badge: "CH", words: 84, bg: "bg-magenta", ink: "text-white", pattern: "bars", accent: "var(--color-lime)" },
];

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
            <span key={i} className="w-1.5" style={{ background: accent, height: `${h * 2}px`, alignSelf: "flex-end" }} />
          ))}
        </div>
      );
    case "glitch":
      return (
        <>
          <div className="absolute inset-x-0 top-2 h-1 opacity-70" style={{ background: accent }} />
          <div className="absolute left-0 top-6 h-0.5 w-2/3 opacity-60" style={{ background: accent }} />
          <div className="absolute right-0 bottom-3 h-0.5 w-1/2 opacity-60" style={{ background: accent }} />
        </>
      );
  }
}

function PackSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="shrink-0 w-40 rounded-xl border-2 border-border bg-surface overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <div className="skeleton-shimmer h-24 border-b-2 border-void" style={{ animationDelay: `${delay}ms` }} />
      <div className="p-3 space-y-2">
        <div className="skeleton-shimmer h-3 w-3/4 rounded" style={{ animationDelay: `${delay}ms` }} />
        <div className="skeleton-shimmer h-2 w-1/2 rounded" style={{ animationDelay: `${delay + 120}ms` }} />
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
  return (
    <button
      onClick={() => {
        buzz(20);
        if (onSelect) onSelect(p);
      }}
      className={`pack-card ${
        compact ? "w-full min-h-[120px]" : "shrink-0 w-40 snap-start h-auto"
      } rounded-xl border-2 border-border bg-surface text-left overflow-hidden brutal-shadow-pink animate-[fade-in_0.35s_ease-out_both] flex flex-col justify-between`}
      style={{ animationDelay: `${i * 30}ms` }}
    >
      <div
        className={`relative ${p.bg} ${p.ink} ${
          compact ? "h-16" : "h-20"
        } border-b-2 border-void overflow-hidden shrink-0`}
      >
        <PatternLayer pattern={p.pattern} accent={p.accent} />
        <div className="badge-shine absolute inset-0" />
        <div className="relative flex h-full items-end justify-between px-3 pb-2 pt-2">
          <span
            className={`${
              compact ? "text-2xl" : "text-3xl"
            } font-black leading-none tracking-tighter`}
            style={{ textShadow: `2px 2px 0 ${p.accent}` }}
          >
            {p.badge}
          </span>
          <span className="mb-1 rounded-sm border-2 border-current px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
            {p.tag}
          </span>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between bg-surface">
        <div className="text-xs font-black uppercase leading-tight text-foreground line-clamp-2">
          {p.name}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-lime" />
          {p.words} words
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
  const [pending, setPending] = useState<
    | null
    | {
        kind: "create" | "join";
        room: Room;
        status: "pending" | "confirmed" | "failed";
        errorMessage?: string;
      }
  >(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinDigits, setJoinDigits] = useState<string[]>(["", "", "", ""]);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const t = setTimeout(() => setPacksReady(true), 650);
    return () => clearTimeout(t);
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
    })),
    ...PACKS,
  ];

  useEffect(() => {
    if (!showAll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showAll]);

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
        setPending((p) => (p && p.room.code === r.code ? { ...p, room: r, status: "confirmed" } : p));
        hapticSuccess();
        sessionStorage.setItem("bof:hosting", r.code.toUpperCase()); // Tag this client as the host for this code
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
    const code = joinDigits.join("").toUpperCase(); // Convert code to uppercase for consistency
    if (code.length !== 4) return;
    buzz([20, 20]);
    const { room, confirmed } = joinRoomOptimistic(code);
    setPending({ kind: "join", room, status: "pending" });
    confirmed
      .then((r) => {
        setPending((p) => (p && p.room.code === r.code ? { ...p, room: r, status: "confirmed" } : p));
        hapticSuccess();
        sessionStorage.removeItem("bof:hosting"); // Ensure this client joins as a guest
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

  const cta = mode === "online"
    ? { label: "Create Room", helper: "Play on separate devices via a 4-digit room code." }
    : { label: "Start Pass-the-Phone", helper: "Pass one phone around the table. No signup, no wifi drama." };


  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-5 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/app-logo.png"
              alt="Bro or Fraud Logo"
              className="size-8.5 rounded-lg border-2 border-border object-cover shrink-0 shadow-sm"
            />
            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-lime bg-lime/10 rounded border border-lime/20">
              v1 · chaos edition
            </span>
          </div>
          <Link
            to="/settings"
            onClick={() => buzz(20)}
            className="rounded-md border-2 border-border bg-surface px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-foreground tactile tactile-press"
          >
            ⚙ Settings
          </Link>
        </header>

        {/* Logo / Hero — clamp-scaled */}
        <section className="mt-[clamp(0.75rem,3vw,1.5rem)]">
          <h1 className="text-hero font-black uppercase">
            <span className="inline-block" style={{ textShadow: "4px 4px 0 var(--color-magenta)" }}>
              Bro or
            </span>
            <br />
            <span
              className="inline-block text-lime mt-1"
              style={{ textShadow: "4px 4px 0 var(--color-magenta)" }}
            >
              Fraud?
            </span>
          </h1>
          <p className="text-tagline mt-[clamp(0.5rem,2vw,0.875rem)] font-semibold text-muted-foreground max-w-[22ch]">
            One of you is lying. The rest get to roast them.
          </p>
        </section>

        {/* Segmented switch — capsule */}
        <div
          className="relative mt-5 grid grid-cols-2 rounded-full border-2 border-border p-1"
          style={{ backgroundColor: "var(--color-track)" }}
        >
          <div
            className={`pointer-events-none absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-lime transition-transform duration-200 ${
              mode === "online" ? "translate-x-1" : "translate-x-[calc(100%+4px)]"
            }`}
          />
          {(["online", "local"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); buzz(15); }}
              className={`relative z-10 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
                mode === m ? "text-void" : "text-muted-foreground"
              }`}
            >
              {m === "online" ? "Online" : "Pass Phone"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
          {cta.helper}
        </p>

        {/* Primary CTA — above the fold */}
        <section className="mt-4 space-y-3">
          <button
            onClick={handlePrimary}
            disabled={!!pending}
            className="block w-full rounded-xl bg-lime px-6 py-5 text-center text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press disabled:opacity-90"
          >
            {pending?.kind === "create" ? "Spinning up room…" : `${cta.label} →`}
          </button>
          {mode === "online" ? (
            <div className="rounded-xl border-2 border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Join with code
                </span>
                {joinOpen && (
                  <button
                    onClick={() => { setJoinOpen(false); setJoinDigits(["","","",""]); }}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { joinRefs.current[i] = el; }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={joinDigits[i]}
                    onFocus={() => { if (!joinOpen) setJoinOpen(true); }}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !joinDigits[i] && i > 0) {
                        joinRefs.current[i - 1]?.focus();
                      }
                    }}
                    className="grid size-9 place-items-center rounded-md border-2 border-border bg-void text-center text-base font-black text-foreground caret-lime focus:border-lime focus:outline-none"
                  />
                ))}
              </div>
              {joinDigits.every((d) => d) && (
                <button
                  onClick={handleJoinSubmit}
                  disabled={!!pending}
                  className="mt-3 w-full rounded-md bg-magenta px-4 py-2 text-xs font-black uppercase tracking-widest text-white border-2 border-void tactile tactile-press disabled:opacity-70"
                >
                  {pending?.kind === "join" ? "Joining…" : `Join ${joinDigits.join("")} →`}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { buzz(25); navigate({ to: "/play/setup" }); }}
              className="block w-full rounded-xl border-2 border-border bg-surface px-6 py-3.5 text-sm font-black uppercase tracking-widest text-foreground tactile tactile-press"
            >
              Add Players · Setup
            </button>
          )}
        </section>


        {/* Trending Packs */}
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.25em]">
              Trending Packs <span className="text-magenta">//</span>
            </h2>
            <button
              onClick={() => { buzz(20); setShowAll(true); }}
              className="text-[11px] font-black uppercase tracking-widest text-lime tactile tactile-press"
            >
              See all →
            </button>
          </div>
          <div className="relative -mx-5">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {!packsReady
                ? [0, 120, 240, 360, 480].map((d, i) => <PackSkeleton key={i} delay={d} />)
                : allPacks.map((p, i) => (
                    <PackCard key={p.name} p={p} i={i} onSelect={handleSelectPack} />
                  ))}
              <div className="shrink-0 w-2" aria-hidden />
            </div>
            {/* Right-edge fade to hint scrollability */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-10"
              style={{ background: "linear-gradient(to left, var(--color-void), transparent)" }}
              aria-hidden
            />
          </div>
        </section>

        <div className="flex-1" />

        <p className="pt-6 text-center text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
          best played loud · headphones off · roast on
        </p>
      </div>

      {/* All Packs — bottom sheet */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-[fade-in_0.2s_ease-out_both]">
          <button
            aria-label="Close"
            onClick={() => setShowAll(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-2xl border-t-2 border-x-2 border-border bg-void max-h-[85dvh] flex flex-col animate-[slide-up_0.28s_cubic-bezier(0.22,1,0.36,1)_both]">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-2 border-border">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wide">All Packs</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {allPacks.length} packs · tap to inspect
                </p>
              </div>
              <button
                onClick={() => { buzz(15); setShowAll(false); }}
                className="grid size-9 place-items-center rounded-md border-2 border-border bg-surface text-foreground font-black tactile tactile-press"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 pb-8">
              {allPacks.map((p, i) => (
                <PackCard key={p.name} p={p} i={i} compact onSelect={handleSelectPack} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimistic room overlay — animated with framer-motion */}
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
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
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
                  pending.status === "failed" ? "text-magenta line-through decoration-4" : "text-lime"
                }`}
                style={{
                  textShadow:
                    pending.status === "failed"
                      ? "3px 3px 0 var(--color-void)"
                      : "3px 3px 0 var(--color-magenta)",
                }}
                animate={
                  pending.status === "confirmed"
                    ? { scale: [1, 1.12, 1], rotate: [0, -2, 2, 0] }
                    : {}
                }
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                {pending.room.code}
              </motion.div>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest">
                <span
                  className={`inline-block size-2 rounded-full ${
                    pending.status === "confirmed"
                      ? "bg-lime"
                      : pending.status === "failed"
                        ? "bg-magenta"
                        : "bg-magenta animate-pulse"
                  }`}
                />
                <span
                  className={
                    pending.status === "confirmed"
                      ? "text-lime"
                      : pending.status === "failed"
                        ? "text-magenta"
                        : "text-magenta"
                  }
                >
                  {pending.status === "confirmed"
                    ? "Confirmed · entering…"
                    : pending.status === "failed"
                      ? pending.errorMessage ?? "Something broke"
                      : pending.kind === "create"
                        ? "Syncing with server…"
                        : "Knocking…"}
                </span>
              </div>

              {pending.status === "failed" ? (
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={dismissPending}
                    className="flex-1 rounded-md border-2 border-border bg-void px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-foreground tactile tactile-press"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={retryPending}
                    className="flex-1 rounded-md bg-lime px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-void border-2 border-void tactile tactile-press"
                  >
                    Retry →
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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

