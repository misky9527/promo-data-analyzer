import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** 统一响应格式 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * 统一响应拦截器
 * 将所有成功响应的 Controller 返回值包装为 { code: 0, data, message: 'ok' } 格式。
 * 不处理 StreamableFile / Buffer 等特例（交由框架原始返回）。
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 跳过文件流等非 JSON 响应
        if (
          data === null ||
          data === undefined ||
          Buffer.isBuffer(data) ||
          (typeof data === 'object' && 'pipe' in data)
        ) {
          return data;
        }
        return {
          code: 0,
          data,
          message: 'ok',
        };
      }),
    );
  }
}
