
import path from "node:path";
import { readFile } from "node:fs/promises";
import { toMap } from "../../utils/json.ts";

export const getFiletoDocument = async (filePath: string): Promise<InterfaceInfo> => {
  const resolvedPath = path.resolve(filePath);
  const jsonString = await readFile(resolvedPath, "utf-8");
  const swaggerDocument = JSON.parse(jsonString) as SwaggerDocument;
  return toMap(swaggerDocument);
};
