import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { buzz, success as hapticSuccess, reveal as hapticReveal } from "@/lib/haptics";
import { ArrowLeft, Globe, Wifi, KeyRound } from "lucide-react";

export const Route = createFileRoute("/online/lobby")({
  component: OnlineLobby,
  head: () => ({
    meta: [
      { title: "Online Lobby — Bro or Fraud?" },
      { name: "description", content: "Join or create an online multiplayer room." },
    ],
  }),
});

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function OnlineLobby() {
  const navigate = useNavigate();
  const [joinDigits, setJoinDigits] = useState<string[]>(["", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(-1);
    setJoinDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });

    if (clean && index < 3) {
      joinRefs.current[index + 1]?.focus();
    }
  };

  const handleCreateRoom = () => {
    buzz([30, 20, 30]);
    setIsCreating(true);
    hapticReveal();

    // Simulate optimistic room creation, then navigate to room
    const code = generateRoomCode().toUpperCase();
    sessionStorage.setItem("bof:hosting", code); // Tag this client as the host for this code
    setTimeout(() => {
      hapticSuccess();
      navigate({
        to: "/online/room/$code",
        params: { code },
      });
      setIsCreating(false);
    }, 600);
  };

  const handleJoinSubmit = () => {
    const code = joinDigits.join("").toUpperCase();
    if (code.length !== 4) return;
    buzz([20, 20]);
    setIsJoining(true);

    sessionStorage.removeItem("bof:hosting"); // Ensure this client joins as a guest
    setTimeout(() => {
      hapticSuccess();
      navigate({
        to: "/online/room/$code",
        params: { code },
      });
      setIsJoining(false);
    }, 600);
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-safe pb-8">
        <header className="flex items-center justify-between pt-4">
          <Link
            to="/"
            onClick={() => buzz(15)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Home</span>
          </Link>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Online Matchmaking
          </span>
        </header>

        <section className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--chip)] text-[11px] font-semibold text-[var(--brand-gold)] mb-3">
            <Wifi size={12} strokeWidth={1.5} />
            <span>Serverless Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Online Lobby</h1>
          <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[32ch] mx-auto">
            Play with friends remotely on separate phones.
          </p>
        </section>

        <div className="flex-1 flex flex-col justify-center gap-4 mt-8">
          {/* Create Room Card */}
          <div className="rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={18} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
              <h2 className="text-base font-bold tracking-tight">Host a Room</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Start a new game session, choose word packs, and invite players.
            </p>
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="mt-4 w-full rounded-[var(--radius-btn)] bg-[var(--brand-gold)] px-6 py-4 text-center text-sm font-bold text-[var(--btn-text-on-gold)] shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer min-h-[48px] disabled:opacity-50"
            >
              {isCreating ? "Generating Room..." : "Create New Room →"}
            </button>
          </div>

          {/* Join Room Card */}
          <div className="rounded-[var(--radius-card)] border border-[var(--separator)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound size={18} strokeWidth={1.5} className="text-[var(--brand-pink)]" />
              <h2 className="text-base font-bold tracking-tight">Join Existing</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Enter the 4-digit code generated by the host.
            </p>

            <div className="mt-4 flex justify-center gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  ref={(el) => {
                    joinRefs.current[i] = el;
                  }}
                  maxLength={1}
                  value={joinDigits[i]}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !joinDigits[i] && i > 0) {
                      joinRefs.current[i - 1]?.focus();
                    }
                  }}
                  className="grid size-13 place-items-center rounded-[var(--radius-group)] border border-[var(--separator)] bg-[var(--chip)] text-center text-xl font-bold text-[var(--text)] focus:border-[var(--brand-gold)] focus:outline-none uppercase min-h-[48px] min-w-[48px]"
                />
              ))}
            </div>

            {joinDigits.every((d) => d) && (
              <button
                onClick={handleJoinSubmit}
                disabled={isJoining}
                className="mt-4 w-full rounded-[var(--radius-btn)] bg-[var(--brand-pink)] px-6 py-3.5 text-center text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer min-h-[48px] disabled:opacity-50"
              >
                {isJoining ? "Connecting..." : `Join Room ${joinDigits.join("")} →`}
              </button>
            )}
          </div>
        </div>

        <p className="pt-6 text-center text-[11px] text-[var(--text-secondary)]">
          Stateless matchmaking · Powered by WebRTC PeerJS
        </p>
      </div>
    </div>
  );
}
