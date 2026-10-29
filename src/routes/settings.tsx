import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import { playDiscussionStartSound } from "@/lib/audio";
import {
  DEFAULT_SETTINGS,
  SETTINGS_PRESETS,
  loadSettings,
  saveSettings,
  type MatchSettings,
  type RevealStyle,
  type PresetKey,
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
  {
    id: "auto",
    label: "Auto Reveal (3s)",
    blurb: "Countdown, then flip. Hands-free.",
    emoji: "⏱️",
  },
];

function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [preset, setPreset] = useState<PresetKey>("standard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setS(loaded);
    // Detect preset match
    const found = (Object.keys(SETTINGS_PRESETS) as Array<"quick" | "standard" | "chaos">).find(
      (key) =>
        SETTINGS_PRESETS[key].settings.rounds === loaded.rounds &&
        SETTINGS_PRESETS[key].settings.timerSeconds === loaded.timerSeconds &&
        SETTINGS_PRESETS[key].settings.revealStyle === loaded.revealStyle,
    );
    setPreset(found || "custom");
    setMounted(true);
  }, []);

  const selectPreset = (key: "quick" | "standard" | "chaos") => {
    buzz(25);
    const target = SETTINGS_PRESETS[key];
    const newSettings: MatchSettings = {
      ...s,
      ...target.settings,
      preset: key,
    };
    setS(newSettings);
    setPreset(key);
    saveSettings(newSettings);
  };

  const update = <K extends keyof MatchSettings>(k: K, v: MatchSettings[K]) => {
    const next: MatchSettings = { ...s, [k]: v, preset: "custom" };
    setS(next);
    setPreset("custom");
    saveSettings(next);
    buzz(15);
  };

  const totalTime = Math.round((s.rounds * (s.timerSeconds + 50)) / 60);

  const vibe =
    s.timerSeconds <= 20 ? "Blitz 🔥" : s.timerSeconds >= 45 ? "Deep Chill 🧘" : "Balanced 🎯";

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-40">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            onClick={() => buzz(15)}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-1"
          >
            ← Home
          </Link>
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground bg-surface px-2.5 py-1 rounded border border-border">
            Pacing & Rules
          </span>
        </header>

        <section className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-magenta">
            // customization
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-[0.9]">
            Tune the
            <br />
            <span className="text-lime">Chaos</span>
          </h1>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Pick a quick preset or fine-tune round count, timer, and reveal security.
          </p>
        </section>

        {/* Presets */}
        <section className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
              ⚡ Presets
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {preset === "custom" ? "Custom Config" : `${preset} active`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["quick", "standard", "chaos"] as const).map((key) => {
              const p = SETTINGS_PRESETS[key];
              const active = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectPreset(key)}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all tactile tactile-press min-h-[78px] ${
                    active
                      ? "border-lime bg-lime/15 shadow-[0_0_15px_rgba(255,214,0,0.2)]"
                      : "border-border bg-surface text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <span className="text-xl leading-none">{p.emoji}</span>
                  <span className="mt-1.5 text-xs font-black uppercase tracking-wide text-foreground">
                    {p.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {p.settings.rounds}R · {p.settings.timerSeconds}s
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rounds */}
        <Section label="Rounds per Match" hint="How many words to play">
          <div className="grid grid-cols-4 gap-2">
            {ROUNDS.map((n) => (
              <Chip key={n} active={s.rounds === n} onClick={() => update("rounds", n)}>
                {n}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Timer */}
        <Section label="Discussion Timer" hint="Timer before voting">
          <div className="grid grid-cols-4 gap-2">
            {TIMERS.map((n) => (
              <Chip key={n} active={s.timerSeconds === n} onClick={() => update("timerSeconds", n)}>
                {n}s
              </Chip>
            ))}
          </div>
          <SliderBar value={s.timerSeconds} min={10} max={60} />
        </Section>

        {/* Reveal Style */}
        <Section label="Role Reveal Style" hint="How players view secret words">
          <div className="space-y-2.5">
            {REVEAL_STYLES.map((r) => {
              const active = s.revealStyle === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => update("revealStyle", r.id)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all tactile tactile-press ${
                    active
                      ? "border-lime bg-lime/10 shadow-[0_0_15px_rgba(255,214,0,0.15)]"
                      : "border-border bg-surface hover:border-white/20"
                  }`}
                >
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-xl text-2xl ${
                      active ? "bg-lime/20" : "bg-void border border-border"
                    }`}
                  >
                    {r.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black uppercase tracking-wide text-foreground">
                      {r.label}
                    </div>
                    <div className="text-xs text-muted-foreground leading-snug">{r.blurb}</div>
                  </div>
                  <div
                    className={`size-5 shrink-0 rounded-full border-2 ${
                      active ? "border-lime bg-lime" : "border-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Section>

        {/* Sound Effects */}
        <Section label="Audio Synthesizer" hint="In-browser WebAudio FX">
          <button
            type="button"
            onClick={() => {
              const nextVal = s.soundEnabled === false;
              update("soundEnabled", nextVal);
              if (nextVal) {
                playDiscussionStartSound();
              }
            }}
            className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all tactile tactile-press ${
              s.soundEnabled !== false
                ? "border-lime bg-lime/10 shadow-[0_0_15px_rgba(255,214,0,0.15)]"
                : "border-border bg-surface hover:border-white/20"
            }`}
          >
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-xl text-2xl ${
                s.soundEnabled !== false ? "bg-lime/20" : "bg-void border border-border"
              }`}
            >
              {s.soundEnabled !== false ? "🔊" : "🔇"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black uppercase tracking-wide text-foreground">
                {s.soundEnabled !== false ? "Sound FX Enabled" : "Sound Muted"}
              </div>
              <div className="text-xs text-muted-foreground leading-snug">
                {s.soundEnabled !== false
                  ? "Cues for secret reveals, timer alert & roasts"
                  : "Silent gameplay without audio synth"}
              </div>
            </div>
            <div
              className={`size-5 shrink-0 rounded-full border-2 ${
                s.soundEnabled !== false ? "border-lime bg-lime" : "border-border"
              }`}
            />
          </button>
        </Section>
      </div>

      {/* Sticky bottom bar with Est. Time + Vibe + Start Game CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-void via-void/95 to-transparent pb-safe pt-2">
        <div className="mx-auto w-full max-w-md px-5 pb-5 pt-2">
          <div className="rounded-2xl border-2 border-border bg-surface/90 p-3.5 shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Est. Match Time
                </span>
                <div className="text-lg font-black font-display text-foreground">
                  ~{totalTime} min
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Room Vibe
                </span>
                <div className="text-sm font-black uppercase text-lime">{vibe}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                saveSettings(s);
                buzz([30, 20, 40]);
                navigate({ to: "/play/setup" });
              }}
              className="block w-full rounded-xl bg-lime px-6 py-4 text-center text-base font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press"
            >
              Start Game →
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
    <section className="mt-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{label}</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 py-3 text-center font-display text-base font-black transition-all tactile tactile-press min-h-[48px] ${
        active
          ? "border-lime bg-lime text-void shadow-sm"
          : "border-border bg-surface text-foreground hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function SliderBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(5, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border">
      <div
        className="h-full bg-lime transition-all duration-300 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
