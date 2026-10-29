import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";

export const Route = createFileRoute("/vote")({
  component: Vote,
  head: () => ({
    meta: [
      { title: "Vote the Fraud — Bro or Fraud?" },
      { name: "description", content: "Time's ticking. Pick who you think is the fraud." },
      { property: "og:title", content: "Who's the Fraud?" },
      { property: "og:description", content: "Cast your vote before the timer runs out." },
    ],
  }),
});

const PLAYERS = [
  { name: "Aarav", emoji: "🦁", color: "from-lime/40 to-transparent" },
  { name: "Priya", emoji: "🦊", color: "from-magenta/40 to-transparent" },
  { name: "Rohan", emoji: "🐻", color: "from-lime/30 to-magenta/30" },
  { name: "Isha", emoji: "🐯", color: "from-magenta/40 to-lime/20" },
  { name: "Kabir", emoji: "🐸", color: "from-lime/40 to-transparent" },
  { name: "Meera", emoji: "🐙", color: "from-magenta/40 to-transparent" },
];

function Vote() {
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => {
      setSeconds(seconds - 1);
      if (seconds - 1 <= 10 && seconds - 1 > 0) buzz(10);
    }, 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const timerColor = seconds > 20 ? "bg-lime" : seconds > 10 ? "bg-yellow-400" : "bg-magenta";
  const warn = seconds <= 10;

  return (
    <div className="min-h-dvh bg-void">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-32">
        <header className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            ← Leave
          </Link>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Round 3 · Word: Chai
          </div>
        </header>

        {/* Timer */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Time to vote
            </span>
            <span
              className={`font-display text-2xl font-black tabular-nums ${
                warn ? "text-magenta animate-timer-warn" : "text-lime"
              }`}
            >
              0:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full ${timerColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${(seconds / 30) * 100}%` }}
            />
          </div>
        </div>

        <h1 className="mt-8 text-4xl font-black uppercase leading-[0.9]">
          Who's the
          <br />
          <span className="text-magenta">Fraud?</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap the sus one. You can change until you confirm.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {PLAYERS.map((p, i) => {
            const active = selected === i;
            return (
              <button
                key={p.name}
                onClick={() => {
                  setSelected(i);
                  buzz(20);
                }}
                className={`relative rounded-2xl border-3 bg-gradient-to-br ${p.color} bg-surface p-5 text-left transition-all duration-200 tactile tactile-press ${
                  active
                    ? "border-magenta scale-105 shadow-[0_0_25px_rgba(255,45,85,0.45)] z-10"
                    : "border-white/10 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    P{i + 1}
                  </span>
                </div>
                <div className="mt-4 text-base font-black uppercase">{p.name}</div>
                <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                  {active ? "Voted 🚨" : "Tap to vote"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating confirm */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${
          selected === null ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto w-full max-w-md px-5 pb-6 pt-3">
          <div className="rounded-2xl border-2 border-white/10 bg-black/60 p-3 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Voting for
              </span>
              <span className="text-sm font-black uppercase text-magenta">
                {selected !== null && PLAYERS[selected].name}
              </span>
            </div>
            <Link
              to="/reveal"
              onClick={() => buzz([40, 20, 60])}
              className="block w-full rounded-xl bg-lime px-6 py-4 text-center text-lg font-black uppercase tracking-wide text-void tactile tactile-press"
            >
              Confirm Vote →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
