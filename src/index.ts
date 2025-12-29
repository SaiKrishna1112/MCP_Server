import express, { Request, Response } from "express";
import cors from "cors";
import { tools } from "./tools.js";
import { zodToJsonSchema } from "zod-to-json-schema";

const app = express();

app.use(cors());
app.use(express.json());

/**
 * ================================
 * MCP DISCOVERY ENDPOINT (CRITICAL)
 * ================================
 * OpenAI MCP verification ONLY checks this endpoint first.
 */
app.get("/.well-known/mcp.json", (_req: Request, res: Response) => {
  const mcpTools = Object.entries(tools).map(([name, tool]) => {
    // Convert Zod → JSON Schema
    const rawSchema: any = zodToJsonSchema(tool.inputSchema as any);

    // 🔴 MCP STRICT SANITIZATION (NON-NEGOTIABLE)
    delete rawSchema.$schema;
    delete rawSchema.definitions;
    delete rawSchema.additionalProperties;

    return {
      name,
      description: tool.description,
      input_schema: {
        type: "object",
        properties: rawSchema.properties ?? {},
        required: rawSchema.required ?? []
      }
    };
  });

  res.status(200).json({
    schema_version: "1.0",
    name: "ASKOXY.AI MCP Server",
    version: "1.0.0",
    description: "MCP tools for ChatGPT Apps",
    tools: mcpTools
  });
});

/**
 * =========================
 * MCP TOOL EXECUTION ROUTE
 * =========================
 * OpenAI will call this AFTER discovery succeeds
 */
app.post("/mcp/tool/:toolName", async (req: Request, res: Response) => {
  try {
    const tool = tools[req.params.toolName];

    if (!tool) {
      return res.status(404).json({ error: "Tool not found" });
    }

    const parsed = tool.inputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.errors
      });
    }

    const result = await tool.handler(parsed.data);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Tool execution error:", err);
    res.status(500).json({
      error: "Tool execution failed",
      message: err?.message ?? "Unknown error"
    });
  }
});

/**
 * ============
 * HEALTH CHECK
 * ============
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("ASKOXY MCP Server Running");
});

/**
 * =================
 * SERVER STARTUP
 * =================
 */
const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, () => {
  console.log(`✅ MCP Server running on port ${PORT}`);
});
