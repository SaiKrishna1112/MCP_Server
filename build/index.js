import express from "express";
import cors from "cors";
import { tools } from "./tools.js";
const app = express();
/**
 * =================
 * MIDDLEWARE
 * =================
 */
app.use(express.json());
app.use(cors({ origin: "*" }));
/**
 * ================================
 * MCP DISCOVERY ENDPOINT (STRICT)
 * ================================
 */
app.get("/.well-known/mcp.json", (_req, res) => {
    const mcpTools = Object.entries(tools).map(([name, tool]) => {
        const shape = tool.inputSchema?.shape ?? {};
        const properties = {};
        for (const key of Object.keys(shape)) {
            // minimal, MCP-safe typing
            properties[key] = { type: "string" };
        }
        return {
            name,
            description: tool.description,
            input_schema: {
                type: "object",
                properties
            }
        };
    });
    res.status(200).json({
        name: "askoxy-mcp",
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
        if (!tool) {
            return res.status(200).json({
                content: [{ type: "text", text: "Tool not found" }]
            });
        }
        const parsed = tool.inputSchema.safeParse(req.body ?? {});
        const args = parsed.success ? parsed.data : {};
        const result = await tool.handler(args);
        if (result?.content) {
            return res.status(200).json(result);
        }
        return res.status(200).json({
            content: [{ type: "text", text: "Tool executed successfully" }]
        });
    }
    catch {
        return res.status(200).json({
            content: [{ type: "text", text: "Tool execution failed gracefully" }]
        });
    }
});
/**
 * =================
 * HEALTH CHECK
 * =================
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
app.listen(PORT);
