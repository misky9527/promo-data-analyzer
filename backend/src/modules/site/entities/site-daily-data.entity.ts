import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Site } from './site.entity';

@Entity('site_daily_data')
@Unique(['date', 'siteId'])
export class SiteDailyData {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'date', nullable: false })
  date: string;

  @ManyToOne(() => Site, { nullable: false })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'bigint', name: 'site_id' })
  siteId: number;

  @Column({ type: 'int', default: 0 })
  registrations: number;

  @Column({ type: 'int', default: 0, name: 'paying_users' })
  payingUsers: number;

  @Column({ type: 'int', default: 0, name: 'first_charge_users' })
  firstChargeUsers: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'entertainment_revenue' })
  entertainmentRevenue: number;

  @Column({ type: 'int', default: 0, name: 'entertainment_users' })
  entertainmentUsers: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'recharge_gold' })
  rechargeGold: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'exchange_amount' })
  exchangeAmount: number;

  @Column({ type: 'int', default: 0, name: 'exchange_users' })
  exchangeUsers: number;
}
