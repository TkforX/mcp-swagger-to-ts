/** 标签 Users 下的接口 */
export namespace UsersApis {
  /** Get all users - Returns a list of all users */
  /** GET /api/users */
  /** 响应 200 */
  export type getApiUsersResponse = {
  id?: number;
  name?: string;
  email?: string;
}[];
  /** Create a new user - Creates a new user with the provided data */
  /** POST /api/users */
  /** 请求体 */
  export type postApiUsersRequestBody = {
  name?: string;
  email?: string;
};
  /** 响应 201 */
  export type postApiUsersResponse = {
  id?: number;
  name?: string;
  email?: string;
};
  /** Get a user by ID - Returns a single user by their ID */
  /** GET /api/users/{id} */
  /** path 参数 */
  export interface getApiUsersIdPathParams {
     /** User ID */
    id: number;
  }
  /** 响应 200 */
  export type getApiUsersIdResponse = {
  id?: number;
  name?: string;
  email?: string;
};
  /** Update a user - Updates an existing user with the provided data */
  /** PUT /api/users/{id} */
  /** path 参数 */
  export interface putApiUsersIdPathParams {
     /** User ID */
    id: number;
  }
  /** 请求体 */
  export type putApiUsersIdRequestBody = {
  name?: string;
  email?: string;
};
  /** 响应 200 */
  export type putApiUsersIdResponse = {
  id?: number;
  name?: string;
  email?: string;
};
  /** Delete a user - Deletes a user by their ID */
  /** DELETE /api/users/{id} */
  /** path 参数 */
  export interface deleteApiUsersIdPathParams {
     /** User ID */
    id: number;
  }
  /** 响应 200 */
  export type deleteApiUsersIdResponse = {
  message?: string;
};
}