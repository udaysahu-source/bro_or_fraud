import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type MatchSettings,
  type RevealStyle,
} from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    meta: [
      { title: "Match Settings — Bro or Fraud?" },
      { name: "description", content: "Tune rounds, timer length, and how roles get revealed." },
      { property: "og:title", content: "Match Settings" },
      { property: "og:description", content: "Dial in the pacing before you start the chaos." },
    ],
  }),
});

const ROUNDS = [3, 5, 7, 10];
const TIMERS = [15, 30, 45, 60];
const REVEAL_STYLES: { id: RevealStyle; label: string; blurb: string; emoji: string }[] = [
  { id: "hold", label: "Hold to Reveal", blurb: "Press & hold 0.5s. Peeker-proof.", emoji: "🔒" },
  { id: "tap", label: "Tap to Reveal", blurb: "Single tap. Fastest handoff.", emoji: "👆" },
  { id: "auto", label: "Auto Reveal (3s)", blurb: "Countdown, then flip. Hands-free.", emoji: "⏱️" },
];

function Settings() {
  const router = useRouter();
  const [s, setS] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = <K extends keyof MatchSettings>(k: K, v: MatchSettings[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
    buzz(15);
  };

  const totalTime = Math.round((s.rounds * (s.timerSeconds + 60)) / 60);

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-32">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            ← Back
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Match Settings
          </span>
        </header>

        <section className="mt-6">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-magenta">
            // pacing
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-[0.9]">
            Tune the<br />
            <span className="text-lime">Chaos</span>
          </h1>
        </section>

        {/* Rounds */}
        <Section label="Rounds" hint="How many words per match">
          <div className="grid grid-cols-4 gap-2">
            {ROUNDS.map((n) => (
              <Chip key={n} active={s.rounds === n} onClick={() => update("rounds", n)}>
                {n}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Timer */}
        <Section label="Voting Timer" hint="Seconds per vote">
          <div className="grid grid-cols-4 gap-2">
            {TIMERS.map((n) => (
              <Chip
                key={n}
                active={s.timerSeconds === n}
                onClick={() => update("timerSeconds", n)}
              >
                {n}s
              </Chip>
            ))}
          </div>
          <SliderBar value={s.timerSeconds} min={10} max={90} />
        </Section>

        {/* Reveal Style */}
        <Section label="Role Reveal Style" hint="How players see their word">
          <div className="space-y-2">
            {REVEAL_STYLES.map((r) => {
              const active = s.revealStyle === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => update("revealStyle", r.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left tactile tactile-press ${
                    active
                      ? "border-lime bg-lime/10"
                      : "border-white/10 bg-surface"
                  }`}
                >
                  <div
                    className={`grid size-12 shrink-0 place-items-center rounded-xl text-2xl ${
                      active ? "bg-lime/20" : "bg-white/5"
                    }`}
                  >
                    {r.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black uppercase tracking-wide">
                      {r.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.blurb}</div>
                  </div>
                  <div
                    className={`size-5 shrink-0 rounded-full border-2 ${
                      active ? "border-lime bg-lime" : "border-white/20"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Section>

        {/* Estimate */}
        <div className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Est. match time
              </div>
              <div className="mt-1 font-display text-3xl font-black tabular-nums">
                ~{totalTime} min
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Vibe
              </div>
              <div className="mt-1 text-sm font-black uppercase text-lime">
                {s.timerSeconds <= 20
                  ? "Blitz 🔥"
                  : s.timerSeconds >= 45
                    ? "Chill 🧘"
                    : "Balanced ⚖️"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md px-5 pb-6 pt-3">
          <div className="rounded-2xl border-2 border-white/10 bg-black/60 p-3 backdrop-blur-md">
            <button
              onClick={() => {
                saveSettings(s);
                buzz([30, 20, 40]);
                router.navigate({ to: "/" });
              }}
              className="block w-full rounded-xl bg-lime px-6 py-4 text-center text-lg font-black uppercase tracking-wide text-void tactile tactile-press"
            >
              {dirty ? "Save & Back →" : "Looks Good →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest">{label}</h2>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {hint}
        </span>
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 py-3 text-center font-display text-lg font-black tactile tactile-press ${
        active
          ? "border-lime bg-lime text-void"
          : "border-white/10 bg-surface text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SliderBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full bg-lime transition-all"
        style={{ width: `${Math.max(4, pct)}%` }}
      />
    </div>
  );
}
