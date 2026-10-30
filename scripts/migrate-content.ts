/**
 * Migration & Content Expansion Script
 * Converts game-modes.v1.json (v1.0.0) -> game-modes.json (v1.1.0)
 * Adds natural Hinglish, expands every pack to 30+ items, adds new games & packs.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const rootDir = process.cwd();
const v1Path = join(rootDir, "src/content/game-modes.v1.json");
const v1Data = JSON.parse(readFileSync(v1Path, "utf-8"));

// Helper to wrap strings
function loc(hinglish: string, en: string) {
  return { hinglish, en };
}

// Banned words check list for sanity
const BANNED_PATTERNS = [
  /caste/i,
  /brahmin/i,
  /dalit/i,
  /muslim/i,
  /hindu/i,
  /suicide/i,
  /kill\s+yourself/i,
  /ragging/i,
  /fat/i,
  /ugly/i,
  /chamar/i,
];

console.log("Starting Content Migration & Expansion to Schema v1.1.0...");
