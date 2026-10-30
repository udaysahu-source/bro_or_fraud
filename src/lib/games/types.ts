import { z } from "zod";

export const LocalizedTextSchema = z.object({
  hinglish: z.string().min(1),
  en: z.string().min(1),
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const ContentLevelSchema = z.enum(["mild", "spicy", "unhinged"]);
export type ContentLevel = z.infer<typeof ContentLevelSchema>;

export const ReviewStatusSchema = z.enum(["approved", "needs-human-review"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const TrendInfoSchema = z.object({
  dependent: z.boolean(),
  reviewBy: z.string().optional(),
});
export type TrendInfo = z.infer<typeof TrendInfoSchema>;

// Base Item
export const BaseItemSchema = z.object({
  id: z.string().min(1),
  tags: z.array(z.string()).default([]),
  level: ContentLevelSchema,
  addedOn: z.string(),
  reviewStatus: ReviewStatusSchema,
  trend: TrendInfoSchema.default({ dependent: false }),
});

// Pass the Bomb Item
export const PassTheBombItemSchema = BaseItemSchema.extend({
  prompt: LocalizedTextSchema,
  examples: z.array(LocalizedTextSchema).default([]),
});
export type PassTheBombItem = z.infer<typeof PassTheBombItemSchema>;

// Heads Up Item
export const HeadsUpItemSchema = BaseItemSchema.extend({
  word: LocalizedTextSchema,
  forbiddenWords: z.array(LocalizedTextSchema).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  actable: z.boolean().default(true),
});
export type HeadsUpItem = z.infer<typeof HeadsUpItemSchema>;

// Confession Roulette Item
export const ConfessionRouletteItemSchema = BaseItemSchema.extend({
  prompt: LocalizedTextSchema,
  ghostAnswers: z.array(LocalizedTextSchema).min(4),
});
export type ConfessionRouletteItem = z.infer<typeof ConfessionRouletteItemSchema>;

// Never Have I Ever Item
export const NeverHaveIEverItemSchema = BaseItemSchema.extend({
  statement: LocalizedTextSchema,
});
export type NeverHaveIEverItem = z.infer<typeof NeverHaveIEverItemSchema>;

// Would You Rather Item
export const WouldYouRatherItemSchema = BaseItemSchema.extend({
  optionA: LocalizedTextSchema,
  optionB: LocalizedTextSchema,
});
export type WouldYouRatherItem = z.infer<typeof WouldYouRatherItemSchema>;

// Garma Garam Item
export const GarmaGaramItemSchema = BaseItemSchema.extend({
  statement: LocalizedTextSchema,
});
export type GarmaGaramItem = z.infer<typeof GarmaGaramItemSchema>;

// Hot Seat Item
export const HotSeatItemSchema = BaseItemSchema.extend({
  prompt: LocalizedTextSchema,
  type: z.enum(["archetype", "rating", "one-word", "biopic", "linkedin"]).default("one-word"),
  options: z.array(LocalizedTextSchema).optional(),
});
export type HotSeatItem = z.infer<typeof HotSeatItemSchema>;

export type AnyGameItem =
  | PassTheBombItem
  | HeadsUpItem
  | ConfessionRouletteItem
  | NeverHaveIEverItem
  | WouldYouRatherItem
  | GarmaGaramItem
  | HotSeatItem;

// Pack Schema
export const ContentPackSchema = z.object({
  id: z.string().min(1),
  name: z.union([z.string(), LocalizedTextSchema]),
  level: ContentLevelSchema.default("mild"),
  items: z.array(z.any()), // Validated game-specifically
});
export type ContentPack<T = AnyGameItem> = Omit<z.infer<typeof ContentPackSchema>, "items"> & {
  name: string | LocalizedText;
  items: T[];
};

// Game Mode Schema
export const GameModeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().min(1),
  category: z.string(),
  players: z.object({
    min: z.number().int().min(1),
    max: z.number().int().max(30),
  }),
  estimatedMinutes: z.object({
    min: z.number().int(),
    max: z.number().int(),
  }),
  coreLoop: z.array(z.string()),
  rules: z.record(z.string(), z.any()),
  roundModifiers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  roundVariants: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  contentPacks: z.array(ContentPackSchema),
});
export type GameMode = z.infer<typeof GameModeSchema>;

export const GameHubContentSchema = z.object({
  schemaVersion: z.literal("1.1.0"),
  app: z.object({
    name: z.string(),
    language: z.string(),
    defaultContentLanguage: z.enum(["hinglish", "en"]).default("hinglish"),
    description: z.string(),
    contentGuidelines: z.object({
      tone: z.array(z.string()),
      avoid: z.array(z.string()),
      skipAllowed: z.boolean(),
      fictionalAnswersAllowed: z.boolean(),
    }),
  }),
  gameModes: z.array(GameModeSchema),
  sharedSystems: z.record(z.string(), z.any()),
});
export type GameHubContent = z.infer<typeof GameHubContentSchema>;
