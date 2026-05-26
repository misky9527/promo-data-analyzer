import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveSiteController } from './live-site.controller';
import { LiveSiteService } from './live-site.service';
import { LiveSite } from './entities/live-site.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LiveSite])],
  controllers: [LiveSiteController],
  providers: [LiveSiteService],
  exports: [LiveSiteService],
})
export class LiveSiteModule {}
