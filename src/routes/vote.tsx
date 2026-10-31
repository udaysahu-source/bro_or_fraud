import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buzz } from "@/lib/haptics";
import { ArrowLeft, User, ShieldAlert, Check } from "lucide-react";

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
  { name: "Aarav" },
  { name: "Priya" },
  { name: "Rohan" },
  { name: "Isha" },
  { name: "Kabir" },
  { name: "Meera" },
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

  const timerColor =
    seconds > 20
      ? "bg-[var(--brand-gold)]"
      : seconds > 10
        ? "bg-amber-500"
        : "bg-[var(--brand-pink)]";
  const warn = seconds <= 10;

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-safe pb-32">
        <header className="flex items-center justify-between pt-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Leave</span>
          </Link>
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            Round 3 · Word: Chai
          </div>
        </header>

        {/* Timer */}
        <div className="mt-4" role="timer" aria-live="polite">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Time to vote
            </span>
            <span
              className={`text-xl font-bold tabular-nums ${
                warn ? "text-[var(--brand-pink)] animate-pulse" : "text-[var(--brand-gold)]"
              }`}
            >
              0:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--chip)]">
            <div
              className={`h-full ${timerColor} transition-all duration-1000 ease-linear rounded-full`}
              style={{ width: `${(seconds / 30) * 100}%` }}
            />
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Who's the <span className="text-[var(--brand-pink)]">Fraud</span>?
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Tap the sus one. You can change your vote until you confirm.
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
                className={`relative rounded-[var(--radius-card)] border p-4 text-left transition-all duration-200 cursor-pointer min-h-[100px] flex flex-col justify-between ${
                  active
                    ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/15 shadow-sm"
                    : "border-[var(--separator)] bg-[var(--card)] hover:border-[var(--text-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="grid size-9 place-items-center rounded-xl bg-[var(--chip)] text-[var(--text)]">
                    <User size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                    P{i + 1}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold truncate">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                    {active ? (
                      <span className="text-[var(--brand-pink)] font-semibold flex items-center gap-1">
                        <Check size={12} strokeWidth={2} /> Selected
                      </span>
                    ) : (
                      "Tap to vote"
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating confirm */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 pb-safe ${
          selected === null ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto w-full max-w-md px-5 pb-4 pt-2">
          <div className="rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)]/95 p-3.5 backdrop-blur-md shadow-lg">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Voting for</span>
              <span className="text-sm font-bold text-[var(--brand-pink)]">
                {selected !== null && PLAYERS[selected].name}
              </span>
            </div>
            <Link
              to="/reveal"
              onClick={() => buzz([40, 20, 60])}
              className="block w-full rounded-[var(--radius-btn)] bg-[var(--brand-gold)] px-6 py-4 text-center text-sm font-bold text-[var(--btn-text-on-gold)] shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
            >
              Confirm Vote →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
