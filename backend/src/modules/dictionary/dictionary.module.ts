import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { Channel } from './entities/channel.entity';
import { Region } from './entities/region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Region])],
  controllers: [DictionaryController],
  providers: [DictionaryService],
  exports: [TypeOrmModule],
})
export class DictionaryModule {}
