import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import { renderShareCard, shareCard } from "@/lib/share-card";

export const Route = createFileRoute("/reveal")({
  component: Reveal,
  head: () => ({
    meta: [
      { title: "Reveal — Bro or Fraud?" },
      { name: "description", content: "The verdict is in. Time to roast." },
      { property: "og:title", content: "The Fraud is Revealed" },
      { property: "og:description", content: "See who lied and how badly they got cooked." },
    ],
  }),
});

const MATCH = {
  broWon: true,
  fraudName: "Priya",
  fraudEmoji: "🦊",
  word: "Chai",
  fraudGuess: "Coffee",
  roast: "Bro got cooked faster than Maggi in a hostel kettle 💀",
  scores: [
    { name: "Aarav", points: 320, emoji: "🦁" },
    { name: "Rohan", points: 280, emoji: "🐻" },
    { name: "Isha", points: 210, emoji: "🐯" },
    { name: "Priya", points: 150, emoji: "🦊" },
  ],
};

function Reveal() {
  const [flipped, setFlipped] = useState(false);
  const [sharing, setSharing] = useState<null | "insta" | "wa" | "native">(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const broWon = MATCH.broWon;

  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true);
      buzz([60, 40, 120]);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const handleShare = async (target: "insta" | "wa" | "native") => {
    setSharing(target);
    buzz(30);
    try {
      const blob = await renderShareCard({
        title: broWon ? "Bro caught the Fraud" : "Fraud escaped",
        subtitle: broWon ? "verdict · caught" : "verdict · escaped",
        fraudName: MATCH.fraudName,
        fraudEmoji: MATCH.fraudEmoji,
        word: MATCH.word,
        roast: MATCH.roast,
        scores: MATCH.scores,
      });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setOpenPreview(true);
      const text =
        target === "wa"
          ? `🚨 ${MATCH.fraudName} got exposed as the FRAUD. Word was "${MATCH.word}". Play with us:`
          : `Bro or Fraud? ${MATCH.fraudName} got cooked 💀`;
      await shareCard(
        blob,
        text,
        target === "wa" ? "whatsapp" : target === "insta" ? "instagram" : "native",
      );
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-8">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            ← Home
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Round 3 · Verdict
          </span>
        </header>

        {/* Banner */}
        <section className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
            // final call
          </p>
          <h1 className="mt-2 text-5xl font-black uppercase leading-[0.85] animate-glitch">
            {broWon ? (
              <>
                Bro caught
                <br />
                the <span className="text-lime">FRAUD 🚨</span>
              </>
            ) : (
              <>
                Fraud <span className="text-magenta">Escaped 🕵️</span>
              </>
            )}
          </h1>
        </section>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <FlipCard flipped={flipped} label="Real Word" value={MATCH.word} accent="lime" />
          <FlipCard
            flipped={flipped}
            label="Fraud thought"
            value={MATCH.fraudGuess}
            accent="magenta"
            delay={200}
          />
        </div>

        {/* Fraud reveal */}
        <div className="mt-6 rounded-2xl border-2 border-magenta/40 bg-magenta/5 p-5">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-magenta/20 text-3xl">
              {MATCH.fraudEmoji}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-magenta">
                The fraud was
              </div>
              <div className="truncate text-2xl font-black uppercase">{MATCH.fraudName}</div>
              <div className="text-xs text-muted-foreground">3 of 5 voted correctly</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-lime">
              Roast of the Match
            </div>
            <p className="mt-1 text-sm font-semibold">"{MATCH.roast}"</p>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="mt-4 space-y-1.5">
          {MATCH.scores.map((row, i) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-surface px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 text-xs font-black text-muted-foreground">{i + 1}</span>
                <span className="text-lg">{row.emoji}</span>
                <span className="truncate text-sm font-bold">{row.name}</span>
              </div>
              <span className="font-display text-sm font-black text-lime tabular-nums">
                +{row.points}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sticky actions */}
        <div className="mt-6 space-y-3">
          <Link
            to="/vote"
            onClick={() => buzz(40)}
            className="block w-full rounded-2xl bg-lime px-6 py-5 text-center text-lg font-black uppercase tracking-wide text-void brutal-shadow-white tactile tactile-press"
          >
            Next Round →
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <ShareBtn
              busy={sharing === "insta"}
              onClick={() => handleShare("insta")}
              label="Instagram"
              emoji="📸"
              tint="magenta"
            />
            <ShareBtn
              busy={sharing === "wa"}
              onClick={() => handleShare("wa")}
              label="WhatsApp"
              emoji="💬"
              tint="lime"
            />
            <ShareBtn
              busy={sharing === "native"}
              onClick={() => handleShare("native")}
              label="More"
              emoji="↗"
              tint="white"
            />
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Branded card auto-generated · Tap to save & share
          </p>
        </div>
      </div>

      {/* Preview modal */}
      {openPreview && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpenPreview(false)}
        >
          <div className="w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-lime">
              // Your share card
            </div>
            <img
              src={preview}
              alt="Match recap share card"
              className="w-full rounded-2xl border-2 border-white/15 shadow-2xl"
            />
            <button
              onClick={() => setOpenPreview(false)}
              className="w-full rounded-xl border-2 border-white/15 bg-black/40 px-4 py-3 text-sm font-black uppercase backdrop-blur-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareBtn({
  onClick,
  busy,
  label,
  emoji,
  tint,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  emoji: string;
  tint: "lime" | "magenta" | "white";
}) {
  const border =
    tint === "lime"
      ? "border-lime/40"
      : tint === "magenta"
        ? "border-magenta/40"
        : "border-white/20";
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`rounded-2xl border-2 ${border} bg-black/40 px-2 py-4 text-xs font-black uppercase backdrop-blur-md tactile tactile-press disabled:opacity-60`}
    >
      <div className="text-xl">{busy ? "…" : emoji}</div>
      <div className="mt-1">{label}</div>
    </button>
  );
}

function FlipCard({
  flipped,
  label,
  value,
  accent,
  delay = 0,
}: {
  flipped: boolean;
  label: string;
  value: string;
  accent: "lime" | "magenta";
  delay?: number;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(flipped), delay);
    return () => clearTimeout(t);
  }, [flipped, delay]);
  return (
    <div className="relative aspect-[3/4] w-full [perspective:1000px]">
      <div
        className="absolute inset-0 transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: on ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-white/15 bg-surface text-5xl [backface-visibility:hidden]">
          ?
        </div>
        <div
          className={`absolute inset-0 rounded-2xl border-2 p-4 [transform:rotateY(180deg)] [backface-visibility:hidden] ${
            accent === "lime" ? "border-lime/60 bg-lime/10" : "border-magenta/60 bg-magenta/10"
          }`}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {label}
            </div>
            <div
              className={`font-display text-3xl font-black uppercase leading-none ${
                accent === "lime" ? "text-lime" : "text-magenta"
              }`}
            >
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
