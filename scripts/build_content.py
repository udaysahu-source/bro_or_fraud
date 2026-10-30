#!/usr/bin/env python3
"""
Full Content Builder & Assembler for Bro or Fraud? Party Hub (Schema v1.1.0)
Imports modular data packs, validates length and guardrail constraints,
and outputs src/content/game-modes.json
"""

import json
import os
import sys

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

from data_ptb import get_ptb_packs
from data_heads_up import get_heads_up_packs
from data_confession import get_confession_packs
from data_nhie import get_nhie_packs
from data_wyr import get_wyr_packs
from data_garma import get_garma_packs
from data_hotseat import get_hotseat_packs

def loc(hinglish: str, en: str):
    return {"hinglish": hinglish.strip(), "en": en.strip()}

def base(item_id: str, tags: list, level="mild", trend=False):
    return {
        "id": item_id,
        "tags": tags,
        "level": level,
        "addedOn": "2026-10-30",
        "reviewStatus": "needs-human-review",
        "trend": {"dependent": True, "reviewBy": "2027-01-01"} if trend else {"dependent": False}
    }

print("Building content packs...")
ptb_packs = get_ptb_packs(loc, base)
hu_packs = get_heads_up_packs(loc, base)
cr_packs = get_confession_packs(loc, base)
nhie_packs = get_nhie_packs(loc, base)
wyr_packs = get_wyr_packs(loc, base)
garma_packs = get_garma_packs(loc, base)
hotseat_packs = get_hotseat_packs(loc, base)

