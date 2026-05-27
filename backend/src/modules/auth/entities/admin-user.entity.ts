import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';

@Entity('admin_user')
export class AdminUser extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, name: 'role_type', default: 'super_admin' })
  roleType: string;

  @Column({ type: 'smallint', default: 1 })
  status: number;

  @Column({ type: 'int', name: 'jwt_version', default: 0 })
  jwtVersion: number;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[] | null;
}
