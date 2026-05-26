import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AiSummary } from './entities/ai-summary.entity';
import { PromoData } from '../data-entry/entities/promo-data.entity';
import { MetricsCalculator, AggregatedRow } from '../report/metrics-calculator.service';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { IAiProvider } from './providers/ai-provider.interface';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AnalysisType } from '../../common/constants/business.constants';
import { ModelConfigService } from '../model-config/model-config.service';

interface QueryResult {
  summary: AggregatedRow;
  byChannel: { dimension: string; metrics: ReturnType<MetricsCalculator['computeAll']>; raw: AggregatedRow }[];
  byDate: { date: string; raw: AggregatedRow }[];
}

interface ResolvedModelConfig {
  apiKey: string;
  provider: string;
  modelVersion: string;
  baseUrl: string;
  thinkingLevel: GenerateSummaryDto['thinkingLevel'];
  modelUsed: string;
}

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  constructor(
    @InjectRepository(AiSummary)
    private readonly summaryRepo: Repository<AiSummary>,
    @InjectRepository(PromoData)
    private readonly promoRepo: Repository<PromoData>,
    private readonly calc: MetricsCalculator,
    private readonly deepseek: DeepSeekProvider,
    private readonly openai: OpenAIProvider,
    private readonly modelConfigService: ModelConfigService,
  ) {}

  async generate(dto: GenerateSummaryDto, userId: number) {
    // 追问模式：传了 context 就不重查数据，直接用上下文+问题
    if (dto.question && dto.context) {
      const prompt = `以下是之前的分析报告：

${dto.context}

---

用户追问：${dto.question}

请基于以上分析报告，直接回答用户的追问。`;
      const title = `追问 — ${dto.question.slice(0, 50)}`;
      const resolvedConfig = await this.resolveModelConfig(dto);
      const provider = this.selectProvider(resolvedConfig.provider);

      let content: string;
      let modelUsed = resolvedConfig.modelUsed;
      try {
        content = await provider.analyze(prompt, resolvedConfig.apiKey, resolvedConfig.modelVersion, resolvedConfig.baseUrl, resolvedConfig.thinkingLevel);
      } catch (err: any) {
        this.logger.error(`追问失败: ${err.message}`);
        throw new Error(`追问失败: ${err.message}`);
      }

      const entity = this.summaryRepo.create({
        type: dto.type || 'single_period',
        title,
        configJson: { contextLength: dto.context.length, question: dto.question },
        content,
        modelUsed,
        createdBy: userId,
      });
      const saved = await this.summaryRepo.save(entity);
      return { id: saved.id, title: saved.title, content: saved.content, modelUsed: saved.modelUsed, createdAt: saved.createdAt };
    }

    await this.ensureDataExists(dto);

    const queryResult = await this.queryDataForAnalysis(dto);
    const prompt = this.buildPrompt(dto, queryResult);
    const title = this.buildTitle(dto);
    const resolvedConfig = await this.resolveModelConfig(dto);
    const provider = this.selectProvider(resolvedConfig.provider);

    let content: string;
    let modelUsed = resolvedConfig.modelUsed;

    try {
      content = await provider.analyze(
        prompt,
        resolvedConfig.apiKey,
        resolvedConfig.modelVersion,
        resolvedConfig.baseUrl,
        resolvedConfig.thinkingLevel,
      );
    } catch (err: any) {
      const fallback = await this.tryFallback(prompt, dto, resolvedConfig.provider, err);
      content = fallback.content;
      modelUsed = fallback.modelUsed;
    }

    const saved = await this.saveSummary(dto, userId, title, content, modelUsed);
    this.logger.log(`AI 总结已生成: id=${saved.id}, model=${modelUsed}`);

    return {
      id: saved.id,
      title: saved.title,
      content: saved.content,
      modelUsed: saved.modelUsed,
      createdAt: saved.createdAt,
    };
  }

  async *generateStream(dto: GenerateSummaryDto, userId: number): AsyncGenerator<Record<string, any>> {
    await this.ensureDataExists(dto);

    const queryResult = await this.queryDataForAnalysis(dto);
    const prompt = this.buildPrompt(dto, queryResult);
    const title = this.buildTitle(dto);
    const resolvedConfig = await this.resolveModelConfig(dto);
    const provider = this.selectProvider(resolvedConfig.provider);

    yield {
      type: 'start',
      modelUsed: resolvedConfig.modelUsed,
      thinkingLevel: resolvedConfig.thinkingLevel || 'off',
    };

    let content = '';
    let modelUsed = resolvedConfig.modelUsed;

    try {
      for await (const chunk of provider.analyzeStream(
        prompt,
        resolvedConfig.apiKey,
        resolvedConfig.modelVersion,
        resolvedConfig.baseUrl,
        resolvedConfig.thinkingLevel,
      )) {
        content += chunk;
        yield { type: 'chunk', content: chunk };
      }
    } catch (err: any) {
      const fallback = await this.tryFallback(prompt, dto, resolvedConfig.provider, err);
      content = fallback.content;
      modelUsed = fallback.modelUsed;
      yield {
        type: 'fallback',
        modelUsed,
        content,
      };
    }

    const saved = await this.saveSummary(dto, userId, title, content, modelUsed);
    this.logger.log(`AI 流式总结已生成: id=${saved.id}, model=${modelUsed}`);

    yield {
      type: 'done',
      summaryId: saved.id,
      modelUsed,
    };
  }

  async getHistory(page: number = 1, pageSize: number = 10) {
    const [list, total] = await this.summaryRepo.findAndCount({
      select: ['id', 'type', 'title', 'modelUsed', 'createdBy', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async getDetail(id: number): Promise<AiSummary> {
    const entity = await this.summaryRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('AI 总结记录不存在');
    return entity;
  }

  async delete(id: number): Promise<void> {
    const entity = await this.summaryRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('AI 总结记录不存在');
    await this.summaryRepo.remove(entity);
  }

  private selectProvider(preferred?: string): IAiProvider {
    if (preferred === 'openai') return this.openai;
    return this.deepseek;
  }

  private async pickDefaultModelConfig() {
    const activeModels = await this.modelConfigService.getActive();
    const defaultModel = activeModels.find((item) => item.isDefault) || activeModels[0];
    if (!defaultModel) {
      throw new Error('暂无可用模型配置');
    }
    return this.modelConfigService.getById(defaultModel.id);
  }

  private async getFallbackModelConfig(currentProvider: string) {
    const activeModels = await this.modelConfigService.getActive();
    const fallback = activeModels.find((item) => item.provider !== currentProvider && item.isDefault)
      || activeModels.find((item) => item.provider !== currentProvider);
    return fallback ? this.modelConfigService.getById(fallback.id) : null;
  }

  private async resolveModelConfig(dto: GenerateSummaryDto): Promise<ResolvedModelConfig> {
    const modelConfig = dto.modelConfigId
      ? await this.modelConfigService.getById(dto.modelConfigId)
      : await this.pickDefaultModelConfig();

    if (!modelConfig.isActive) {
      throw new Error('所选模型已禁用');
    }

    return {
      apiKey: modelConfig.apiKey,
      provider: modelConfig.provider,
      modelVersion: modelConfig.modelVersion,
      baseUrl: modelConfig.baseUrl,
      thinkingLevel: dto.thinkingLevel,
      modelUsed: `${modelConfig.provider}:${modelConfig.modelVersion}`,
    };
  }

  private async tryFallback(
    prompt: string,
    dto: GenerateSummaryDto,
    currentProvider: string,
    originalError: any,
  ): Promise<{ content: string; modelUsed: string }> {
    this.logger.error(`AI 调用失败 (${currentProvider}): ${originalError.message}`);

    const fallbackConfig = await this.getFallbackModelConfig(currentProvider);
    if (!fallbackConfig) {
      throw new Error(`AI 调用失败且没有可用的 fallback: ${originalError.message}`);
    }

    try {
      const fallback = this.selectProvider(fallbackConfig.provider);
      const content = await fallback.analyze(
        prompt,
        fallbackConfig.apiKey,
        fallbackConfig.modelVersion,
        fallbackConfig.baseUrl,
        dto.thinkingLevel,
      );
      const modelUsed = `${fallback.name}:${fallbackConfig.modelVersion}`;
      this.logger.log(`Fallback 到 ${fallback.name} 成功`);
      return { content, modelUsed };
    } catch (fallbackErr: any) {
      this.logger.error(`Fallback 也失败: ${fallbackErr.message}`);
      throw new Error(`所有 AI provider 调用失败: ${originalError.message}`);
    }
  }

  private async saveSummary(
    dto: GenerateSummaryDto,
    userId: number,
    title: string,
    content: string,
    modelUsed: string,
  ) {
    const configJson: Record<string, any> = {
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
    };
    if (dto.compareStartDate) configJson.compareStartDate = dto.compareStartDate;
    if (dto.compareEndDate) configJson.compareEndDate = dto.compareEndDate;
    if (dto.channelIds?.length) configJson.channelIds = dto.channelIds;
    if (dto.productIds?.length) configJson.productIds = dto.productIds;
    if (dto.regionIds?.length) configJson.regionIds = dto.regionIds;
    if (dto.thinkingLevel) configJson.thinkingLevel = dto.thinkingLevel;
    if (dto.modelConfigId) configJson.modelConfigId = dto.modelConfigId;
    if (dto.question) configJson.question = dto.question;

    const entity = this.summaryRepo.create({
      type: dto.type,
      title,
      configJson,
      content,
      modelUsed,
      createdBy: userId,
    });

    return this.summaryRepo.save(entity);
  }

  private async ensureDataExists(dto: GenerateSummaryDto) {
    const count = await this.buildPromoDataBaseQuery(dto).getCount();
    if (count === 0) {
      throw new BadRequestException('所选时间范围内无推广数据，请先录入数据');
    }
  }

  private buildPromoDataBaseQuery(dto: GenerateSummaryDto): SelectQueryBuilder<PromoData> {
    const qb = this.promoRepo
      .createQueryBuilder('p')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      });

    this.applyFilters(qb, {
      channelIds: dto.channelIds,
      productIds: dto.productIds,
      regionIds: dto.regionIds,
    });

    return qb;
  }

  private async queryDataForAnalysis(dto: GenerateSummaryDto): Promise<QueryResult> {
    const { startDate, endDate, channelIds, productIds, regionIds } = dto;
    const filters = { startDate, endDate, channelIds, productIds, regionIds };
    const summary = await this.aggregateSummary(filters);
    const byChannel = await this.aggregateByChannel(filters);
    const byDate = await this.aggregateByDate(filters);
    return { summary, byChannel, byDate };
  }

  private async aggregateSummary(filters: {
    startDate: string;
    endDate: string;
    channelIds?: number[];
    productIds?: number[];
    regionIds?: number[];
  }): Promise<AggregatedRow> {
    const qb = this.promoRepo
      .createQueryBuilder('p')
      .select('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

    this.applyFilters(qb, filters);
    const raw = await qb.getRawOne();

    return {
      impressions: Number(raw?.impressions ?? 0),
      clicks: Number(raw?.clicks ?? 0),
      downloads: Number(raw?.downloads ?? 0),
      spend: Number(raw?.spend ?? 0),
      revenue: Number(raw?.revenue ?? 0),
      registrations: Number(raw?.registrations ?? 0),
      payingUsers: Number(raw?.payingUsers ?? 0),
    };
  }

  private async aggregateByChannel(filters: {
    startDate: string;
    endDate: string;
    channelIds?: number[];
    productIds?: number[];
    regionIds?: number[];
  }): Promise<QueryResult['byChannel']> {
    const qb = this.promoRepo
      .createQueryBuilder('p')
      .innerJoin('p.channel', 'ch')
      .select('ch.name', 'dimension')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy('ch.id')
      .addGroupBy('ch.name')
      .orderBy('impressions', 'DESC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();

    return raw.map((r: any) => {
      const row: AggregatedRow = {
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
        downloads: Number(r.downloads),
        spend: Number(r.spend),
        revenue: Number(r.revenue),
        registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
      };
      return { dimension: r.dimension, raw: row, metrics: this.calc.computeAll(row) };
    });
  }

  private async aggregateByDate(filters: {
    startDate: string;
    endDate: string;
    channelIds?: number[];
    productIds?: number[];
    regionIds?: number[];
  }): Promise<QueryResult['byDate']> {
    const qb = this.promoRepo
      .createQueryBuilder('p')
      .select('p.date', 'date')
      .addSelect('SUM(p.impressions)', 'impressions')
      .addSelect('SUM(p.clicks)', 'clicks')
      .addSelect('SUM(p.downloads)', 'downloads')
      .addSelect('SUM(p.spend)', 'spend')
      .addSelect('SUM(p.revenue)', 'revenue')
      .addSelect('SUM(p.registrations)', 'registrations')
      .addSelect('SUM(p.paying_users)', 'payingUsers')
      .where('p.date BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .groupBy('p.date')
      .orderBy('p.date', 'ASC');

    this.applyFilters(qb, filters);
    const raw = await qb.getRawMany();

    return raw.map((r: any) => ({
      date: r.date,
      raw: {
        impressions: Number(r.impressions),
        clicks: Number(r.clicks),
        downloads: Number(r.downloads),
        spend: Number(r.spend),
        revenue: Number(r.revenue),
        registrations: Number(r.registrations),
        payingUsers: Number(r.payingUsers),
      },
    }));
  }

  private buildPrompt(dto: GenerateSummaryDto, data: QueryResult): string {
    const typeLabel =
      dto.type === AnalysisType.SINGLE_PERIOD
        ? '单时段分析'
        : dto.type === AnalysisType.DUAL_PERIOD
          ? '双时段对比分析'
          : '多渠道对比分析';

    let prompt = `请分析以下推广数据，生成一份结构化的分析报告。\n\n`;
    prompt += `## 分析类型\n${typeLabel}\n\n`;
    prompt += `## 时间范围\n${dto.startDate} ~ ${dto.endDate}\n`;

    if (dto.compareStartDate && dto.compareEndDate) {
      prompt += `对比时段：${dto.compareStartDate} ~ ${dto.compareEndDate}\n`;
    }
    prompt += `\n`;

    const m = this.calc.computeAll(data.summary);
    prompt += `## 汇总数据\n`;
    prompt += `| 指标 | 数值 |\n`;
    prompt += `|------|------|\n`;
    prompt += `| 展示量 | ${data.summary.impressions} |\n`;
    prompt += `| 点击量 | ${data.summary.clicks} |\n`;
    prompt += `| 下载量 | ${data.summary.downloads} |\n`;
    prompt += `| 消耗 | ${data.summary.spend.toFixed(2)} |\n`;
    prompt += `| 充值金额 | ${data.summary.revenue.toFixed(2)} |\n`;
    prompt += `| CTR | ${m.ctr.toFixed(2)}% |\n`;
    prompt += `| CVR | ${m.cvr.toFixed(2)}% |\n`;
    prompt += `| CPI | ${m.cpi.toFixed(2)} |\n`;
    prompt += `| CPM | ${m.cpm.toFixed(2)} |\n`;
    prompt += `| CPC | ${m.cpc.toFixed(2)} |\n`;
    prompt += `| ROAS | ${m.roas.toFixed(2)}% |\n`;
    prompt += `| 充值人数 | ${data.summary.payingUsers} |\n`;
    prompt += `| 付费率 | ${m.payRate.toFixed(2)}% |\n`;
    prompt += `| 注册率 | ${m.registrationRate.toFixed(2)}% |\n`;
    prompt += `| LTV | ${m.ltv.toFixed(2)} |\n\n`;

    if (data.byChannel.length > 0) {
      prompt += `## 按渠道数据\n`;
      prompt += `| 渠道 | 展示量 | 点击量 | 下载量 | 消耗 | 充值金额 | CTR | CVR | ROAS |\n`;
      prompt += `|------|--------|--------|--------|------|----------|-----|-----|------|\n`;
      data.byChannel.forEach((ch) => {
        prompt += `| ${ch.dimension} | ${ch.raw.impressions} | ${ch.raw.clicks} | ${ch.raw.downloads} | ${ch.raw.spend.toFixed(2)} | ${ch.raw.revenue.toFixed(2)} | ${ch.metrics.ctr.toFixed(2)}% | ${ch.metrics.cvr.toFixed(2)}% | ${ch.metrics.roas.toFixed(2)}% |\n`;
      });
      prompt += `\n`;
    }

    if (data.byDate.length > 0) {
      prompt += `## 每日趋势数据（前30天）\n`;
      prompt += `| 日期 | 展示量 | 点击量 | 下载量 | 消耗 | 充值金额 |\n`;
      prompt += `|------|--------|--------|--------|------|----------|\n`;
      data.byDate.slice(-30).forEach((d) => {
        prompt += `| ${d.date} | ${d.raw.impressions} | ${d.raw.clicks} | ${d.raw.downloads} | ${d.raw.spend.toFixed(2)} | ${d.raw.revenue.toFixed(2)} |\n`;
      });
      prompt += `\n`;
    }

    if (dto.outputStyle === 'brief') {
      prompt += `请用 2-3 句话简要总结核心要点，不要分章节，不要表格，纯文本即可。\n`;
    } else {
      prompt += `请输出一份详细、专业的 Markdown 格式分析报告，尽可能深入分析每个指标，包括：\n`;
      prompt += `1. **数据概览**：整体数据情况，所有关键数值\n`;
      prompt += `2. **关键指标分析**：逐一解读 CTR/CVR/ROAS/LTV/CPI/CPM/CPC/注册成本/充值成本/注册率/付费率，标注正常或异常\n`;
      prompt += `3. **渠道对比**：各渠道的表现差异和排名（如有）\n`;
      prompt += `4. **趋势分析**：按日数据的变化趋势和转折点\n`;
      prompt += `5. **优化建议**：基于以上分析，给出 3-5 条具体、可执行的优化建议\n`;
      prompt += `\n报告应详细、有数据支撑，每个部分至少 2-3 句分析。\n`;
    }

    if (dto.question) {
      prompt += `\n---\n`;
      prompt += `## 用户追问\n`;
      prompt += `${dto.question}\n`;
      prompt += `\n请基于以上数据，重点回答用户的追问。\n`;
    }

    return prompt;
  }

  private buildTitle(dto: GenerateSummaryDto): string {
    const typeMap: Record<string, string> = {
      [AnalysisType.SINGLE_PERIOD]: '单时段分析',
      [AnalysisType.DUAL_PERIOD]: '双时段对比分析',
      [AnalysisType.MULTI_CHANNEL]: '多渠道对比分析',
    };
    const typeLabel = typeMap[dto.type] || dto.type;
    return `${typeLabel} — ${dto.startDate} ~ ${dto.endDate}`;
  }

  private applyFilters(
    qb: SelectQueryBuilder<PromoData>,
    filters: {
      channelIds?: number[];
      productIds?: number[];
      regionIds?: number[];
    },
  ): void {
    if (filters.channelIds?.length) qb.andWhere('p.channel_id IN (:...channelIds)', { channelIds: filters.channelIds });
    if (filters.productIds?.length) qb.andWhere('p.app_id IN (:...productIds)', { productIds: filters.productIds });
    if (filters.regionIds?.length) qb.andWhere('p.region_id IN (:...regionIds)', { regionIds: filters.regionIds });
  }
}
