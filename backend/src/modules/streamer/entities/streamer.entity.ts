import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';
import { LiveSite } from '../../live-site/entities/live-site.entity';

@Entity('streamer')
export class Streamer extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => LiveSite, { nullable: true })
  @JoinColumn({ name: 'live_site_id' })
  liveSite: LiveSite | null;

  @Column({ type: 'bigint', nullable: true })
  liveSiteId: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseSalary: number | null;

  @Column({ type: 'varchar', length: 20, default: '普通' })
  level: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;
}
