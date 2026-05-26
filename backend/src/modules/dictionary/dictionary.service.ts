import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
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
    qb.andWhere('c.deletedAt IS NULL');
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

  async disableChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('渠道不存在');
    await this.channelRepo.update(id, { status: 0 });
  }

  async enableChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('渠道不存在');
    await this.channelRepo.update(id, { status: 1 });
  }

  async deleteChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('渠道不存在');
    if (entity.status !== 0) {
      throw new BadRequestException('请先禁用该渠道');
    }
    await this.channelRepo.softDelete(id);
  }

  async restoreChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('渠道不存在');
    if (!entity.deletedAt) throw new BadRequestException('该渠道未被删除');
    await this.channelRepo.restore(id);
  }

  async permanentDeleteChannel(id: number): Promise<void> {
    const entity = await this.channelRepo.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('渠道不存在');
    await this.channelRepo.remove(entity);
  }

  async recycleChannels(query: QueryDictDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.channelRepo.createQueryBuilder('c');
    qb.andWhere('c.deletedAt IS NOT NULL');
    if (query.keyword) {
      qb.andWhere('(c.name ILIKE :kw OR c.code ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    qb.withDeleted();
    qb.orderBy('c.deletedAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  // ─── 地区 ───

  async listRegions(query: QueryDictDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.regionRepo.createQueryBuilder('r');
    qb.andWhere('r.deletedAt IS NULL');
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

  async disableRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('地区不存在');
    await this.regionRepo.update(id, { status: 0 });
  }

  async enableRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('地区不存在');
    await this.regionRepo.update(id, { status: 1 });
  }

  async deleteRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('地区不存在');
    if (entity.status !== 0) {
      throw new BadRequestException('请先禁用该地区');
    }
    await this.regionRepo.softDelete(id);
  }

  async restoreRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('地区不存在');
    if (!entity.deletedAt) throw new BadRequestException('该地区未被删除');
    await this.regionRepo.restore(id);
  }

  async permanentDeleteRegion(id: number): Promise<void> {
    const entity = await this.regionRepo.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('地区不存在');
    await this.regionRepo.remove(entity);
  }

  async recycleRegions(query: QueryDictDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.regionRepo.createQueryBuilder('r');
    qb.andWhere('r.deletedAt IS NOT NULL');
    if (query.keyword) {
      qb.andWhere('(r.name ILIKE :kw OR r.code ILIKE :kw)', { kw: `%${query.keyword}%` });
    }
    qb.withDeleted();
    qb.orderBy('r.deletedAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }
}
