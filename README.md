# node_mcp_swagger

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io) 的本地工具服务：从 **Swagger / OpenAPI** 文档或 **任意 JSON** 生成 **TypeScript** 类型定义，供 Cursor、Claude Desktop 等客户端通过 **STDIO** 调用。

## 功能概览

| 能力 | 说明 |
|------|------|
| 传输方式 | **STDIO**（子进程标准输入输出，适合本机 IDE 集成） |
| 工具名 | `json-to-ts` |
| 实现方式 | 仓库内提供 **两种入口**，见下文 |

## 环境要求

- [Bun](https://bun.sh)（运行 MCP 服务）
- [pnpm](https://pnpm.io)（与 `package.json` 中 `packageManager` 一致）

## 安装

```bash
pnpm install
```

## 两种 MCP 入口（请按需选一个）

### 1. Swagger / OpenAPI 路径（推荐）

从 OpenAPI 文档的 `paths`、Schema 生成与 **标签（tag）/模块** 相关的 TS 类型。

```bash
bun ./src/index.ts
```

- 服务名：`my-mcp-server`
- 工具参数：
  - **`source`**（必填）：Swagger JSON 的 **URL**，或本地文件路径（相对当前工作目录）
  - **`module`**（可选）：按 tag 划分时的模块名；不传则走默认逻辑（生成文档中的接口类型）

### 2. 通用 JSON 样本 → 嵌套 interface

将任意 JSON（含本地文件或 URL）按结构递归生成 `interface`，不依赖 OpenAPI 语义。

```bash
bun ./server.ts
```

- 服务名：`swagger-json-to-ts`
- 工具参数：
  - **`source`**（必填）：远程 URL 或本地 JSON 路径
  - **`typeName`**（可选）：根类型名，需为合法标识符；默认 `GeneratedRoot`

## MCP 配置：`.mcp.json`

仓库根目录提供 **`.mcp.json`**，使用 MCP 常见的 **`mcpServers`** 结构，通过 STDIO 启动上述两种入口（服务名与下表一致）。

```json
{
  "mcpServers": {
    "swagger-openapi-to-ts": {
      "command": "bun",
      "args": ["src/index.ts"],
      "cwd": "${workspaceFolder}"
    },
    "json-sample-to-ts": {
      "command": "bun",
      "args": ["server.ts"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 在 Cursor 中使用

1. 用 Cursor **打开本仓库根目录**（作为工作区），保证 **`${workspaceFolder}`** 能解析到项目根。
2. **项目级 MCP** 通常放在 **`.cursor/mcp.json`**：可将根目录的 **`.mcp.json` 全文复制**到该路径，或在 MCP 设置中从文件导入。
3. 修改配置后**重启 Cursor** 或重载 MCP，在工具列表中应能看到两个服务端下的 **`json-to-ts`**（可同时启用，注意名称区分）。
4. 本机需已安装 **Bun**，且终端中能执行 `bun`。

若 `${workspaceFolder}` 在你当前版本未被替换，将每项里的 **`cwd`** 改为你本机仓库的**绝对路径**，并把 **`args`** 改成该入口脚本的绝对路径。

### 使用打包产物（可选）

先执行 `pnpm run build:mcp` 生成 `dist/mcp-swagger`，再在 `mcpServers` 中增加例如：

```json
"swagger-openapi-to-ts-dist": {
  "command": "${workspaceFolder}/dist/mcp-swagger",
  "cwd": "${workspaceFolder}"
}
```

仅在有 **`dist/mcp-swagger`** 时启用，否则进程会启动失败。

### 手动配置（绝对路径示例）

不依赖 `.mcp.json` 时，可在 Cursor 全局或项目 MCP 中自行添加，例如 Swagger 模式：

```json
{
  "mcpServers": {
    "swagger-openapi-to-ts": {
      "command": "bun",
      "args": ["/绝对路径/node_mcp_swagger/src/index.ts"],
      "cwd": "/绝对路径/node_mcp_swagger"
    }
  }
}
```

将 `/绝对路径/node_mcp_swagger` 换成本机路径；通用 JSON 模式将 `args` 改为 `["/绝对路径/node_mcp_swagger/server.ts"]`。

## npm 脚本

| 脚本 | 说明 |
|------|------|
| `pnpm run check` | `tsc --noEmit` 类型检查 |
| `pnpm test` | `bun test` 运行测试 |
| `pnpm run tool:test` | 执行 `src/play.ts`（示例：拉远程 `api-docs` 并写入输出，用于本地调试） |

> **说明**：`package.json` 中的 `start` 当前指向 `src/server.ts`，该文件仅导出 `createServer()`，不会自行连接 STDIO。实际作为 MCP 进程启动时，请使用 **`bun ./src/index.ts`** 或 **`bun ./server.ts`**。

## 技术栈

- `@modelcontextprotocol/sdk` — MCP 服务端
- `zod` — 工具入参校验
- TypeScript 5.x

## 许可证

ISC
