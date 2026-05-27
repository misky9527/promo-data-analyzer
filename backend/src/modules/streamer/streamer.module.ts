import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamerController } from './streamer.controller';
import { StreamerService } from './streamer.service';
import { Streamer } from './entities/streamer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Streamer])],
  controllers: [StreamerController],
  providers: [StreamerService],
  exports: [TypeOrmModule],
})
export class StreamerModule {}
