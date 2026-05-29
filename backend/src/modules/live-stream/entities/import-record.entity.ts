import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('import_record')
export class ImportRecord {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 50, name: 'site_code' })
  siteCode: string;

  @Column({ type: 'date', name: 'live_date' })
  liveDate: string;

  @Column({ type: 'int', name: 'record_count' })
  recordCount: number;

  @Column({ type: 'varchar', length: 100 })
  operator: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
