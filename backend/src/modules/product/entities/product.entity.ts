import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseTimeEntity } from '../../../common/entities/base-time.entity';
import { Channel } from '../../dictionary/entities/channel.entity';
import { Region } from '../../dictionary/entities/region.entity';

@Entity('product')
export class Product extends BaseTimeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  /** 商店 App ID（如 Apple Store ID: 123456789） */
  @Column({ type: 'varchar', length: 50, name: 'app_id' })
  appId: string;

  /** 应用名称（从商店 API 自动获取或手动填写） */
  @Column({ type: 'varchar', length: 200, name: 'app_name', nullable: true })
  appName: string | null;

  /** 平台 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  platform: string | null;

  /** 包名/Bundle ID */
  @Column({ type: 'varchar', length: 200, name: 'bundle_id', nullable: true })
  bundleId: string | null;

  /** 商店状态 */
  @Column({ type: 'varchar', length: 50, name: 'store_status', nullable: true })
  storeStatus: string | null;

  /** 商店图标（本地路径 /uploads/app-icons/xxx.png） */
  @Column({ type: 'varchar', length: 500, name: 'store_icon', nullable: true })
  storeIcon: string | null;

  /** 默认查询地区（ISO 国家码，如 US/CN） */
  @Column({ type: 'varchar', length: 10, name: 'default_country', nullable: true })
  defaultCountry: string | null;

  /** 状态：1=启用 0=禁用 */
  @Column({ type: 'smallint', default: 1 })
  status: number;

  /** 备注 */
  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;

  // ─── 非数据库字段（查询时动态计算） ───

  channelCount?: number;
  regionCount?: number;

  // ─── 多对多关联 ───

  @ManyToMany(() => Channel)
  @JoinTable({
    name: 'product_channels',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'channel_id', referencedColumnName: 'id' },
  })
  channels: Channel[];

  @ManyToMany(() => Region)
  @JoinTable({
    name: 'product_regions',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'region_id', referencedColumnName: 'id' },
  })
  regions: Region[];
}
