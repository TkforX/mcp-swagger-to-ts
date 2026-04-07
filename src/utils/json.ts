
//提取swagger文档中的关键信息
export const toMap = (swagger: SwaggerDocument): InterfaceInfo => {
  const { paths } = swagger;
  const tagMap = new Map<string, PathItemWithMeta[]>();
  for (const path in paths) {
    const route = paths[path];
    for (const method in route) {
      const { tags } = route[method]!;
      if (tags && tags.length > 0) {
        tags.forEach((tag: string) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, [{ ...route[method]!, path, method }]);
          } else {
            tagMap.get(tag)!.push({ ...route[method]!, path, method });
          }
        });
      }
    }
  }
  return tagMap;
};
