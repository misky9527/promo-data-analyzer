export type ThinkingLevel = 'off' | 'low' | 'high';

export interface IAiProvider {
  readonly name: string;
  analyze(
    prompt: string,
    apiKey?: string,
    model?: string,
    baseURL?: string,
    thinkingLevel?: ThinkingLevel,
  ): Promise<string>;
  analyzeStream(
    prompt: string,
    apiKey?: string,
    model?: string,
    baseURL?: string,
    thinkingLevel?: ThinkingLevel,
  ): AsyncIterable<string>;
}
