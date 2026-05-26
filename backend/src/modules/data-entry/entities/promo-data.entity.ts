import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';
import { Channel } from '../../dictionary/entities/channel.entity';
import { Product } from '../../product/entities/product.entity';
import { Region } from '../../dictionary/entities/region.entity';

@Entity('promo_data')
@Unique(['date', 'channelId', 'appId', 'regionId'])
@Check('"impressions" >= 0')
@Check('"clicks" >= 0')
@Check('"downloads" >= 0')
@Check('"spend" >= 0')
@Check('"revenue" >= 0')
@Check('"charge_count" >= 0')
@Check('"registrations" >= 0')
@Check('"paying_users" >= 0')
export class PromoData extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date', nullable: false })
  date: string;

  // ─── 外键关联 ───

  @ManyToOne(() => Channel, { nullable: false })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @Column({ type: 'bigint', name: 'channel_id' })
  channelId: number;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'app_id' })
  app: Product;

  @Column({ type: 'bigint', name: 'app_id' })
  appId: number;

  @ManyToOne(() => Region, { nullable: false })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ type: 'bigint', name: 'region_id' })
  regionId: number;

  // ─── 指标字段 ───

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  downloads: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spend: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue: number;

  @Column({ type: 'int', default: 0, name: 'charge_count' })
  chargeCount: number;

  @Column({ type: 'int', default: 0, name: 'registrations' })
  registrations: number;

  @Column({ type: 'int', default: 0, name: 'paying_users' })
  payingUsers: number;

  // ─── 备注 ───

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;
}
