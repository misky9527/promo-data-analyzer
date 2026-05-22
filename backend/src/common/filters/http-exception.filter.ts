import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const msg = exception.getResponse();
      const message = typeof msg === 'string' ? msg : (msg as any).message || '请求失败';
      response.status(status).json({ code: status, message: Array.isArray(message) ? message[0] : message });
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
      response.status(500).json({ code: 500, message: '服务器内部错误' });
    }
  }
}
