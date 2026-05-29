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

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', nullable: true, name: 'avg_stay_visit' })
  avgStayVisit: number | null;

  @Column({ type: 'int', nullable: true, name: 'avg_stay_person' })
  avgStayPerson: number | null;

  @Column({ type: 'int', nullable: true, name: 'peak_online' })
  peakOnline: number | null;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
