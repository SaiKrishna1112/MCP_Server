import { z } from "zod";

export const tools = {
  say_hello: {
    description: "Say hello to a user",
    inputSchema: z.object({
      name: z.string()
    }),
    handler: async ({ name }: { name: string }) => {
      return {
        content: [
          { type: "text", text: `Hello ${name}` }
        ]
      };
    }
  }
};
