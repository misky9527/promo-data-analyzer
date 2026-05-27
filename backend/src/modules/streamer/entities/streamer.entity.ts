import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';

@Entity('streamer')
export class Streamer extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  affiliation: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseSalary: number | null;

  @Column({ type: 'varchar', length: 20, default: '普通' })
  level: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;
}
