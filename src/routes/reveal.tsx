import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import { renderShareCard, shareCard } from "@/lib/share-card";
import {
  ArrowLeft,
  Camera,
  MessageSquare,
  Share2,
  ShieldAlert,
  Flame,
  User,
  Crown,
  Eye,
  Zap,
} from "lucide-react";

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
  fraudEmoji: "Eye",
  word: "Chai",
  fraudGuess: "Coffee",
  roast: "Bro got cooked faster than Maggi in a hostel kettle",
  scores: [
    { name: "Aarav", points: 320, icon: Crown },
    { name: "Rohan", points: 280, icon: Zap },
    { name: "Isha", points: 210, icon: Flame },
    { name: "Priya", points: 150, icon: ShieldAlert },
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
        scores: MATCH.scores.map((s) => ({ name: s.name, points: s.points, emoji: "User" })),
      });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setOpenPreview(true);
      const text =
        target === "wa"
          ? `${MATCH.fraudName} got exposed as the FRAUD. Word was "${MATCH.word}". Play with us:`
          : `Bro or Fraud? ${MATCH.fraudName} got cooked`;
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
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-safe pb-8">
        <header className="flex items-center justify-between pt-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Home</span>
          </Link>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Round 3 · Verdict
          </span>
        </header>

        {/* Banner */}
        <section className="mt-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Final Verdict
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight">
            {broWon ? (
              <>
                <span className="text-[var(--brand-gold)]">Bro</span> caught the{" "}
                <span className="text-[var(--brand-pink)]">Fraud</span>
              </>
            ) : (
              <>
                <span className="text-[var(--brand-pink)]">Fraud</span> Escaped
              </>
            )}
          </h1>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <FlipCard flipped={flipped} label="Real Word" value={MATCH.word} accent="gold" />
          <FlipCard
            flipped={flipped}
            label="Fraud thought"
            value={MATCH.fraudGuess}
            accent="pink"
            delay={200}
          />
        </div>

        {/* Fraud reveal card */}
        <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-pink)]/15 text-[var(--brand-pink)]">
              <ShieldAlert size={28} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-pink)]">
                The fraud was
              </div>
              <div className="truncate text-xl font-bold">{MATCH.fraudName}</div>
              <div className="text-xs text-[var(--text-secondary)]">3 of 5 voted correctly</div>
            </div>
          </div>
          <div className="mt-4 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-gold)]">
              Roast of the Match
            </div>
            <p className="mt-1 text-xs text-[var(--text)] font-medium italic">
              &quot;{MATCH.roast}&quot;
            </p>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="mt-4 space-y-1.5">
          {MATCH.scores.map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--card)] px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-4 text-xs font-bold text-[var(--text-secondary)] tabular-nums">
                    {i + 1}
                  </span>
                  <div className="grid size-7 place-items-center rounded-lg bg-[var(--chip)] text-[var(--text)]">
                    <Icon size={14} strokeWidth={1.5} />
                  </div>
                  <span className="truncate text-xs font-semibold">{row.name}</span>
                </div>
                <span className="text-xs font-bold text-[var(--brand-gold)] tabular-nums">
                  +{row.points}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Sticky actions */}
        <div className="mt-6 space-y-3">
          <Link
            to="/vote"
            onClick={() => buzz(40)}
            className="block w-full rounded-[var(--radius-btn)] bg-[var(--brand-gold)] px-6 py-4 text-center text-base font-bold text-[var(--btn-text-on-gold)] shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
          >
            Next Round →
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <ShareBtn
              busy={sharing === "insta"}
              onClick={() => handleShare("insta")}
              label="Instagram"
              icon={Camera}
            />
            <ShareBtn
              busy={sharing === "wa"}
              onClick={() => handleShare("wa")}
              label="WhatsApp"
              icon={MessageSquare}
            />
            <ShareBtn
              busy={sharing === "native"}
              onClick={() => handleShare("native")}
              label="More"
              icon={Share2}
            />
          </div>
          <p className="text-center text-[11px] text-[var(--text-secondary)]">
            Branded card auto-generated · Tap to save & share
          </p>
        </div>
      </div>

      {/* Preview modal */}
      {openPreview && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
          onClick={() => setOpenPreview(false)}
        >
          <div className="w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-center text-xs font-semibold text-[var(--brand-gold)]">
              Share Card
            </div>
            <img
              src={preview}
              alt="Match recap share card"
              className="w-full rounded-[var(--radius-card)] border border-[var(--separator)] shadow-2xl"
            />
            <button
              onClick={() => setOpenPreview(false)}
              className="w-full rounded-[var(--radius-btn)] border border-[var(--separator)] bg-[var(--card)] px-4 py-3 text-xs font-bold text-[var(--text)] hover:opacity-80 min-h-[44px] cursor-pointer"
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
  icon: Icon,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--card)] p-3 text-xs font-semibold text-[var(--text)] hover:border-[var(--brand-gold)] disabled:opacity-60 cursor-pointer min-h-[54px]"
    >
      <Icon size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
      <span className="text-[11px]">{busy ? "…" : label}</span>
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
  accent: "gold" | "pink";
  delay?: number;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(flipped), delay);
    return () => clearTimeout(t);
  }, [flipped, delay]);

  const isGold = accent === "gold";

  return (
    <div className="relative aspect-[3/4] w-full [perspective:1000px]">
      <div
        className="absolute inset-0 transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: on ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div className="absolute inset-0 grid place-items-center rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] text-3xl font-bold text-[var(--text-secondary)] [backface-visibility:hidden]">
          ?
        </div>
        <div
          className={`absolute inset-0 rounded-[var(--radius-card)] border p-4 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between ${
            isGold
              ? "border-[var(--brand-gold)]/60 bg-[var(--brand-gold)]/10"
              : "border-[var(--brand-pink)]/60 bg-[var(--brand-pink)]/10"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </div>
          <div
            className={`text-2xl font-bold tracking-tight uppercase leading-none ${
              isGold ? "text-[var(--brand-gold)]" : "text-[var(--brand-pink)]"
            }`}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
