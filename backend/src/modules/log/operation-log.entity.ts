import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('operation_log')
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, name: 'operation_type' })
  operationType: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  operator: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'target_table' })
  targetTable: string;

  @Column({ type: 'int', nullable: true, name: 'record_count' })
  recordCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'NOW()' })
  createdAt: Date;
}
