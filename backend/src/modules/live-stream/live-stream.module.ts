import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveStreamController } from './live-stream.controller';
import { LiveStreamService } from './live-stream.service';
import { LiveStreamData } from './entities/live-stream-data.entity';
import { ImportRecord } from './entities/import-record.entity';
import { ImportRecordService } from './import-record.service';
import { ImportRecordController } from './import-record.controller';
import { LiveSite } from '../live-site/entities/live-site.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveStreamData, ImportRecord, LiveSite]),
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }),
  ],
  controllers: [LiveStreamController, ImportRecordController],
  providers: [LiveStreamService, ImportRecordService],
  exports: [LiveStreamService, ImportRecordService],
})
export class LiveStreamModule {}
