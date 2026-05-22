import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';

@Entity('model_config')
export class ModelConfig extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'text', name: 'api_key' })
  apiKey: string;

  @Column({ type: 'varchar', length: 255, name: 'base_url' })
  baseUrl: string;

  @Column({ type: 'varchar', length: 100, name: 'model_version' })
  modelVersion: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;
}
