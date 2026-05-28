import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streamer } from './entities/streamer.entity';
import { CreateStreamerDto } from './dto/create-streamer.dto';
import { UpdateStreamerDto } from './dto/update-streamer.dto';
import { QueryStreamerDto } from './dto/query-streamer.dto';

@Injectable()
export class StreamerService {
  private readonly logger = new Logger(StreamerService.name);

  constructor(
    @InjectRepository(Streamer) private streamerRepo: Repository<Streamer>,
  ) {}

  async list(query: QueryStreamerDto) {
    const { page = 1, pageSize = 10, name } = query;
    const qb = this.streamerRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.liveSite', 'liveSite');
    if (name) {
      qb.andWhere('s.name ILIKE :name', { name: `%${name}%` });
    }
    qb.orderBy('s.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<Streamer | null> {
    return this.streamerRepo.findOne({ where: { id }, relations: ['liveSite'] });
  }

  async create(dto: CreateStreamerDto): Promise<Streamer> {
    return this.streamerRepo.save(this.streamerRepo.create(dto));
  }

  async update(id: number, dto: UpdateStreamerDto): Promise<Streamer> {
    const entity = await this.findOne(id);
    if (!entity) throw new NotFoundException('主播不存在');
    Object.assign(entity, dto);
    return this.streamerRepo.save(entity);
  }

  async delete(id: number): Promise<void> {
    const entity = await this.streamerRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('主播不存在');
    await this.streamerRepo.remove(entity);
  }
}
