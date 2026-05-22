import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ai_summary')
export class AiSummary {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 32 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'jsonb', name: 'config_json' })
  configJson: Record<string, any>;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, name: 'model_used' })
  modelUsed: string;

  @Column({ type: 'bigint', name: 'created_by' })
  createdBy: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
