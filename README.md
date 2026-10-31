# 🕵️‍♂️ Bro or Fraud? (या फिर फ्रॉड?)

> **The ultimate chaotic, mobile-first social deduction & party game hub built for hostel groups, college squads, and late-night house parties.**

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square&logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![WebRTC P2P](https://img.shields.io/badge/Networking-WebRTC_P2P-333333?style=flat-square&logo=webrtc&logoColor=white)](https://peerjs.com/)
[![Offline First](https://img.shields.io/badge/Architecture-100%25_Offline_Ready-22C55E?style=flat-square)](https://github.com/udaysahu-source/bro_or_fraud)
[![Content Schema](https://img.shields.io/badge/Content_Schema-v1.1.0_Verified-FF6B6B?style=flat-square)](./docs/game-packs-guide.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🎯 What is "Bro or Fraud"?

**Bro or Fraud?** is a high-energy party game hub crafted for authentic college and youth banter. 

Whether you're sitting in a cramped hostel room sharing Maggi, waiting between lectures in the canteen, or chilling on a weekend hangout, pull out a single phone or host a room where friends join from their own devices. 

No app store downloads, no account registrations, and no trackers — just pure bluffing, quick thinking, and chaotic roasting.

---

## ✨ Key Features & Highlights

- 📱 **Pass-the-Phone (100% Offline)**: Play anywhere without active WiFi or cellular connection. Hand the single device around the circle.
- 🌐 **P2P Multiplayer (WebRTC Rooms)**: Seamless device-to-device room play powered by [PeerJS](https://peerjs.com/). Low latency, direct peer-to-peer data channels.
- 🎭 **Neo-Brutalist Street Aesthetic**: Vibrant high-contrast UI, bold typography, tactile animations powered by [Framer Motion](https://www.framer.com/motion/), and retro sound synthesis with device vibration haptics.
- 🗣️ **Bilingual Slang (Hinglish + English)**: Relatable campus situations (proxy attendance, internal marks, 8:30 AM lectures, canteen debts, mass bunks).
- 🌶️ **Spice Level Sliders**: Select between **Mild**, **Spicy**, and **Unhinged** modes with built-in content guardrails and skip controls.
- 🗂️ **Custom Deck Studio**: Build, edit, and curate your own word packs, export/import via JSON/CSV, or share via room codes.
- 🔒 **Privacy-First Design**: Zero mandatory login, zero analytics trackers, zero personal data harvesting. All gameplay state lives entirely in your browser memory and peer connections.

---

## 🎮 Game Modes (Party Hub)

In addition to the flagship **Bro or Fraud?** deduction game, the platform features a complete party suite with **7 additional game modes**, **23 curated content packs**, and **690+ verified items**:

| # | Mode | Category | Description | Engine |
|---|------|----------|-------------|--------|
| **1** | **Bro or Fraud?** *(Flagship)* | Social Deduction | Secret words are distributed to "Bros", while the "Fraud" receives nothing. Drop clues, sniff out the faker, and vote them out before they decipher the secret word. | `play.local.tsx` / `online.room.$code.tsx` |
| **2** | **Pass the Bomb** | Word Recall | A ticking time bomb passes around the circle. Shout a valid word matching the category before the fuse explodes in your hands. | `PassTheBombEngine.tsx` |
| **3** | **Heads Up / Forehead Tilt** | Charades | Place the phone on your forehead! Friends shout clues while you tilt up for Pass or tilt down for Correct. Supports gyro tilt controls. | `HeadsUpEngine.tsx` |
| **4** | **Confession Roulette** | Bluff & Party | One anonymous player confession is masked among 4+ plausible ghost/bot answers. Guess whose confession it really is. | `ConfessionRouletteEngine.tsx` |
| **5** | **Never Have I Ever** | Synchronized Voting | Reveal the wildest things your squad has (or hasn't) done with synchronous anonymous voting and percentage reveals. | `SecretVoteEngine.tsx` |
| **6** | **Would You Rather** | Dilemmas & Debates | Brutal 50/50 campus dilemmas. Vote on impossible choices and debate who picked what. | `SecretVoteEngine.tsx` |
| **7** | **Garma-Garam Takes** | Hot Takes | Unfiltered, controversial college opinions that spark loud debates across the room. | `SecretVoteEngine.tsx` |
| **8** | **The Hot Seat** | Roast & Rapid Fire | One chosen player enters the hot seat. The squad fires tailored rapid-fire questions and roasts. | `HotSeatEngine.tsx` |

---

## 🛠️ Tech Stack & Architecture

- **Core Framework**: [TanStack Start](https://tanstack.com/start) with [TanStack Router](https://tanstack.com/router) (type-safe file-based routing)
- **UI & Runtime**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vite.dev/) with Nitro engine
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + custom neo-brutalist theme design system
- **Motion & Audio**: [Framer Motion v12](https://motion.dev/), Web Audio API sound synthesis, Navigator Vibration API
- **P2P Networking**: [PeerJS](https://peerjs.com/) (WebRTC DataChannels with fallback STUN signaling)
- **Validation**: [Zod](https://zod.dev/) v4 schema validation & automated content regression suites

---

## 📂 Repository Structure

```text
├── docs/                     # Content architecture & pack guidelines
│   └── game-packs-guide.md   # Schema specification (v1.1.0) and contribution rules
├── scripts/                  # Automated verification & CLI tooling
│   └── check-content.ts      # Validates JSON schema, bilingual completeness & limits
├── src/
│   ├── components/
│   │   ├── games/            # Specialized engines for all 7 multi-game modes
│   │   └── ui/               # Neo-brutalist buttons, modals, cards, dialogs & badges
│   ├── content/
│   │   └── game-modes.json   # 23 packs, 690+ bilingual questions, prompts & words
│   ├── hooks/                # Device orientation, gyro tilt, audio & timer hooks
│   ├── lib/
│   │   ├── audio.ts          # Synthesized Web Audio arcade effects
│   │   ├── haptics.ts        # Tactile vibration patterns for phone browsers
│   │   ├── room.ts           # PeerJS WebRTC multiplayer room state synchronization
│   │   ├── customPacks.ts    # LocalStorage deck persistence & importer
│   │   └── games/registry.ts # Game mode catalog metadata & categories
│   ├── routes/               # TanStack Start file-based pages
│   │   ├── __root.tsx        # App layout shell, meta headers & settings provider
│   │   ├── index.tsx         # Main landing hub & mode selector
│   │   ├── play.local.tsx    # Single-phone pass-the-phone game flow
│   │   ├── play.setup.tsx    # Game configuration, spice level & pack picker
│   │   ├── online.lobby.tsx  # Host or join room codes
│   │   ├── online.room.*.tsx # Real-time WebRTC multiplayer arena
│   │   └── games.$gameId.tsx # Dynamic runner for Party Hub game engines
│   ├── styles.css            # Global CSS variables, custom typography & utilities
│   └── server.ts             # Server entrypoint for production SSR builds
├── package.json              # Project dependencies and script declarations
├── vite.config.ts            # Vite & TanStack Router configuration
└── tsconfig.json             # TypeScript compiler settings
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `22.x` (LTS recommended)
- **Package Manager**: `npm`, `pnpm`, or `bun`

### 1. Clone the Repository

```bash
git clone https://github.com/udaysahu-source/bro_or_fraud.git
cd bro_or_fraud
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000` (or the port specified by Vite).

### 4. Build for Production

```bash
npm run build
```

This compiles both the static assets and the server-side bundle into the `.vercel/output` and `dist/` directories.

### 5. Preview Production Build

```bash
npm run preview
```

---

## 🧪 Content Testing & Verification

All game modes and packs are governed by a strict data schema to prevent runtime missing text or broken gameplay states.

To run the automated content verification suite:

```bash
npm run content:check
```

What the validator asserts:
- ✅ Schema conformance for all 7 game modes and 23 content packs.
- ✅ Strict presence of both `hinglish` and `en` localized strings.
- ✅ Confession Roulette packs have at least 4 ghost answer options per topic.
- ✅ Heads Up charades words are $\le 3$ words in English for forehead readability.
- ✅ Text length safety constraints and character limits.

---

## 🔒 Privacy & Security

We believe party games shouldn't track you:
- **No Private Data Stored**: No phone numbers, passwords, emails, or personal identification are collected or sent to remote servers.
- **Client-Side First**: Game histories and scores reside in `sessionStorage` / `localStorage` on your own browser.
- **Direct P2P**: Multiplayer rooms communicate via encrypted WebRTC DataChannels directly between peer browsers.
- **Safe Environment**: No secrets, sensitive tokens, or private environment variables are required to run the game locally or in production.

---

## 🤝 Contributing

Contributions to new packs, features, and UI enhancements are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-campus-pack`).
3. If adding or editing content, update `src/content/game-modes.json` and follow the guidelines in [`docs/game-packs-guide.md`](./docs/game-packs-guide.md).
4. Run validation:
   ```bash
   npm run content:check
   npm run build
   ```
5. Commit your changes (`git commit -m "feat: add hostel fest content pack"`).
6. Push to your branch and submit a Pull Request.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ for squad game nights.
