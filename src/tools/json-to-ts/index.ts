import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isRemoteSource } from "../../utils/index.ts";
import { fetchUrl } from '../../utils/fetch.ts'
import { toMap } from '../../utils/json.ts';
import { generateInterfaceCode } from '../../utils/generate.ts';
import { getFiletoDocument } from './local.ts';
import z from "zod";
const toolInputSchema = z.object({
  source: z.string().min(1).describe("远程接口地址或本地JSON文件路径"),
  module:z.string().optional().describe("需要生成的模块名称，不传默认为生成swagger的所有接口"),
});

export function registerJsonToTsTool(server: McpServer): void {
  server.registerTool(
    "json-to-ts",
    {
      title: "JSON → TS",
      description:"将传入的swagger文档提取出接口信息，生成对应的TypeScript类型定义",
      inputSchema: toolInputSchema,
    },
    async (rawInput) => {
      const { source, module } = toolInputSchema.parse(rawInput);
      const normalizedSource = source.trim();
      const moduleName = module?.trim() || "default";
      try {
        const result = await generate(normalizedSource, moduleName);
        return {
          content: [{ type: "text", text: result }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: String(err) }],
        };
      }
    },
  );
}
const getRemoteDocument = async (url: string): Promise<InterfaceInfo> => {
  const swaggerDocument = await fetchUrl(url);
  const map = toMap(swaggerDocument);
  return map;
}
const getLocalDocument = async (filePath: string): Promise<InterfaceInfo> => {
    const swaggerDocument = await getFiletoDocument(filePath);
 
  return swaggerDocument;
}

export const generate = async (pathName: string, moduleName: string): Promise<string> => {
  const isRemote = isRemoteSource(pathName);
  const getSwagger = isRemote ? getRemoteDocument : getLocalDocument;
  const map = await getSwagger(pathName);
  return generateInterfaceCode(map, moduleName);
};
