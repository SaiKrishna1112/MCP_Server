import express from "express";
import cors from "cors";
import { tools } from "./tools.js";
import { zodToJsonSchema } from "zod-to-json-schema";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * 1️⃣ MCP DISCOVERY ENDPOINT
 * ChatGPT Apps calls this automatically
 */
app.get("/.well-known/mcp.json", (_, res) => {
  res.json({
    schema_version: "1.0",
    name: "ASKOXY.AI MCP Server",
    description: "Tools for ASKOXY.AI",
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      input_schema: zodToJsonSchema(tool.inputSchema)
    }))
  });
});

/**
 * 2️⃣ MCP TOOL EXECUTION
 */
app.post("/mcp/tool/:toolName", async (req, res) => {
  const tool = tools[req.params.toolName as keyof typeof tools];

  if (!tool) {
    return res.status(404).json({ error: "Tool not found" });
  }

  const parsed = tool.inputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }

  const result = await tool.handler(parsed.data);
  res.json(result);
});

/**
 * Health check
 */
app.get("/", (_, res) => {
  res.send("MCP Server Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`MCP server running on ${PORT}`);
});
