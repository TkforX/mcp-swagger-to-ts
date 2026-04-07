export { };
declare global {
  interface SwaggerDocument {
    openapi: string;
    info: Info;
    servers: Server[];
    tags: Tag[];
    paths: Paths;
    components?: Components;
  }

  interface Info {
    title: string;
    version: string;
    description?: string;
  }

  interface Server {
    url: string;
  }

  interface Tag {
    name: string;
    description?: string;
  }

  // Paths 按路径和方法区分
  interface Paths {
    [path: string]: PathItem;
  }

  interface PathItem {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
    patch?: Operation;
    [method: string]: Operation | undefined;
  }

  interface Operation {
    tags?: string[];
    summary?: string;
    description?: string;
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Responses;
  }

  interface Parameter {
    in: 'query' | 'header' | 'path' | 'cookie';
    name: string;
    description?: string;
    required?: boolean;
    schema?: Schema;
  }

  interface RequestBody {
    required?: boolean;
    content: {
      [contentType: string]: {
        schema: Schema;
      };
    };
  }

  interface Responses {
    [statusCode: string]: Response;
  }

  interface Response {
    description?: string;
    content?: {
      [contentType: string]: {
        schema: Schema;
      };
    };
  }

  interface Schema {
    type?: string;
    properties?: {
      [key: string]: Schema;
    };
    items?: Schema;
    required?: string[];
  }


  interface Components {
    schemas?: { [key: string]: Schema };
    responses?: { [key: string]: Response };
    parameters?: { [key: string]: Parameter };
    requestBodies?: { [key: string]: RequestBody };
  }
  type PathItemWithMeta = Operation & { path: string; method: string };
  type InterfaceInfo = Map<string, PathItemWithMeta[]>;
}