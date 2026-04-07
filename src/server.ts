import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerJsonToTsTool } from "./tools/json-to-ts/index.ts";
export async function createServer() {
  const server = new McpServer({
    name: "my-mcp-server",
    version: "1.0.0"
  });
  registerJsonToTsTool(server);



  return server;
}