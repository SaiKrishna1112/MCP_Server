import { z } from "zod";
export const tools = {
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
