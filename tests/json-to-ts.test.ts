import { expect, test } from "bun:test";
import { generateInterfaceCode } from "../src/utils/generate.ts";

const petOperation: PathItemWithMeta = {
  path: "/pets",
  method: "get",
  tags: ["Pet"],
  summary: "列出宠物",
  description: "返回所有宠物",
  parameters: [
    {
      in: "query",
      name: "status",
      description: "过滤状态",
      required: false,
      schema: {
        type: "string",
      },
    },
  ],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
          required: ["name"],
        },
      },
    },
  },
  responses: {
    "200": {
      description: "成功",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    } as any,
  },
};

const interfaceInfo: InterfaceInfo = new Map([["Pet", [petOperation]]]);
const userOperation: PathItemWithMeta = {
  path: "/users/{id}",
  method: "get",
  tags: ["User"],
  summary: "查看用户",
  description: "返回指定用户信息",
  parameters: [
    {
      in: "path",
      name: "id",
      description: "用户 ID",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  responses: {
    "200": {
      description: "成功",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["id"],
          },
        },
      },
    } as any,
  },
};
const multiModuleInfo: InterfaceInfo = new Map([
  ["Pet", [petOperation]],
  ["User", [userOperation]],
]);

test("generateInterfaceCode produces namespace with request and response types", () => {
  const output = generateInterfaceCode(interfaceInfo);
  expect(output).toContain("export namespace PetApis");
  expect(output).toContain("export interface getPetsQueryParams");
  expect(output).toContain("export type getPetsRequestBody");
  expect(output).toContain("export type getPetsResponse");
});

test("generateInterfaceCode filters by module name", () => {
  const output = generateInterfaceCode(multiModuleInfo, "User");
  expect(output).toContain("export namespace UserApis");
  expect(output).toMatch(/export interface getUsers.*PathParams/);
  expect(output).not.toContain("PetApis");
});

test("generateInterfaceCode gracefully handles empty map", () => {
  expect(generateInterfaceCode(new Map())).toBe("// 没有可用的接口信息");
});

test("generateInterfaceCode returns no data when module not found", () => {
  expect(generateInterfaceCode(multiModuleInfo, "Unknown")).toBe(
    "// 没有可用的接口信息",
  );
});
