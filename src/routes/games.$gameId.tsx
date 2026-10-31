import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import React, { lazy, Suspense } from "react";
import { type SecretVoteConfig } from "@/components/games/secret-vote/SecretVoteEngine";
import { getLocalizedText } from "@/lib/games/loader";
import { Lock, Gamepad2, AlertCircle } from "lucide-react";

// Code-split each game mode engine for performance
const SecretVoteEngine = lazy(() =>
  import("@/components/games/secret-vote/SecretVoteEngine").then((m) => ({
    default: m.SecretVoteEngine,
  })),
);
const PassTheBombEngine = lazy(() =>
  import("@/components/games/pass-the-bomb/PassTheBombEngine").then((m) => ({
    default: m.PassTheBombEngine,
  })),
);
const ConfessionRouletteEngine = lazy(() =>
  import("@/components/games/confession-roulette/ConfessionRouletteEngine").then((m) => ({
    default: m.ConfessionRouletteEngine,
  })),
);
const HeadsUpEngine = lazy(() =>
  import("@/components/games/heads-up/HeadsUpEngine").then((m) => ({
    default: m.HeadsUpEngine,
  })),
);

const NEVER_HAVE_I_EVER_CONFIG: SecretVoteConfig = {
  gameId: "never-have-i-ever",
  gameName: "Never Have I Ever",
  gameTagline: "Hostel Edition • Spill the tea without getting caught",
  instructions: {
    steps: [
      {
        title: "Pass the Phone",
        desc: "Each student secretly taps whether they have done it or not.",
      },
      {
        title: "Aggregate Reveal",
        desc: "See the total count of guilty friends without revealing identities!",
      },
      {
        title: "Detective Mode",
        desc: "Accuse and guess which friend is guilty for bonus points!",
      },
    ],
  },
  getPromptText: (item: any, lang) => ({
    main: getLocalizedText(item?.statement || item?.prompt, lang),
    sub: "Never Have I Ever...",
  }),
  options: [
    {
      id: "have",
      label: { hinglish: "Maine Kiya Hai", en: "I Have" },
      emoji: "Hand",
      color: "from-amber-500 to-rose-600",
    },
    {
      id: "never",
      label: { hinglish: "Kabhi Nahi Kiya", en: "I Have Never" },
      emoji: "ShieldCheck",
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "skip",
      label: { hinglish: "Paani Peeyo / Pass", en: "Sip / Pass" },
      emoji: "Coffee",
      color: "from-slate-600 to-slate-800",
    },
  ],
  detectiveModeAvailable: true,
};

const WOULD_YOU_RATHER_CONFIG: SecretVoteConfig = {
  gameId: "would-you-rather",
  gameName: "Would You Rather",
  gameTagline: "Hostel Dilemmas • No easy ways out",
  instructions: {
    steps: [
      {
        title: "Pick Option A or B",
        desc: "Secretly vote which chaotic situation you would endure.",
      },
      { title: "Split Reveal", desc: "See which option the room chose." },
      { title: "20s Defense", desc: "Defend your choice against the minority or majority!" },
    ],
  },
  getPromptText: (item: any, lang) => ({
    main: "Would You Rather...",
    choiceA: getLocalizedText(item?.optionA, lang),
    choiceB: getLocalizedText(item?.optionB, lang),
  }),
  options: [
    {
      id: "A",
      label: { hinglish: "Option A", en: "Option A" },
      emoji: "Sparkles",
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: "B",
      label: { hinglish: "Option B", en: "Option B" },
      emoji: "Flame",
      color: "from-purple-600 to-pink-500",
    },
  ],
  allowDebate: true,
  debateSeconds: 20,
  majorityScoring: true,
};

const GARMA_GARAM_CONFIG: SecretVoteConfig = {
  gameId: "garma-garam-takes",
  gameName: "Garma-Garam Takes",
  gameTagline: "Campus Hot Takes • Defend your stance",
  instructions: {
    steps: [
      {
        title: "Take a Stance",
        desc: "Vote Agree or Disagree secretly on spicy campus statements.",
      },
      {
        title: "Near-Tie Debate",
        desc: "If the room is split close to 50/50, a 30s debate is triggered!",
      },
      {
        title: "Re-Vote & Flip",
        desc: "Students can flip sides during debate for persuasion bonuses!",
      },
    ],
  },
  getPromptText: (item: any, lang) => ({
    main: getLocalizedText(item?.statement || item?.prompt, lang),
    sub: "Hot Take:",
  }),
  options: [
    {
      id: "agree",
      label: { hinglish: "100% Sahi Hai (Agree)", en: "Agree" },
      emoji: "Flame",
      color: "from-red-600 to-amber-500",
    },
    {
      id: "disagree",
      label: { hinglish: "Bilkul Bakwas (Disagree)", en: "Disagree" },
      emoji: "ShieldAlert",
      color: "from-cyan-600 to-blue-600",
    },
  ],
  allowDebate: true,
  allowReVote: true,
  debateSeconds: 30,
};

export const Route = createFileRoute("/games/$gameId")({
  component: GameRouteComponent,
});

function GameLoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative">
        <div className="size-12 rounded-full border-2 border-[var(--separator)] border-t-[var(--brand-gold)] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-[var(--gold-text)]">
          <Gamepad2 className="size-5" strokeWidth={1.5} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold-text)]">
          Loading Mode
        </p>
        <p className="text-xs text-[var(--text-secondary)]">Preparing party deck...</p>
      </div>
    </div>
  );
}

function GameRouteComponent() {
  const { gameId } = useParams({ from: "/games/$gameId" });

  let content: React.ReactNode;
  switch (gameId) {
    case "never-have-i-ever":
      content = <SecretVoteEngine config={NEVER_HAVE_I_EVER_CONFIG} />;
      break;
    case "would-you-rather":
      content = <SecretVoteEngine config={WOULD_YOU_RATHER_CONFIG} />;
      break;
    case "pass-the-bomb":
      content = <PassTheBombEngine />;
      break;
    case "garma-garam-takes":
      content = <SecretVoteEngine config={GARMA_GARAM_CONFIG} />;
      break;
    case "hot-seat":
      content = (
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="size-16 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] grid place-items-center text-[var(--gold-text)]">
            <Lock className="size-7" strokeWidth={1.5} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--chip)] text-[var(--pink-text)] border border-[var(--separator)]">
            Mode Paused
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Taking a Break</h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-[28ch]">
            This mode has been temporarily taken offline for tuning. Check out the active party
            modes!
          </p>
          <Link
            to="/"
            className="min-h-[44px] px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--brand-gold)] text-[var(--on-gold)] font-bold text-xs uppercase transition-all"
          >
            ← Back to Party Hub
          </Link>
        </div>
      );
      break;
    case "confession-roulette":
      content = <ConfessionRouletteEngine />;
      break;
    case "heads-up-tilt":
      content = <HeadsUpEngine />;
      break;
    default:
      content = (
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="size-16 rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--separator)] grid place-items-center text-[var(--pink-text)]">
            <AlertCircle className="size-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold">Game Mode Not Found</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            The game mode "{gameId}" does not exist in the party hub.
          </p>
          <Link
            to="/"
            className="min-h-[44px] px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--chip)] text-[var(--text)] font-bold text-xs"
          >
            ← Back to Party Hub
          </Link>
        </div>
      );
  }

  return <Suspense fallback={<GameLoadingSkeleton />}>{content}</Suspense>;
}
