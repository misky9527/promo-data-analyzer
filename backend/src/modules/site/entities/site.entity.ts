import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';
import { Product } from '../../product/entities/product.entity';
import { SiteDailyData } from './site-daily-data.entity';

@Entity('site')
export class Site extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;

  @OneToMany(() => Product, (product) => product.site)
  products: Product[];

  @OneToMany(() => SiteDailyData, (d) => d.site)
  dailyData: SiteDailyData[];

  productCount?: number;
}
