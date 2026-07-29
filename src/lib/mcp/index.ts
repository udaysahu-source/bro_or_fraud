import { defineMcp } from "@lovable.dev/mcp-js";
import listPacksTool from "./tools/list-packs";
import rollMatchTool from "./tools/roll-match";

export default defineMcp({
  name: "bro-or-fraud-mcp",
  title: "Bro or Fraud? MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Bro or Fraud? party game. Use `list_packs` to browse word packs and `roll_match` to draw a secret word + fraud word pair for a round.",
  tools: [listPacksTool, rollMatchTool],
});
