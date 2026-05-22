import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { Channel } from '../dictionary/entities/channel.entity';
import { Region } from '../dictionary/entities/region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Channel, Region])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
