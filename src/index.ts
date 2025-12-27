import express, { Request, Response } from "express";
import cors from "cors";

import { tools } from "./tools.js";
import { zodToJsonSchema } from "zod-to-json-schema";

const app = express();
app.use(cors());
app.use(express.json());


/**
 * MCP discovery endpoint
 */
app.get("/.well-known/mcp.json", (_req: Request, res: Response) => {
  res.json({
    schema_version: "1.0",
    name: "ASKOXY.AI MCP Server",
    description: "MCP tools for ChatGPT Apps",
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      input_schema: zodToJsonSchema(tool.inputSchema as any),
    })),
  });
});
/**
 * MCP tool execution
 */
app.post(
  "/mcp/tool/:toolName",
  async (req: Request, res: Response) => {
    const tool = tools[req.params.toolName];

    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    const parsed = tool.inputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await tool.handler(parsed.data);
    res.json(result);
  }
);

/**
 * Health check
 */
app.get("/", (_req: Request, res: Response) => {
  res.send("MCP Server Running");
});

const PORT = process.env.PORT ?? 10000;
app.listen(PORT, () => {
  console.error(`MCP server running on port ${PORT}`);
});
