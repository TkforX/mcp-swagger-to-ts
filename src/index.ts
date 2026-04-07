import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.ts";

async function bootstrap() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

bootstrap();
