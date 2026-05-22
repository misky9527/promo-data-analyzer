import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { Region } from './entities/region.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { QueryDictDto } from './dto/query-dict.dto';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);

  constructor(
    @InjectRepository(Channel) private channelRepo: Repository<Channel>,
    @InjectRepository(Region) private regionRepo: Repository<Region>,
  ) {}

  // ─── 渠道 ───

  async listChannels(query: QueryDictDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.channelRepo.createQueryBuilder('c');
    if (query.status !== undefined) {
      qb.andWhere('c.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere('(c.name ILIKE :kw OR c.code ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    qb.orderBy('c.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async createChannel(dto: CreateChannelDto): Promise<Channel> {
    const existing = await this.channelRepo.findOne({
      where: [{ name: dto.name }, { code: dto.code }],
    });
    if (existing) {
      throw new ConflictException('渠道名称或编码已存在');
    }
    return this.channelRepo.save(this.channelRepo.create(dto));
  }

  async updateChannel(id: number, dto: UpdateChannelDto): Promise<Channel> {
    const entity = await this.channelRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('渠道不存在');
    if (dto.name || dto.code) {
      const conflict = await this.channelRepo
        .createQueryBuilder('c')
        .where('c.id != :id', { id })
        .andWhere('(c.name = :name OR c.code = :code)', { name: dto.name, code: dto.code })
        .getOne();
      if (conflict) throw new ConflictException('渠道名称或编码已存在');
    }
    Object.assign(entity, dto);
    return this.channelRepo.save(entity);
  }

  async deleteChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('渠道不存在');
    await this.channelRepo.update(id, { status: 0 });
  }

  // ─── 地区 ───

  async listRegions(query: QueryDictDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.regionRepo.createQueryBuilder('r');
    if (query.status !== undefined) {
      qb.andWhere('r.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere('(r.name ILIKE :kw OR r.code ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    qb.orderBy('r.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async createRegion(dto: CreateRegionDto): Promise<Region> {
    const existing = await this.regionRepo.findOne({
      where: [{ name: dto.name }, { code: dto.code }],
    });
    if (existing) {
      throw new ConflictException('地区名称或编码已存在');
    }
    return this.regionRepo.save(this.regionRepo.create(dto));
  }

  async updateRegion(id: number, dto: UpdateRegionDto): Promise<Region> {
    const entity = await this.regionRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('地区不存在');
    if (dto.name || dto.code) {
      const conflict = await this.regionRepo
        .createQueryBuilder('r')
        .where('r.id != :id', { id })
        .andWhere('(r.name = :name OR r.code = :code)', { name: dto.name, code: dto.code })
        .getOne();
      if (conflict) throw new ConflictException('地区名称或编码已存在');
    }
    Object.assign(entity, dto);
    return this.regionRepo.save(entity);
  }

  async deleteRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('地区不存在');
    await this.regionRepo.update(id, { status: 0 });
  }
}
