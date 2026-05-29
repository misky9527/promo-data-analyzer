import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSite } from './entities/live-site.entity';

@Injectable()
export class LiveSiteService {
  constructor(
    @InjectRepository(LiveSite)
    private readonly repo: Repository<LiveSite>,
  ) {}

  /** 全量列表（不分页，用于下拉选择） */
  async list(): Promise<LiveSite[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  /** 新增站点 */
  async create(dto: { code: string; name: string }): Promise<LiveSite> {
    const code = dto.code.toUpperCase();
    const exists = await this.repo.findOne({ where: { code } });
    if (exists) {
      throw new ConflictException(`站点 code "${code}" 已存在`);
    }
    return this.repo.save(this.repo.create({ ...dto, code }));
  }

  /** 删除站点 */
  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('站点不存在');
    }
    await this.repo.remove(entity);
  }
}
