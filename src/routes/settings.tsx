import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import {
  DEFAULT_SETTINGS,
  SETTINGS_PRESETS,
  loadSettings,
  saveSettings,
  type MatchSettings,
  type RevealStyle,
  type PresetKey,
} from "@/lib/settings";
import {
  Zap,
  Target,
  Flame,
  Lock,
  Hand,
  Clock,
  Volume2,
  VolumeX,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Sliders,
  Check,
} from "lucide-react";

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
const REVEAL_STYLES: {
  id: RevealStyle;
  label: string;
  blurb: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "hold", label: "Hold to Reveal", blurb: "Press & hold 0.5s. Peeker-proof.", icon: Lock },
  { id: "tap", label: "Tap to Reveal", blurb: "Single tap. Fastest handoff.", icon: Hand },
  {
    id: "auto",
    label: "Auto Reveal (3s)",
    blurb: "Countdown, then flip. Hands-free.",
    icon: Clock,
  },
];

function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [preset, setPreset] = useState<PresetKey>("standard");
  const [themeMode, setThemeMode] = useState<"auto" | "light" | "dark">("auto");
  const [keepAwake, setKeepAwake] = useState(true);

  useEffect(() => {
    const loaded = loadSettings();
    setS(loaded);

    // Preset check
    const found = (Object.keys(SETTINGS_PRESETS) as Array<"quick" | "standard" | "chaos">).find(
      (key) =>
        SETTINGS_PRESETS[key].settings.rounds === loaded.rounds &&
        SETTINGS_PRESETS[key].settings.timerSeconds === loaded.timerSeconds &&
        SETTINGS_PRESETS[key].settings.revealStyle === loaded.revealStyle,
    );
    setPreset(found || "custom");

    // Load theme from localStorage
    const savedTheme = localStorage.getItem("bof_theme") as "auto" | "light" | "dark" | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
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

  const handleThemeChange = (mode: "auto" | "light" | "dark") => {
    buzz(15);
    setThemeMode(mode);
    localStorage.setItem("bof_theme", mode);
    if (mode === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (mode === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const totalTime = Math.round((s.rounds * (s.timerSeconds + 50)) / 60);

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand-gold)]/20">
      {/* UNIFORM FRAME: TOP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--separator)]">
        <Link
          to="/"
          onClick={() => buzz(15)}
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-[var(--radius-btn)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--chip)] transition-colors"
        >
          ← Home
        </Link>

        <span className="text-sm font-bold tracking-tight text-[var(--text)]">Settings</span>

        <button
          type="button"
          onClick={() => {
            buzz(20);
            setS(DEFAULT_SETTINGS);
            setPreset("standard");
            saveSettings(DEFAULT_SETTINGS);
          }}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] min-h-[44px] px-2"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.5} />
          <span>Reset</span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-6">
        {/* Presets */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text)] flex items-center gap-1.5">
              <Zap className="size-3.5 text-[var(--gold-text)]" strokeWidth={1.5} />
              <span>Presets</span>
            </span>
            <span className="text-[var(--gold-text)] capitalize">
              {preset === "custom" ? "Custom Config" : `${preset} active`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "quick" as const, name: "Quick Blitz", icon: Zap },
              { key: "standard" as const, name: "Standard", icon: Target },
              { key: "chaos" as const, name: "Pure Chaos", icon: Flame },
            ].map(({ key, name, icon: Icon }) => {
              const active = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectPreset(key)}
                  className={`flex flex-col items-center justify-center rounded-[var(--radius-group)] p-3 border transition-all min-h-[80px] cursor-pointer ${
                    active
                      ? "bg-[var(--card)] border-[var(--brand-gold)] shadow-[0_0_16px_rgba(251,191,36,0.15)] text-[var(--gold-text)]"
                      : "bg-[var(--card)] border-[var(--separator)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon className="size-5 mb-1" strokeWidth={1.5} />
                  <span className="text-xs font-bold text-[var(--text)]">{name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Display / Theme Mode */}
        <section className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
            <span className="flex items-center gap-1.5">
              <Sun className="size-4 text-[var(--gold-text)]" strokeWidth={1.5} />
              <span>Appearance</span>
            </span>
            <span className="text-[var(--text-secondary)] capitalize">{themeMode}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: "auto" as const, label: "System", icon: Monitor },
              { mode: "dark" as const, label: "Dark", icon: Moon },
              { mode: "light" as const, label: "Light", icon: Sun },
            ].map(({ mode, label, icon: Icon }) => {
              const active = themeMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleThemeChange(mode)}
                  className={`py-2 px-3 rounded-[var(--radius-btn)] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--brand-gold)] text-[var(--on-gold)] border-[var(--brand-gold)] font-bold"
                      : "bg-[var(--chip)] text-[var(--text-secondary)] border-[var(--separator)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon className="size-3.5" strokeWidth={1.5} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rounds and Timers */}
        <section className="space-y-4 p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)]">
          {/* Rounds */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
              <span>Total Rounds</span>
              <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                {s.rounds} Rounds
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {ROUNDS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("rounds", r)}
                  className={`py-2 rounded-[var(--radius-btn)] text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                    s.rounds === r
                      ? "bg-[var(--brand-gold)] text-[var(--on-gold)]"
                      : "bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Timers */}
          <div className="space-y-2 pt-2 border-t border-[var(--separator)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
              <span>Discussion Timer</span>
              <span className="font-mono text-[var(--gold-text)] font-bold tabular-nums">
                {s.timerSeconds}s
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {TIMERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update("timerSeconds", t)}
                  className={`py-2 rounded-[var(--radius-btn)] text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                    s.timerSeconds === t
                      ? "bg-[var(--brand-gold)] text-[var(--on-gold)]"
                      : "bg-[var(--chip)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] block">
              Estimated game duration: ~{totalTime} minutes
            </span>
          </div>
        </section>

        {/* Reveal Security Style */}
        <section className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3">
          <span className="text-xs font-semibold text-[var(--text)] block">Role Reveal Style</span>
          <div className="space-y-2">
            {REVEAL_STYLES.map(({ id, label, blurb, icon: Icon }) => {
              const active = s.revealStyle === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => update("revealStyle", id)}
                  className={`w-full p-3 rounded-[var(--radius-group)] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--chip)] border-[var(--brand-gold)] text-[var(--text)]"
                      : "bg-[var(--card)] border-[var(--separator)] text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-[0.5rem] bg-[var(--chip)] grid place-items-center text-[var(--gold-text)]">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">{label}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{blurb}</div>
                    </div>
                  </div>
                  <div
                    className={`size-5 rounded-full border flex items-center justify-center ${
                      active
                        ? "bg-[var(--brand-gold)] border-[var(--brand-gold)] text-[var(--on-gold)]"
                        : "border-[var(--separator)]"
                    }`}
                  >
                    {active && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sound, Haptics & Screen Awake switches */}
        <section className="p-4 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] space-y-3">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Sound FX</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Discussion clock, tick, alarms
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.soundEnabled}
              aria-label="Sound FX toggle"
              onClick={() => update("soundEnabled", !s.soundEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                s.soundEnabled ? "bg-[var(--brand-gold)]" : "bg-[var(--chip)]"
              }`}
            >
              <div
                className={`size-5 rounded-full bg-white transition-transform ${
                  s.soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--separator)]">
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Haptics</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Vibrations on turns and votes
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.hapticsEnabled}
              aria-label="Haptics toggle"
              onClick={() => update("hapticsEnabled", !s.hapticsEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                s.hapticsEnabled ? "bg-[var(--brand-gold)]" : "bg-[var(--chip)]"
              }`}
            >
              <div
                className={`size-5 rounded-full bg-white transition-transform ${
                  s.hapticsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Keep Screen Awake */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--separator)]">
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Keep Screen Awake</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Prevent phone from sleeping
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={keepAwake}
              aria-label="Keep screen awake toggle"
              onClick={() => {
                buzz(15);
                setKeepAwake((v) => !v);
              }}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                keepAwake ? "bg-[var(--brand-gold)]" : "bg-[var(--chip)]"
              }`}
            >
              <div
                className={`size-5 rounded-full bg-white transition-transform ${
                  keepAwake ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
