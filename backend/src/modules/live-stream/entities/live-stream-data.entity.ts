import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';
import { LiveSite } from '../../live-site/entities/live-site.entity';

@Entity('live_stream_data')
export class LiveStreamData extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, name: 'site_code' })
  siteCode: string;

  @ManyToOne(() => LiveSite)
  @JoinColumn({ name: 'site_code', referencedColumnName: 'code' })
  site: LiveSite;

  @Column({ type: 'date', name: 'live_date' })
  liveDate: string;

  @Column({ type: 'varchar', length: 50, name: 'room_id' })
  roomId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'league_id' })
  leagueId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'live_info' })
  liveInfo: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'event_time' })
  eventTime: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  league: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'event_name' })
  eventName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'event_id' })
  eventId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  host: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'is_paid' })
  isPaid: string | null;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', default: 0, name: 'total_comments' })
  totalComments: number;

  @Column({ type: 'int', default: 0, name: 'platform_comments' })
  platformComments: number;

  @Column({ type: 'int', default: 0, name: 'external_comments' })
  externalComments: number;

  @Column({ type: 'int', default: 0, name: 'host_comments' })
  hostComments: number;

  @Column({ type: 'int', nullable: true, name: 'avg_stay_visit' })
  avgStayVisit: number | null;

  @Column({ type: 'int', nullable: true, name: 'avg_stay_person' })
  avgStayPerson: number | null;

  @Column({ type: 'int', nullable: true, name: 'peak_online' })
  peakOnline: number | null;

  @Column({ type: 'int', default: 0 })
  uv: number;

  @Column({ type: 'int', default: 0, name: 'unlock_count' })
  unlockCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'unlock_amount' })
  unlockAmount: number;

  @Column({ type: 'int', default: 0, name: 'tip_count' })
  tipCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'tip_amount' })
  tipAmount: number;

  @Column({ type: 'int', default: 0, name: 'coupon_count' })
  couponCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'plan_amount' })
  planAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'package_amount' })
  packageAmount: number;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
