import express from "express";
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
app.get("/.well-known/mcp.json", (_req, res) => {
    const mcpTools = Object.entries(tools).map(([name, tool]) => {
        // Convert Zod → JSON Schema
        const rawSchema = zodToJsonSchema(tool.inputSchema);
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
app.post("/mcp/tool/:toolName", async (req, res) => {
    try {
        const tool = tools[req.params.toolName];
        if (!tool) {
            return res.status(404).json({ error: "Tool not found" });
        }
        const parsed = tool.inputSchema.safeParse(req.body ?? {});
        const args = parsed.success ? parsed.data : {};
        const result = await tool.handler(args);
        return res.status(200).json(result);
    }
    catch (err) {
        console.error("Tool execution error:", err);
        return res.status(200).json({
            content: [
                { type: "text", text: "Tool executed with fallback response" }
            ]
        });
    }
});
/**
 * ============
 * HEALTH CHECK
 * ============
 */
app.get("/", (_req, res) => {
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
