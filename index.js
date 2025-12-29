import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
const server = new McpServer({
  name: "MySSEServer",
  version: "1.0.0"
});

// 1. Define your tool
server.registerTool("get_greeting", {
  name: z.string()
}, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}! This is a JS SSE server.` }]
}));

let transport;

// 2. Initial SSE connection endpoint
app.get("/sse", async (req, res) => {
  // ChatGPT connects here first to start the stream
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// 3. Endpoint for ChatGPT to send tool requests
app.post("/messages", express.json(), async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

app.listen(3000, () => {
  console.log("MCP SSE Server running on port 3000");
});
