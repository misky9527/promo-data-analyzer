declare namespace API {
  interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
  }

  interface CurrentUser {
    id?: number;
    username?: string;
    token?: string;
    name?: string;
  }

  interface PageResult<T> {
    list: T[];
    total: number;
    page?: number;
    pageSize?: number;
  }
}
