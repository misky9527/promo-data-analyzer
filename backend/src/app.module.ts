import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { DictionaryModule } from './modules/dictionary/dictionary.module';
import { DataEntryModule } from './modules/data-entry/data-entry.module';
import { ReportModule } from './modules/report/report.module';
import { AiSummaryModule } from './modules/ai-summary/ai-summary.module';
import { ProductModule } from './modules/product/product.module';
import { ModelConfigModule } from './modules/model-config/model-config.module';
import { SiteModule } from './modules/site/site.module';
import { LiveStreamModule } from './modules/live-stream/live-stream.module';
import { LiveSiteModule } from './modules/live-site/live-site.module';
import { StreamerModule } from './modules/streamer/streamer.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { OpsModule } from './modules/ops/ops.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from './modules/auth/entities/admin-user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'promo-jwt-secret-dev'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'promo_data'),
        autoLoadEntities: true,
        // ⚠️ TODO: MVP 阶段使用 synchronize:true 自动同步数据库结构
        // 生产环境必须关闭，改用 TypeORM migration（否则可能导致数据丢失）
        // 参考: https://typeorm.io/migrations#running-migrations
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([AdminUser]),
    AuthModule,
    DictionaryModule,
    DataEntryModule,
    ReportModule,
    AiSummaryModule,
    ProductModule,
    ModelConfigModule,
    SiteModule,
    LiveStreamModule,
    LiveSiteModule,
    StreamerModule,
    AdminUserModule,
    OpsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser) private userRepo: Repository<AdminUser>,
  ) {}

  async onModuleInit() {
    const existing = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (!existing) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.userRepo.save(this.userRepo.create({ username: 'admin', passwordHash: hash, roleType: 'super_admin' }));
      console.log('✅ 初始管理员已创建: admin / admin123');
    }
  }
}
