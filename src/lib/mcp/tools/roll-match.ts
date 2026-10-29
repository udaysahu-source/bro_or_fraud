import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PACKS, findPack } from "../packs";

export default defineTool({
  name: "roll_match",
  title: "Roll a match",
  description:
    "Roll a Bro or Fraud? round: returns a secret word for the bros and an unrelated/different fraud word from another pack for the impostor. Optionally pick a pack by id (use list_packs to see ids).",
  inputSchema: {
    packId: z.string().optional().describe("Pack id from list_packs. Omit to pick a random pack."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: ({ packId }) => {
    const pack = packId ? findPack(packId) : PACKS[Math.floor(Math.random() * PACKS.length)];
    if (!pack) {
      return {
        content: [
          { type: "text", text: `Unknown packId: ${packId}. Call list_packs for valid ids.` },
        ],
        isError: true,
      };
    }
    const secret = pack.words[Math.floor(Math.random() * pack.words.length)];

    // Choose fraud word from a completely different pack
    const otherPacks = PACKS.filter((p) => p.id !== pack.id);
    const otherPack = otherPacks[Math.floor(Math.random() * otherPacks.length)] || PACKS[0];
    const fraud = otherPack.words[Math.floor(Math.random() * otherPack.words.length)];

    const payload = { pack: pack.id, packName: pack.name, secret, fraud };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
