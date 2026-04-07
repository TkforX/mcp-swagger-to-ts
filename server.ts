import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";



// 创建 MCP 服务实例，名称和版本用于服务元信息
const server = new McpServer({
  name: "swagger-json-to-ts",
  version: "1.0.0"
});

// 工具输入的验证规则，source 必填，typeName 可选
const toolInputSchema = z.object({
  source: z.string().min(1).describe("远程接口地址或本地 JSON 文件路径"),
  typeName: z
    .string()
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
    .optional()
    .describe("生成的根接口名称，需符合标识符规则")
});

// 注册 MCP 工具:根据JSON自动生成TypeScript 接口
server.registerTool(
  "json-to-ts",
  {
    title: "JSON 自动生成 TypeScript 接口",
    description: "支持远程 URL 或本地 JSON，输出嵌套 interface 代码",
    inputSchema: toolInputSchema
  },
  async (rawInput) => {
    const { source, typeName } = toolInputSchema.parse(rawInput);
    const normalizedSource = source.trim();

    const rootName = normalizeTypeName(typeName);

    try {
      const payload = await loadJsonFromSource(normalizedSource);
      const generatedCode = generateInterfaceCode(payload, rootName);
      return {
        content: [
          {
            type: "text",
            text: generatedCode
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `错误：${getErrorMessage(error)}`
          }
        ]
      };
    }
  }
);

// 通过标准输入输出连接 MCP 服务
const transport = new StdioServerTransport();
await server.connect(transport);

/**
 * 从远程 URL/本地文件加载 JSON 内容
 */
async function loadJsonFromSource(source: string): Promise<unknown> {
  if (isRemoteSource(source)) {
    return fetchRemoteJson(source);
  }
  return readLocalJson(source);
}

function isRemoteSource(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

async function fetchRemoteJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`远程请求失败，状态码 ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`读取远程 JSON 时异常：${getErrorMessage(error)}`);
  }
}

async function readLocalJson(filePath: string): Promise<unknown> {
  const resolvedPath = resolve(process.cwd(), filePath);
  try {
    const raw = await readFile(resolvedPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`读取本地 JSON 文件失败：${getErrorMessage(error)}`);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 生成完整的 TypeScript 接口定义
 */
function generateInterfaceCode(payload: unknown, rootName: string): string {
  const collected = new Map<string, string>();
  const rootType = describeValue(payload, rootName, collected);
  const fragments: string[] = [];

  for (const [name, body] of collected.entries()) {
    fragments.push(`interface ${name} {\n${body}\n}`);
  }

  if (!collected.has(rootType)) {
    fragments.push(`type ${rootName} = ${rootType};`);
  }

  return fragments.join("\n\n");
}

function describeValue(value: unknown, hint: string, collected: Map<string, string>): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return describeArray(value, `${hint}Item`, collected);
  }
  if (typeof value === "object") {
    return describeObject(value as Record<string, unknown>, hint, collected);
  }
  return describePrimitive(value);
}

function describePrimitive(value: unknown): string {
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return Number.isInteger(value as number) ? "number" : "number";
    case "boolean":
      return "boolean";
    case "undefined":
      return "undefined";
    default:
      return "unknown";
  }
}

function describeArray(
  items: unknown[],
  hint: string,
  collected: Map<string, string>
): string {
  if (items.length === 0) {
    return "unknown[]";
  }
  const elementTypes = new Set<string>();
  for (const item of items) {
    elementTypes.add(describeValue(item, hint, collected));
  }
  const union = Array.from(elementTypes);
  const joined = union.length > 0 ? union.join(" | ") : "unknown";
  return `${joined}[]`;
}

function describeObject(
  object: Record<string, unknown>,
  hint: string,
  collected: Map<string, string>
): string {
  const interfaceName = ensureInterfaceName(hint, collected);
  if (collected.has(interfaceName)) {
    return interfaceName;
  }
  const entries = Object.entries(object);
  const lines: string[] = [];
  for (const [key, child] of entries) {
    const safeKey = isValidIdentifier(key) ? key : JSON.stringify(key);
    const propertyHint = `${interfaceName}${toPascalCase(key) || "Field"}`;
    const propertyType = describeValue(child, propertyHint, collected);
    lines.push(`  ${safeKey}: ${propertyType};`);
  }
  collected.set(interfaceName, lines.join("\n"));
  return interfaceName;
}

function ensureInterfaceName(base: string, collected: Map<string, string>): string {
  const candidateBase = toPascalCase(base) || "Generated";
  let candidate = candidateBase;
  let counter = 1;
  while (collected.has(candidate)) {
    candidate = `${candidateBase}${counter}`;
    counter += 1;
  }
  return candidate;
}

function toPascalCase(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1).toLowerCase())
    .join("");
}

function isValidIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function normalizeTypeName(raw?: string): string {
  if (!raw) {
    return "GeneratedRoot";
  }
  const cleaned = raw.replace(/[^A-Za-z0-9_$]/g, "");
  const normalized = toPascalCase(cleaned) || "GeneratedRoot";
  if (!/^[A-Za-z_$]/.test(normalized)) {
    return `_${normalized}`;
  }
  return normalized;
}
