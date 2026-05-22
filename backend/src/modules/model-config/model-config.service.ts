import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelConfig } from './entities/model-config.entity';
import { CreateModelConfigDto } from './dto/create-model-config.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';
import { QueryModelConfigDto } from './dto/query-model-config.dto';
import { FetchModelsDto } from './dto/fetch-models.dto';

@Injectable()
export class ModelConfigService {
  constructor(
    @InjectRepository(ModelConfig)
    private readonly modelConfigRepo: Repository<ModelConfig>,
  ) {}

  async list(query: QueryModelConfigDto) {
    const { page = 1, pageSize = 10, provider } = query;
    const qb = this.modelConfigRepo.createQueryBuilder('mc');

    if (provider) {
      qb.andWhere('mc.provider = :provider', { provider });
    }

    qb.orderBy('mc.id', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async fetchModels(dto: FetchModelsDto) {
    const baseUrl = this.normalizeBaseUrl(dto.baseUrl || this.getDefaultBaseUrl(dto.provider));
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${dto.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestException(errorText || '获取模型列表失败');
    }

    const result = (await response.json()) as { data?: Array<{ id?: string; owned_by?: string }> };
    const models = (result.data || [])
      .filter((item) => this.isChatModel(item.id) && this.isProductionModel(item.id))
      .map((item) => ({
        id: item.id as string,
        owned_by: item.owned_by || 'unknown',
        description: this.getModelDescription(item.id as string),
      }))
      .sort((a, b) => {
        // 按白名单顺序排列
        const order = ['gpt-5.5', 'gpt-5.5-pro', 'gpt-5', 'gpt-5-mini', 'gpt-5.1', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'deepseek-v4-pro', 'deepseek-v4-flash'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      });

    return {
      provider: dto.provider,
      models,
    };
  }

  async create(dto: CreateModelConfigDto): Promise<ModelConfig> {
    const exists = await this.modelConfigRepo.findOne({
      where: { name: dto.name, provider: dto.provider },
    });
    if (exists) {
      throw new ConflictException('同 provider 下模型名称已存在');
    }

    if (dto.isDefault) {
      await this.clearDefaultForProvider(dto.provider);
    }

    const entity = this.modelConfigRepo.create({
      ...dto,
      baseUrl: dto.baseUrl || this.getDefaultBaseUrl(dto.provider),
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
    });
    return this.modelConfigRepo.save(entity);
  }

  async update(id: number, dto: UpdateModelConfigDto): Promise<ModelConfig> {
    const entity = await this.modelConfigRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('模型配置不存在');
    }

    const nextProvider = dto.provider || entity.provider;
    const nextName = dto.name || entity.name;
    const conflict = await this.modelConfigRepo
      .createQueryBuilder('mc')
      .where('mc.id != :id', { id })
      .andWhere('mc.provider = :provider', { provider: nextProvider })
      .andWhere('mc.name = :name', { name: nextName })
      .getOne();
    if (conflict) {
      throw new ConflictException('同 provider 下模型名称已存在');
    }

    if (dto.isDefault) {
      await this.clearDefaultForProvider(nextProvider, id);
    }

    Object.assign(entity, dto, {
      provider: nextProvider,
      baseUrl: dto.baseUrl || entity.baseUrl || this.getDefaultBaseUrl(nextProvider),
    });

    return this.modelConfigRepo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.modelConfigRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('模型配置不存在');
    }
    await this.modelConfigRepo.remove(entity);
  }

  async getActive() {
    return this.modelConfigRepo.find({
      where: { isActive: true },
      order: { provider: 'ASC', isDefault: 'DESC', id: 'DESC' },
      select: ['id', 'name', 'provider', 'baseUrl', 'modelVersion', 'isDefault', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async getById(id: number): Promise<ModelConfig> {
    const entity = await this.modelConfigRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('模型配置不存在');
    }
    return entity;
  }

  private async clearDefaultForProvider(provider: string, excludeId?: number) {
    const qb = this.modelConfigRepo
      .createQueryBuilder()
      .update(ModelConfig)
      .set({ isDefault: false })
      .where('provider = :provider', { provider });

    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }

    await qb.execute();
  }

  private isChatModel(modelId?: string) {
    if (!modelId) {
      return false;
    }

    const normalized = modelId.toLowerCase();
    return ['gpt-', 'o1', 'o3', 'o4', 'chatgpt-', 'deepseek-'].some((prefix) => normalized.startsWith(prefix));
  }

  /** 只返回 GPT-4+ 级别的纯 chat 模型，用于数据分析 */
  private isProductionModel(modelId?: string): boolean {
    if (!modelId) return false;
    const id = modelId.toLowerCase();

    // 白名单：只保留适合数据分析的主力 chat 模型
    // 白名单 + 简洁说明（只保留 GPT-4+ / 5+）
    const whitelist: Record<string, string> = {
      // GPT-5 系
      'gpt-5.5': '最新旗舰，最强分析',
      'gpt-5.5-pro': '专业版，复杂分析任务',
      'gpt-5': '高性能主力',
      'gpt-5-mini': '轻量快速',
      'gpt-5.1': '平衡性能与成本',
      // GPT-4 系
      'gpt-4.1': '性价比之选',
      'gpt-4.1-mini': '轻量经济',
      'gpt-4o': '多模态经典',
      'gpt-4o-mini': '轻量多模态',
      // DeepSeek
      'deepseek-v4-pro': '旗舰推理，最强性能',
      'deepseek-v4-flash': '轻量快速，高性价比',
    };

    return id in whitelist;
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-5.5': '最新旗舰，最强分析',
      'gpt-5.5-pro': '专业版，复杂分析任务',
      'gpt-5': '高性能主力',
      'gpt-5-mini': '轻量快速',
      'gpt-5.1': '平衡性能与成本',
      'gpt-4.1': '性价比之选',
      'gpt-4.1-mini': '轻量经济',
      'gpt-4o': '多模态经典',
      'gpt-4o-mini': '轻量多模态',
      'deepseek-v4-pro': '旗舰推理，最强性能',
      'deepseek-v4-flash': '轻量快速，高性价比',
    };
    return descriptions[modelId] || '';
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.replace(/\/+$/, '');
  }

  private getDefaultBaseUrl(provider: string) {
    if (provider === 'openai') {
      return 'https://api.openai.com/v1';
    }
    return 'https://api.deepseek.com/v1';
  }
}
