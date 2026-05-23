import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { Product } from './entities/product.entity';
import { Channel } from '../dictionary/entities/channel.entity';
import { Region } from '../dictionary/entities/region.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

/** Apple iTunes Lookup API 返回结构 */
export interface AppleLookupResult {
  resultCount: number;
  results: AppleAppInfo[];
}

export interface AppleAppInfo {
  trackId: number;
  trackName: string;
  bundleId: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl512?: string;
  version: string;
  primaryGenreName?: string;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(Channel) private readonly channelRepo: Repository<Channel>,
    @InjectRepository(Region) private readonly regionRepo: Repository<Region>,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // 列表 & 详情
  // ═══════════════════════════════════════════════════════════

  /** 分页列表（含关联渠道数/地区数） */
  async list(query: QueryProductDto) {
    const { page = 1, pageSize = 10 } = query;
    const qb = this.repo
      .createQueryBuilder('p')
      .loadRelationCountAndMap('p.channelCount', 'p.channels')
      .loadRelationCountAndMap('p.regionCount', 'p.regions');

    if (query.status !== undefined) {
      qb.andWhere('p.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere(
        '(p.appName ILIKE :kw OR p.appId ILIKE :kw OR p.bundleId ILIKE :kw OR p.platform ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    qb.orderBy('p.id', 'ASC').skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  /** 详情（含关联） */
  async findOne(id: number): Promise<Product> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['channels', 'regions'],
    });
    if (!entity) throw new NotFoundException('产品不存在');
    return entity;
  }

  // ═══════════════════════════════════════════════════════════
  // 创建（含 Apple API 自动填充）
  // ═══════════════════════════════════════════════════════════

  async create(dto: CreateProductDto): Promise<Product> {
    // 检查 appId 唯一性
    const existing = await this.repo.findOne({ where: { appId: dto.appId } });
    if (existing) {
      throw new ConflictException('该 App ID 已存在');
    }

    // 调用 Apple API 获取应用信息
    let appleInfo: AppleAppInfo | null = null;
    try {
      appleInfo = await this.fetchAppleAppInfo(dto.appId, dto.defaultCountry);
    } catch (err) {
      this.logger.warn(`Apple API lookup failed for ${dto.appId}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 下载图标到本地
    let localIcon: string | null = null;
    if (appleInfo?.artworkUrl512) {
      try {
        localIcon = await this.downloadIcon(appleInfo.artworkUrl512);
      } catch (err) {
        this.logger.warn(`Icon download failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 组装实体
    const entity = this.repo.create({
      appId: dto.appId,
      appName: dto.appName || appleInfo?.trackName || null,
      platform: dto.platform || 'iOS',
      bundleId: dto.bundleId || appleInfo?.bundleId || null,
      storeStatus: appleInfo ? 'available' : null,
      storeIcon: localIcon || appleInfo?.artworkUrl512 || null,
      defaultCountry: dto.defaultCountry || null,
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      remark: dto.remark || null,
      siteId: dto.siteId || null,
    });

    // 关联渠道 & 地区
    if (dto.channelIds?.length) {
      entity.channels = await this.channelRepo.findBy({ id: In(dto.channelIds) });
    }
    if (dto.regionIds?.length) {
      entity.regions = await this.regionRepo.findBy({ id: In(dto.regionIds) });
    }

    return this.repo.save(entity);
  }

  // ═══════════════════════════════════════════════════════════
  // 更新
  // ═══════════════════════════════════════════════════════════

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['channels', 'regions'] });
    if (!entity) throw new NotFoundException('产品不存在');

    // 基础字段
    if (dto.appName !== undefined) entity.appName = dto.appName;
    if (dto.platform !== undefined) entity.platform = dto.platform;
    if (dto.bundleId !== undefined) entity.bundleId = dto.bundleId;
    if (dto.storeStatus !== undefined) entity.storeStatus = dto.storeStatus;
    if (dto.defaultCountry !== undefined) entity.defaultCountry = dto.defaultCountry;
    if (dto.startDate !== undefined) entity.startDate = dto.startDate || null;
    if (dto.endDate !== undefined) entity.endDate = dto.endDate || null;
    if (dto.remark !== undefined) entity.remark = dto.remark;
    if (dto.siteId !== undefined) entity.siteId = dto.siteId || null;

    // 关联渠道
    if (dto.channelIds !== undefined) {
      entity.channels = await this.channelRepo.findBy({ id: In(dto.channelIds) });
    }
    // 关联地区
    if (dto.regionIds !== undefined) {
      entity.regions = await this.regionRepo.findBy({ id: In(dto.regionIds) });
    }

    return this.repo.save(entity);
  }

  // ═══════════════════════════════════════════════════════════
  // 删除（物理删除）
  // ═══════════════════════════════════════════════════════════

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('产品不存在');
    await this.repo.remove(entity);
  }

  // ═══════════════════════════════════════════════════════════
  // Apple API
  // ═══════════════════════════════════════════════════════════

  /** 调用 Apple iTunes Lookup API 获取应用信息，无结果返回 null */
  async fetchAppleAppInfo(appId: string, country: string): Promise<AppleAppInfo | null> {
    const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${encodeURIComponent(country)}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'PromoDataAnalyzer/1.0' } });

    if (!resp.ok) {
      this.logger.warn(`Apple API returned ${resp.status} for appId=${appId} country=${country}`);
      return null;
    }

    const data: AppleLookupResult = await resp.json();
    if (data.resultCount === 0 || !data.results?.length) {
      return null;
    }

    return data.results[0];
  }

  /** 预先查询 Apple API（不保存），供前端表单预览用 */
  async previewAppleApp(appId: string, country: string): Promise<AppleAppInfo | null> {
    return this.fetchAppleAppInfo(appId, country);
  }

  // ═══════════════════════════════════════════════════════════
  // 图标下载
  // ═══════════════════════════════════════════════════════════

  private async downloadIcon(imageUrl: string): Promise<string> {
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      throw new BadRequestException('无效的图标 URL');
    }

    const resp = await fetch(imageUrl, {
      headers: { 'User-Agent': 'PromoDataAnalyzer/1.0' },
      // 60s timeout via AbortController
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) throw new Error(`Download failed with status ${resp.status}`);

    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get('content-type') || '';

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    const extension = extMap[contentType] || extname(new URL(imageUrl).pathname).slice(0, 8) || '.png';
    const fileName = `${randomUUID()}${extension}`;
    const uploadRoot = process.env.UPLOAD_ROOT_DIR || '/data/uploads';
    const dirPath = join(uploadRoot, 'app-icons');
    const absolutePath = join(dirPath, fileName);
    const localUrl = `/uploads/app-icons/${fileName}`;

    await mkdir(dirPath, { recursive: true });
    await writeFile(absolutePath, buffer);

    this.logger.log(`Icon downloaded: ${imageUrl} -> ${localUrl} (${buffer.length} bytes)`);
    return localUrl;
  }
}
