# Multi-Game Party Hub Content & Packs Guide

This guide documents the data schema (v1.1.0) and instructions for expanding and maintaining game modes and packs in **"Bro or Fraud?" Party Hub**.

---

## 1. Schema Overview (`schemaVersion: "1.1.0"`)

All game modes and content live locally in [`src/content/game-modes.json`](../src/content/game-modes.json). Every game works **100% offline**.

### Key Fields & Enums
- **`LocalizedText`**: `{ "hinglish": string, "en": string }`
  - `hinglish`: Authentic campus colloquial Hindi-English blend (e.g., *"Prof ne proxy pakad li"*).
  - `en`: Natural English translation matching campus context.
- **`ContentLevel`**: `"mild"` | `"spicy"` | `"unhinged"`
  - Filters automatically respect the player's Spice Setting from the Settings drawer.
- **`ReviewStatus`**: `"approved"` | `"needs-human-review"`
  - All machine-expanded or community-authored content is marked with `"needs-human-review"`.

---

## 2. Included Game Modes & Content Structure

| Mode ID | Mode Name | Category | Packs | Total Items | Engine Component |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pass-the-bomb` | Pass the Bomb | word-recall | 3 | 90 | `PassTheBombEngine.tsx` |
| `heads-up-tilt` | Heads Up / Forehead Tilt | charades | 3 | 90 | `HeadsUpEngine.tsx` |
| `confession-roulette` | Confession Roulette | bluff-party | 3 | 90 | `ConfessionRouletteEngine.tsx` |
| `never-have-i-ever` | Never Have I Ever | voting | 4 | 120 | `SecretVoteEngine.tsx` |
| `would-you-rather` | Would You Rather | voting | 4 | 120 | `SecretVoteEngine.tsx` |
| `garma-garam-takes` | Garma-Garam Takes | hot-takes | 3 | 90 | `SecretVoteEngine.tsx` |
| `hot-seat` | The Hot Seat | roast | 3 | 90 | `HotSeatEngine.tsx` |
| **Total** | **7 Multi-Game Modes** | | **23 Packs** | **690 Items** | |

*(Plus flagship "Bro or Fraud?" pinned as Mode #1).*

---

## 3. How to Add a New Content Pack

1. Open [`src/content/game-modes.json`](../src/content/game-modes.json).
2. Locate the target `gameMode` object by `id`.
3. Add a new pack inside the `contentPacks` array:
   ```json
   {
     "id": "my-new-pack",
     "name": {
       "hinglish": "Fest Memories & Drama",
       "en": "College Fest Drama"
     },
     "level": "spicy",
     "items": [ ... ]
   }
   ```
4. Adhere to the mode's item format:
   - **Pass the Bomb**: `{ id, category: {hinglish, en}, examples, bannedWords }`
   - **Heads Up**: `{ id, word: {hinglish, en (<= 3 words)}, forbiddenWords }`
   - **Confession Roulette**: `{ id, topic: {hinglish, en}, ghostAnswers (>= 4 localized options) }`
   - **Never Have I Ever**: `{ id, statement: {hinglish, en} }`
   - **Would You Rather**: `{ id, optionA: {hinglish, en}, optionB: {hinglish, en} }`
   - **Garma-Garam Takes**: `{ id, statement: {hinglish, en} }`
   - **The Hot Seat**: `{ id, prompt: {hinglish, en}, type, options?: [...] }`
5. Always mark items with `"reviewStatus": "needs-human-review"`.
6. Run the content validator:
   ```bash
   npm run content:check
   ```

---

## 4. Content Verification Script

Run the automated verification suite anytime:
```bash
npm run content:check
```
Checks:
- Schema conformance for all 7 game modes and 23 packs.
- Presence of both `hinglish` and `en` localized text.
- Minimum 4 ghost answers for every Confession Roulette topic.
- English charades words $\le 3$ words for Heads Up.
- Maximum text length restrictions.

---

## 5. Content Guardrails

- **Focus**: Real college situations (attendance shortages, proxy, mess food, 2 AM canteen, mass recruiters, lab external vivas, kettle recipes).
- **Prohibited**:
  - No targeting caste, religion, ethnicity, gender, sexual orientation, or physical appearance.
  - No real college names or real named individuals.
  - No suicide, self-harm, or severe mental breakdown jokes.
  - No ragging or humiliating physical dares.
  - All prompts are safely skippable by players at any time.
