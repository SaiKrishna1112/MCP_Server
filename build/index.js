import express from "express";
import cors from "cors";
import { tools } from "./tools.js";
const app = express();
app.use(cors());
app.use(express.json());
/**
 * ================================
 * MCP DISCOVERY ENDPOINT (CRITICAL)
 * ================================
 */
app.get("/.well-known/mcp.json", (_req, res) => {
    const mcpTools = Object.entries(tools).map(([name, tool]) => {
        // Flatten Zod inputSchema for MCP
        const shape = tool.inputSchema.shape ?? {};
        const properties = {};
        for (const key of Object.keys(shape)) {
            properties[key] = { type: "string" }; // assume string for simplicity
        }
        return {
            name,
            description: tool.description,
            input_schema: {
                type: "object",
                properties,
                required: [] // optional fields
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
 */
app.post("/mcp/tool/:toolName", async (req, res) => {
    try {
        const tool = tools[req.params.toolName];
        if (!tool)
            return res.status(404).json({ error: "Tool not found" });
        const parsed = tool.inputSchema.safeParse(req.body ?? {});
        const args = parsed.success ? parsed.data : {};
        const result = await tool.handler(args);
        // Ensure always returning 'content' array
        if (!result?.content) {
            return res.status(200).json({
                content: [
                    { type: "text", text: "Tool executed with fallback response" }
                ]
            });
        }
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
 * =============
 * HEALTH CHECK
 * =============
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
