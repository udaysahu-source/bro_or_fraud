import { readFileSync } from "fs";
import { join } from "path";

interface LocalizedText {
  hinglish: string;
  en: string;
}

interface Item {
  id: string;
  tags?: string[];
  level?: "mild" | "spicy" | "unhinged";
  addedOn?: string;
  reviewStatus?: "approved" | "needs-human-review";
  trend?: { dependent: boolean; reviewBy?: string };
  prompt?: LocalizedText;
  examples?: LocalizedText[];
  word?: LocalizedText;
  forbiddenWords?: LocalizedText[];
  difficulty?: "easy" | "medium" | "hard";
  actable?: boolean;
  ghostAnswers?: LocalizedText[];
  statement?: LocalizedText;
  optionA?: LocalizedText;
  optionB?: LocalizedText;
  type?: string;
  options?: LocalizedText[];
}

interface Pack {
  id: string;
  name: string | LocalizedText;
  level?: string;
  items: Item[];
}

interface GameMode {
  id: string;
  name: string;
  contentPacks: Pack[];
}

interface ContentRoot {
  schemaVersion: string;
  gameModes: GameMode[];
}

const contentPath = join(process.cwd(), "src/content/game-modes.json");
const data: ContentRoot = JSON.parse(readFileSync(contentPath, "utf-8"));

console.log("🔍 Checking content validity for schema", data.schemaVersion);

let errors: string[] = [];
let warnings: string[] = [];
const seenIds = new Set<string>();

const BANNED_TERMS = [
  /\bcaste\b/i,
  /\bbrahmin\b/i,
  /\bdalit\b/i,
  /\bchamar\b/i,
  /\bsuicide\b/i,
  /\bkill yourself\b/i,
  /\bragging\b/i,
];

function checkLoc(text: any, pathStr: string) {
  if (!text || typeof text !== "object") {
    errors.push(`${pathStr}: Missing localized object`);
    return;
  }
  if (!text.hinglish || typeof text.hinglish !== "string" || text.hinglish.trim() === "") {
    errors.push(`${pathStr}: Missing hinglish text`);
  }
  if (!text.en || typeof text.en !== "string" || text.en.trim() === "") {
    errors.push(`${pathStr}: Missing en text`);
  }
  // Check banned terms
  for (const pattern of BANNED_TERMS) {
    if (pattern.test(text.hinglish) || pattern.test(text.en)) {
      errors.push(`${pathStr}: Found banned term matching ${pattern}`);
    }
  }
}

if (data.schemaVersion !== "1.1.0") {
  errors.push(`Invalid schemaVersion: expected 1.1.0, got ${data.schemaVersion}`);
}

for (const game of data.gameModes) {
  for (const pack of game.contentPacks) {
    if (pack.items.length < 30) {
      warnings.push(`Pack '${pack.id}' in game '${game.id}' has fewer than 30 items (${pack.items.length})`);
    }

    if (!pack.level) {
      errors.push(`Pack '${pack.id}' in game '${game.id}' missing level`);
    }

    for (const item of pack.items) {
      const itemLoc = `${game.id} -> ${pack.id} -> ${item.id}`;

      // Unique ID check
      if (seenIds.has(item.id)) {
        errors.push(`Duplicate item ID detected: ${item.id}`);
      }
      seenIds.add(item.id);

      // Level check
      if (!item.level || !["mild", "spicy", "unhinged"].includes(item.level)) {
        errors.push(`${itemLoc}: Invalid or missing level '${item.level}'`);
      }

      // Review status check
      if (!item.reviewStatus || !["approved", "needs-human-review"].includes(item.reviewStatus)) {
        errors.push(`${itemLoc}: Invalid reviewStatus '${item.reviewStatus}'`);
      }

      // Game specific checks
      if (game.id === "pass-the-bomb") {
        checkLoc(item.prompt, `${itemLoc}.prompt`);
        if (item.examples) {
          item.examples.forEach((ex, idx) => checkLoc(ex, `${itemLoc}.examples[${idx}]`));
        }
      } else if (game.id === "heads-up-tilt") {
        checkLoc(item.word, `${itemLoc}.word`);
        if (item.word) {
          const wordCountH = item.word.hinglish.trim().split(/\s+/).length;
          const wordCountE = item.word.en.trim().split(/\s+/).length;
          if (wordCountH > 3 || wordCountE > 3) {
            errors.push(`${itemLoc}: Heads Up word exceeds 3 words (Hinglish: ${wordCountH}, En: ${wordCountE})`);
          }
        }
        if (item.forbiddenWords) {
          item.forbiddenWords.forEach((fw, idx) => checkLoc(fw, `${itemLoc}.forbiddenWords[${idx}]`));
        }
        if (!item.difficulty) {
          errors.push(`${itemLoc}: Heads Up item missing difficulty`);
        }
        if (typeof item.actable !== "boolean") {
          errors.push(`${itemLoc}: Heads Up item missing actable boolean`);
        }
      } else if (game.id === "confession-roulette") {
        checkLoc(item.prompt, `${itemLoc}.prompt`);
        if (!item.ghostAnswers || item.ghostAnswers.length < 4) {
          errors.push(`${itemLoc}: Confession prompt must have at least 4 ghostAnswers`);
        } else {
          item.ghostAnswers.forEach((ga, idx) => checkLoc(ga, `${itemLoc}.ghostAnswers[${idx}]`));
        }
      } else if (game.id === "never-have-i-ever") {
        checkLoc(item.statement, `${itemLoc}.statement`);
        if (item.statement) {
          if (item.statement.hinglish.length > 90) {
            errors.push(`${itemLoc}: NHIE Hinglish statement exceeds 90 chars (${item.statement.hinglish.length})`);
          }
          if (item.statement.en.length > 90) {
            errors.push(`${itemLoc}: NHIE English statement exceeds 90 chars (${item.statement.en.length})`);
          }
        }
      } else if (game.id === "would-you-rather") {
        checkLoc(item.optionA, `${itemLoc}.optionA`);
        checkLoc(item.optionB, `${itemLoc}.optionB`);
      } else if (game.id === "garma-garam-takes") {
        checkLoc(item.statement, `${itemLoc}.statement`);
      } else if (game.id === "hot-seat") {
        checkLoc(item.prompt, `${itemLoc}.prompt`);
        if (item.options) {
          item.options.forEach((opt, idx) => checkLoc(opt, `${itemLoc}.options[${idx}]`));
        }
      }
    }
  }
}

console.log(`✅ Checked ${seenIds.size} items across ${data.gameModes.length} game modes.`);

if (warnings.length > 0) {
  console.warn(`⚠️ Warnings (${warnings.length}):`);
  warnings.forEach((w) => console.warn("  - " + w));
}

if (errors.length > 0) {
  console.error(`❌ Validation Failed with ${errors.length} errors:`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
} else {
  console.log("🎉 All content checks passed with 0 errors!");
}
