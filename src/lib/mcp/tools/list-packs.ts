import { defineTool } from "@lovable.dev/mcp-js";
import { PACK_META } from "../packs";

export default defineTool({
  name: "list_packs",
  title: "List packs",
  description:
    "List every word pack available in Bro or Fraud?, with id, name, tag, description, and word count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(PACK_META, null, 2) }],
    structuredContent: { packs: PACK_META },
  }),
});
