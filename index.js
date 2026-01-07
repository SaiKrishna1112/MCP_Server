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
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});


  // 3. Endpoint for ChatGPT to send tool requests
  app.post("/messages", express.json(), async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    }
  });
const PORT = Number(process.env.PORT || 10000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