game_modes = [
    {
        "id": "pass-the-bomb",
        "name": "Pass the Bomb",
        "tagline": "Think fast. Pass faster.",
        "category": "speed-chaos",
        "players": {"min": 3, "max": 12},
        "estimatedMinutes": {"min": 5, "max": 12},
        "coreLoop": [
            "Show a category or prompt.",
            "Current player gives one valid answer aloud.",
            "Tap 'Pass Bomb' before the hidden fuse explodes.",
            "Repeated or invalid answers can be challenged with 'Repeat!'.",
            "Player holding the bomb when it explodes loses a life or takes a penalty."
        ],
        "rules": {
            "defaultFuseSeconds": {"min": 15, "max": 45},
            "livesPerPlayer": 3,
            "suddenDeathPlayersRemaining": 2,
            "suddenDeathFuseSeconds": {"min": 8, "max": 18},
            "repeatAnswerPenalty": "lose-life",
            "skipAllowed": True,
            "penaltiesMustBe": "optional, harmless, and non-humiliating"
        },
        "roundModifiers": [
            {"id": "reverse-direction", "name": "Reverse Direction", "description": "Passing direction reverses after the next valid answer."},
            {"id": "double-trouble", "name": "Double Trouble", "description": "Two bombs circulate; each holder must answer before passing."},
            {"id": "alphabet-lock", "name": "Alphabet Lock", "description": "Every answer must start with the displayed letter."},
            {"id": "no-obvious-answers", "name": "No Obvious Answers", "description": "The group rejects the first predictable answer; use only with friendly consensus."}
        ],
        "contentPacks": ptb_packs
    },
    {
        "id": "heads-up-tilt",
        "name": "Heads Up / Tilt",
        "tagline": "You have the word. They have the clues.",
        "category": "team-performance",
        "players": {"min": 2, "max": 12},
        "estimatedMinutes": {"min": 3, "max": 10},
        "coreLoop": [
            "Choose a content pack and round duration (30s / 60s / 90s).",
            "Guesser holds the phone against their forehead.",
            "Teammates act or describe the word without saying forbidden words.",
            "Tilt down to mark correct; tilt up to skip (tap buttons always available as fallback).",
            "Show final recap summary of correct and skipped words."
        ],
        "rules": {
            "roundDurationsSeconds": [30, 60, 90],
            "correctAction": "tilt-down",
            "skipAction": "tilt-up",
            "fallbackControls": ["correct-button", "skip-button"],
            "motionPermissionMustBeRequestedOnUserGesture": True,
            "calibrationAvailable": True,
            "forbiddenWordsEnabled": True,
            "teamsOptional": True
        },
        "roundVariants": [
            {"id": "one-word-only", "name": "One Word Only", "description": "Clue-givers may say only one single word per clue."},
            {"id": "forbidden-words", "name": "Forbidden Words", "description": "Each card includes forbidden words the team cannot say."},
            {"id": "silent-acting", "name": "Silent Acting", "description": "Clue-givers must act without speaking any words."},
            {"id": "speed-blitz", "name": "Speed Blitz", "description": "The final 15 seconds award bonus points for consecutive correct answers."}
        ],
        "contentPacks": hu_packs
    },
    {
        "id": "confession-roulette",
        "name": "Confession Roulette",
        "tagline": "Real answers. Fake answers. Who's bluffing?",
        "category": "bluffing-deduction",
        "players": {"min": 3, "max": 10},
        "estimatedMinutes": {"min": 8, "max": 15},
        "coreLoop": [
            "Show a spicy or funny campus prompt to all players.",
            "Each player privately submits a short answer or picks a fictional decoy answer.",
            "Submissions are mixed internally with ghost decoys from ghostAnswers.",
            "Reveal answers one at a time with zero authorship.",
            "30 seconds interrogation phase: players vote for the author or select 'Ghost / Decoy'.",
            "Reveal authorship, trigger optional Chaos Powers, and award points."
        ],
        "rules": {
            "anonymousByDefault": True,
            "fictionalAnswerAllowed": True,
            "skipAllowed": True,
            "interrogationSeconds": 30,
            "voteReveal": "after-voting-locks",
            "points": {
                "correctAuthorGuess": 2,
                "correctGhostGuess": 2,
                "foolEachPlayer": 1,
                "funniestAnswerOptionalBonus": 1
            },
            "chaosPowers": [
                {"id": "burn", "name": "Burn 🔥", "description": "Double the points if you guess the author correctly; lose 1 if wrong."},
                {"id": "shield", "name": "Shield 🛡️", "description": "Protect your own confession from scoring points for anyone who guesses it."},
                {"id": "frame", "name": "Frame 🎭", "description": "Bluff-tag another player so votes against them give you the points."}
            ],
            "privacy": {
                "hideAuthorshipUntilReveal": True,
                "doNotLogRawSubmissions": True,
                "clearRoundSubmissionsAfterGame": True
            }
        },
        "contentPacks": cr_packs
    },
    {
        "id": "never-have-i-ever",
        "name": "Never Have I Ever",
        "tagline": "Own it, deny it, or skip it.",
        "category": "social-reveal",
        "players": {"min": 3, "max": 12},
        "estimatedMinutes": {"min": 5, "max": 12},
        "coreLoop": [
            "Show one statement.",
            "Each player privately chooses 'I Have', 'I Haven't', or 'Skip'.",
            "Reveal only aggregate counts by default to protect player privacy.",
            "If Detective Mode is enabled and exactly one person chose 'I Have', the group can guess.",
            "Players may always decline follow-ups without penalty."
        ],
        "rules": {
            "responses": ["I have", "I haven't", "Skip"],
            "aggregateRevealDefault": True,
            "detectiveMode": {
                "enabledByDefault": False,
                "trigger": "exactly-one-I-have",
                "guessSeconds": 20
            },
            "noForcedExplanations": True
        },
        "contentPacks": nhie_packs
    },
    {
        "id": "would-you-rather",
        "name": "Would You Rather",
        "tagline": "Pick your problem.",
        "category": "choices-debate",
        "players": {"min": 3, "max": 12},
        "estimatedMinutes": {"min": 5, "max": 12},
        "coreLoop": [
            "Show two mutually exclusive choices.",
            "Players vote privately before seeing group results.",
            "Reveal the split between Option A and Option B.",
            "Optional 20-second defense round where one advocate from each side defends their choice.",
            "Award prediction points to players who predicted the group majority."
        ],
        "rules": {
            "privateVoting": True,
            "debateSeconds": 20,
            "majorityPredictionPoints": 1,
            "tiesAllowed": True,
            "skipAllowed": True
        },
        "contentPacks": wyr_packs
    },
    {
        "id": "garma-garam-takes",
        "name": "Garma Garam Takes",
        "tagline": "Spicy campus opinions. Defend or flip.",
        "category": "debate-roast",
        "players": {"min": 3, "max": 12},
        "estimatedMinutes": {"min": 5, "max": 10},
        "coreLoop": [
            "Show a controversial campus opinion or life take.",
            "Each player votes privately: Agree or Disagree.",
            "Reveal the initial vote split.",
            "If the vote is near 50/50, trigger a 30-second live debate.",
            "Re-vote: award a bonus point to any player who successfully flips minds."
        ],
        "rules": {
            "privateVoting": True,
            "debateSeconds": 30,
            "debateSplitThreshold": 0.4,
            "flipBonusPoints": 1,
            "skipAllowed": True
        },
        "contentPacks": garma_packs
    },
    {
        "id": "hot-seat",
        "name": "Hot Seat",
        "tagline": "One player in the seat. Everyone roasts.",
        "category": "social-roast",
        "players": {"min": 3, "max": 12},
        "estimatedMinutes": {"min": 8, "max": 15},
        "coreLoop": [
            "One player sits in the Hot Seat per round.",
            "Other players submit anonymous ratings, archetypes, one-word roasts, or biopic titles.",
            "Aggregate and reveal the top answers on screen.",
            "The seated player tries to guess who submitted each answer.",
            "Rotate until every player has taken a turn in the Hot Seat."
        ],
        "rules": {
            "anonymizedSubmissions": True,
            "seatedPlayerGuessBonus": 1,
            "skipAllowed": True,
            "roastGuardrails": "roast situations, never identities or body traits"
        },
        "contentPacks": hotseat_packs
    }
]

