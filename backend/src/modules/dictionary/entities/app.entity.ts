import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';

@Entity('app')
@Unique(['name', 'platform'])
export class App extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  platform: string;

  @Column({ type: 'varchar', length: 200, name: 'package_name', nullable: true })
  packageName: string | null;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;
}
