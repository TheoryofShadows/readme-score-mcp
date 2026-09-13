#!/usr/bin/env node
/**
 * @mcpx-digital/readme-score — MCP server for README quality scoring.
 * Local files only. Transport: stdio.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { scoreReadmeFile, suggestImprovements, checkReadmeLinks } from "./lib.js";

const LOCAL = "Scores a local README markdown file only.";

const TOOLS = [
  {
    name: "score_readme",
    description: `Score a README for install/usage/license/badges/structure and relative link validity (0–100). ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to README.md (or other markdown)." },
        skipLinkCheck: { type: "boolean", description: "Skip relative link existence checks." },
      },
      required: ["filePath"],
    },
  },
  {
    name: "suggest_improvements",
    description: `Suggest concrete README improvements based on the scoring rubric. ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to README.md." },
      },
      required: ["filePath"],
    },
  },
  {
    name: "check_readme_links",
    description: `Check that relative links in a README resolve on disk. ${LOCAL}`,
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to README.md." },
      },
      required: ["filePath"],
    },
  },
];

const handlers = {
  score_readme: scoreReadmeFile,
  suggest_improvements: suggestImprovements,
  check_readme_links: checkReadmeLinks,
};

const server = new Server(
  { name: "readme-score", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};
  const handler = handlers[name];
  if (!handler) {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
  try {
    const result = await handler(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
