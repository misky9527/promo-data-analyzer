import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteController, SiteDailyDataController } from './site.controller';
import { SiteService } from './site.service';
import { Site } from './entities/site.entity';
import { SiteDailyData } from './entities/site-daily-data.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Site, SiteDailyData, Product])],
  controllers: [SiteController, SiteDailyDataController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
