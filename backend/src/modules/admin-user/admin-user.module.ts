import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { AdminUser } from '../auth/entities/admin-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  controllers: [AdminUserController],
  providers: [AdminUserService],
})
export class AdminUserModule {}
