import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';

@Entity('region')
export class Region extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;
}
