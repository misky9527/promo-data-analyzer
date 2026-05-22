import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IAiProvider, ThinkingLevel } from './ai-provider.interface';

@Injectable()
export class DeepSeekProvider implements IAiProvider {
  readonly name = 'deepseek';
  private readonly logger = new Logger(DeepSeekProvider.name);
  private readonly baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  private readonly defaultApiKey = process.env.DEEPSEEK_API_KEY;
  private readonly systemPrompt =
    '你是一个广告数据分析专家。请基于提供的推广数据生成结构化的分析报告，使用 Markdown 格式输出。报告应包括：数据概览、关键指标分析、趋势分析、优化建议。';

  constructor() {
    if (!this.defaultApiKey) {
      this.logger.warn('DEEPSEEK_API_KEY 未设置，DeepSeek provider 将不可用');
    }
  }

  async analyze(
    prompt: string,
    apiKey?: string,
    model = 'deepseek-chat',
    baseURL?: string,
    thinkingLevel: ThinkingLevel = 'off',
  ): Promise<string> {
    const finalApiKey = apiKey || this.defaultApiKey;
    if (!finalApiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }

    const client = new OpenAI({ apiKey: finalApiKey, baseURL: baseURL || this.baseURL });
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        { role: 'user', content: prompt },
      ],
      ...(thinkingLevel !== 'off'
        ? {
            reasoning_effort: thinkingLevel === 'high' ? 'high' : 'low',
            extra_body: { thinking: { type: 'enabled' } },
          }
        : {
            temperature: 0.3,
            max_tokens: 4096,
          }),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek 返回空内容');
    }

    this.logger.log(`DeepSeek 分析完成，返回 ${content.length} 字符`);
    return content;
  }

  async *analyzeStream(
    prompt: string,
    apiKey?: string,
    model = 'deepseek-chat',
    baseURL?: string,
    thinkingLevel: ThinkingLevel = 'off',
  ): AsyncGenerator<string> {
    const finalApiKey = apiKey || this.defaultApiKey;
    if (!finalApiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }

    const client = new OpenAI({ apiKey: finalApiKey, baseURL: baseURL || this.baseURL });
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        { role: 'user', content: prompt },
      ],
      ...(thinkingLevel !== 'off'
        ? {
            reasoning_effort: thinkingLevel === 'high' ? 'high' : 'low',
            extra_body: { thinking: { type: 'enabled' } },
          }
        : {
            temperature: 0.3,
            max_tokens: 4096,
          }),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