full_content = {
    "schemaVersion": "1.1.0",
    "app": {
        "name": "Bro or Fraud?",
        "language": "en-IN",
        "defaultContentLanguage": "hinglish",
        "description": "A fast, chaotic party-game hub for Indian engineering and tier-3 college students.",
        "contentGuidelines": {
            "tone": ["current", "specific", "witty", "social", "slightly unhinged", "sarcastic self-deprecating"],
            "avoid": [
                "generic icebreakers",
                "dated meme phrasing",
                "forced slang",
                "personal humiliation",
                "body-shaming",
                "caste, religion, region, or accent-based jokes",
                "exam-pressure suicide or mental health jokes",
                "ragging-style humiliation",
                "real colleges, professors, or named people",
                "pressuring players to disclose real secrets"
            ],
            "skipAllowed": True,
            "fictionalAnswersAllowed": True
        }
    },
    "gameModes": game_modes,
    "sharedSystems": {
        "playerSetup": {
            "minPlayers": 2,
            "maxPlayers": 12,
            "validateEmptyNames": True,
            "validateDuplicates": True
        },
        "ui": {
            "theme": "dark",
            "visualDirection": "bold meme-poster, high contrast, restrained neon accents, chunky readable type",
            "mobileFirst": True,
            "minimumTouchTargetPx": 48,
            "reducedMotionSupport": True
        },
        "settings": {
            "languageOptions": ["Hinglish", "English"],
            "soundEffectsToggle": True,
            "hapticsToggle": True,
            "contentLevels": ["mild", "spicy", "unhinged"]
        },
        "privacy": {
            "anonymousVotesByDefault": True,
            "skipPromptsEnabled": True,
            "avoidPersistingSensitiveSubmissions": True
        },
        "offline": {
            "contentBundledLocally": True,
            "allCoreModesWorkOffline": True
        }
    }
}

target_path = os.path.join(os.path.dirname(__file__), "../src/content/game-modes.json")
with open(target_path, "w", encoding="utf-8") as f:
    json.dump(full_content, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {target_path} with {len(game_modes)} game modes.")
for gm in game_modes:
    total_items = sum(len(p["items"]) for p in gm["contentPacks"])
    print(f" - {gm['name']} ({gm['id']}): {len(gm['contentPacks'])} packs, {total_items} items")
