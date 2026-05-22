import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataEntryController } from './data-entry.controller';
import { DataEntryService } from './data-entry.service';
import { PromoData } from './entities/promo-data.entity';
import { Product } from '../product/entities/product.entity';
import { Channel } from '../dictionary/entities/channel.entity';
import { Region } from '../dictionary/entities/region.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoData, Channel, Product, Region]),
    ProductModule,
  ],
  controllers: [DataEntryController],
  providers: [DataEntryService],
  exports: [DataEntryService],
})
export class DataEntryModule {}
