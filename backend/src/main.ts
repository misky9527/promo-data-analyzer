// 全站北京时间，必须在所有 import 之前
process.env.TZ = 'Asia/Shanghai';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  // 静态文件服务：图标等 uploads 资源
  const uploadRoot = process.env.UPLOAD_ROOT_DIR || '/data/uploads';
  app.useStaticAssets(uploadRoot, { prefix: '/uploads' });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3003);
  console.log('🚀 Promo Data Analyzer running on http://localhost:3003');
}
bootstrap();
