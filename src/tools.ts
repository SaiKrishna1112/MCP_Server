import { z, ZodTypeAny } from "zod";

export interface MCPTool {
  description: string;
  inputSchema: ZodTypeAny;
  handler: (args: any) => Promise<any>;
}

export const tools: Record<string, MCPTool> = {
  say_hello: {
    description: "Say hello to a user",

    // 🔥 MUST accept {} for MCP Scan Tools
    inputSchema: z.object({
      name: z.string().optional(),
    }),

    handler: async ({ name }) => ({
      content: [
        {
          type: "text",
          text: `Hello ${name ?? "there"}`
        }
      ]
    }),
  },
};