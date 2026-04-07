const validIdentifierRegex = /^[_$A-Za-z][_\$A-Za-z0-9]*$/;
const parameterLocations: Parameter["in"][] = [
  "path",
  "query",
  "header",
  "cookie",
];

const toPascalCase = (value: string): string => {
  const words = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1));
  return words.join("") || "Auto";
};

const safeIdentifier = (value: string, fallback: string): string => {
  if (validIdentifierRegex.test(value)) {
    return value;
  }
  return JSON.stringify(value);
};

const summarizePath = (path: string): string => {
  return (
    path
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/[{}]/g, ""))
      .map((segment) => toPascalCase(segment))
      .join("") || "Root"
  );
};

const describeSchema = (schema: Schema | undefined, hint: string): string => {
  if (!schema) {
    return "unknown";
  }

  if (schema.type === "array") {
    const itemType = describeSchema(schema.items, `${hint}Item`);
    return `${itemType}[]`;
  }

  if (schema.type === "object" || schema.properties) {
    const entries = Object.entries(schema.properties ?? {});
    if (entries.length === 0) {
      return "Record<string, unknown>";
    }
    const requiredFields = new Set(schema.required ?? []);
    const lines = entries.map(([key, child]) => {
      const propertyHint = `${hint}${toPascalCase(key) || "Field"}`;
      const optional = requiredFields.has(key) ? "" : "?";
      const propertyName = safeIdentifier(key, "field");
      const propertyType = describeSchema(child, propertyHint);
      return `  ${propertyName}${optional}: ${propertyType};`;
    });
    return ["{", ...lines, "}"].join("\n");
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    default:
      return "unknown";
  }
};

const getFirstJsonSchema = (
  content: Record<string, { schema: Schema }>,
): Schema | undefined => {
  const values = Object.values(content);
  if (values.length === 0) {
    return undefined;
  }
  return values[0].schema;
};

const getSuccessfulResponse = (
  responses: Responses,
): [string, Response] | undefined => {
  const statusEntries = Object.entries(responses);
  statusEntries.sort((a, b) => Number(a[0]) - Number(b[0]));
  return (
    statusEntries.find(([status]) => status.startsWith("2")) ?? statusEntries[0]
  );
};

const buildInterfaceComment = (
  summary: string | undefined,
  description: string | undefined,
): string => {
  const parts = [summary, description].filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  return `/** ${parts.join(" - ")} */`;
};

const describeParameters = (
  params: Parameter[],
): Map<Parameter["in"], Parameter[]> => {
  const grouped = new Map<Parameter["in"], Parameter[]>();
  parameterLocations.forEach((location) => grouped.set(location, []));
  params.forEach((param) => {
    const list = grouped.get(param.in);
    if (list) {
      list.push(param);
    }
  });
  return grouped;
};

const describeParameterGroup = (
  operationName: string,
  location: Parameter["in"],
  params: Parameter[],
): string[] => {
  if (params.length === 0) {
    return [];
  }
  const lines: string[] = [];
  lines.push(`  /** ${location} 参数 */`);
  lines.push(
    `  export interface ${operationName}${toPascalCase(location)}Params {`,
  );
  params.forEach((param) => {
    const safeName = safeIdentifier(param.name, "field");
    const optionalMark = param.required ? "" : "?";
    const type = param.schema
      ? describeSchema(
          param.schema,
          `${operationName}${toPascalCase(param.name)}`,
        )
      : "unknown";
    const descriptionComment = param.description
      ? ` /** ${param.description} */`
      : "";
    if (descriptionComment) {
      lines.push(`    ${descriptionComment}`);
    }
    lines.push(`    ${safeName}${optionalMark}: ${type};`);
  });
  lines.push("  }");
  return lines;
};

export const generateInterfaceCode = (
  interfaceInfo: InterfaceInfo,
  moduleName?: string,
): string => {

  if (interfaceInfo.size === 0) {
    return "// 没有可用的接口信息";
  }

  const moduleFilter = moduleName?.trim();
  const entries: [string, PathItemWithMeta[]][] = moduleFilter && moduleFilter.length > 0
    ? interfaceInfo.has(moduleFilter)
      ? [[moduleFilter, interfaceInfo.get(moduleFilter)!]]
      : []
    : Array.from(interfaceInfo.entries());

  if (entries.length === 0) {
    return "// 没有可用的接口信息";
  }

  const fragments: string[] = [];

  for (const [tag, operations] of entries) {
    const namespaceName = `${toPascalCase(tag)}Apis`;
    const namespaceLines: string[] = [
      `/** 标签 ${tag} 下的接口 */`,
      `export namespace ${namespaceName} {`,
    ];

    operations.forEach((operation) => {
      const operationTitle = `${operation.method.toUpperCase()} ${operation.path}`;
      const operationName = `${operation.method}${summarizePath(operation.path)}`;
      const comment = buildInterfaceComment(
        operation.summary,
        operation.description,
      );
      if (comment) {
        namespaceLines.push(`  ${comment}`);
      }
      namespaceLines.push(`  /** ${operationTitle} */`);

      const parameterGroups = describeParameters(operation.parameters ?? []);
      parameterGroups.forEach((params, location) => {
        const block = describeParameterGroup(operationName, location, params);
        if (block.length > 0) {
          namespaceLines.push(...block);
        }
      });

      if (operation.requestBody) {
        const schema = getFirstJsonSchema(operation.requestBody.content);
        if (schema) {
          namespaceLines.push(`  /** 请求体 */`);
          namespaceLines.push(
            `  export type ${operationName}RequestBody = ${describeSchema(
              schema,
              `${operationName}RequestBody`,
            )};`,
          );
        }
      }

      const responseEntry = getSuccessfulResponse(operation.responses);
      if (responseEntry) {
        const [status, response] = responseEntry;
        if (response.content) {
          const schema = getFirstJsonSchema(response.content);
          if (schema) {
            namespaceLines.push(`  /** 响应 ${status} */`);
            namespaceLines.push(
              `  export type ${operationName}Response = ${describeSchema(
                schema,
                `${operationName}Response`,
              )};`,
            );
          }
        }
      }
    });

    namespaceLines.push("}");
    fragments.push(namespaceLines.join("\n"));
  }

  return fragments.join("\n\n");
};
