import {
  BarChartOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Col, DatePicker, Empty, Input, List, Row, Select, Space, Spin, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import MDEditor from '@uiw/react-md-editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  generateSummary,
  generateSummaryStream,
  getActiveModelConfigs,
  getChannels,
  getProducts,
  getRegions,
  getSummaryDetail,
  getSummaryHistory,
} from '@/services/api';

const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;

type OptionItem = { label: string; value: number };
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isMarkdown?: boolean;
  createdAt?: string;
  streaming?: boolean;
};

type ThinkingLevel = 'off' | 'low' | 'high';

type HistoryItem = {
  id: number;
  title?: string;
  createdAt?: string;
  content?: string;
  markdown?: string;
  filters?: Record<string, any>;
  type?: string;
  startDate?: string;
  endDate?: string;
  compareStartDate?: string;
  compareEndDate?: string;
  channelId?: number;
  appId?: number;
  regionId?: number;
  modelConfigId?: number;
  thinkingLevel?: ThinkingLevel;
};

const analysisTypeOptions = [
  { label: '单时段分析', value: 'single_period' },
  { label: '双时段对比分析', value: 'dual_period' },
  { label: '多渠道对比分析', value: 'multi_channel' },
];

const thinkingLevelOptions = [
  { label: '关闭', value: 'off' },
  { label: '快速', value: 'low' },
  { label: '深度', value: 'high' },
];

const thinkingLevelOptionsDeepSeek = [
  { label: '关闭', value: 'off' },
  { label: '开启思考', value: 'high' },
];

const defaultRange: [Dayjs, Dayjs] = [dayjs().subtract(7, 'day'), dayjs()];

const GeneratePage = () => {
  const { message } = App.useApp();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(defaultRange);
  const [compareRange, setCompareRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('single_period');
  const [channelIds, setChannelIds] = useState<number[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [regionIds, setRegionIds] = useState<number[]>([]);
  const [modelConfigId, setModelConfigId] = useState<number>();
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('off');
  const [outputStyle, setOutputStyle] = useState<'full' | 'brief'>('full');

  const [channelOptions, setChannelOptions] = useState<OptionItem[]>([]);
  const [productOptions, setProductOptions] = useState<OptionItem[]>([]);
  const [regionOptions, setRegionOptions] = useState<OptionItem[]>([]);
  const [modelOptions, setModelOptions] = useState<OptionItem[]>([]);
  const [modelProviderMap, setModelProviderMap] = useState<Record<number, string>>({});
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const currentProvider = modelConfigId ? modelProviderMap[modelConfigId] : undefined;

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number>();
  const [lastRequestPayload, setLastRequestPayload] = useState<Record<string, any>>();
  const [lastAssistantContent, setLastAssistantContent] = useState<string>();
  const [streamModelUsed, setStreamModelUsed] = useState<string>();
  const [lastModelInfo, setLastModelInfo] = useState<string>();
  const [lastThinkingInfo, setLastThinkingInfo] = useState<string>();

  const hasResult = chatMessages.length > 0;

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
  };

  const loadOptions = async () => {
    const [channels, products, regions, models] = await Promise.all([
      getChannels({ pageSize: 999 }),
      getProducts({ pageSize: 999 }),
      getRegions({ pageSize: 999 }),
      getActiveModelConfigs(),
    ]);

    setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
    setProductOptions((products.list || []).map((item: any) => ({ label: item.appName || item.appId, value: item.id })));
    setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
    const modelList = (models || []).map((item: any) => ({
      label: `${item.name} (${item.modelVersion})${item.isDefault ? ' · 默认' : ''}`,
      value: item.id,
    }));
    setModelOptions(modelList);
    const providerMap: Record<number, string> = {};
    (models || []).forEach((item: any) => {
      providerMap[item.id] = item.provider;
    });
    setModelProviderMap(providerMap);
    const defaultModel = (models || []).find((item: any) => item.isDefault) || models?.[0];
    if (defaultModel && !modelConfigId) {
      setModelConfigId(defaultModel.id);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await getSummaryHistory({ page: 1, pageSize: 5 });
      setHistoryItems(result.list || result || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadOptions(), loadHistory()]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading, asking]);

  const buildPayload = useMemo(
    () =>
      (extra?: Record<string, any>) => {
        const [startDate, endDate] = range || [];
        const [compareStartDate, compareEndDate] = compareRange || [];
        const payload: any = {
          type: analysisType,
          startDate: startDate?.format('YYYY-MM-DD'),
          endDate: endDate?.format('YYYY-MM-DD'),
          channelIds: channelIds.length ? channelIds : undefined,
          productIds: productIds.length ? productIds : undefined,
          regionIds: regionIds.length ? regionIds : undefined,
          modelConfigId,
          thinkingLevel,
          outputStyle,
          ...extra,
        };
        if (analysisType === 'dual_period' && compareStartDate && compareEndDate) {
          payload.compareStartDate = compareStartDate.format('YYYY-MM-DD');
          payload.compareEndDate = compareEndDate.format('YYYY-MM-DD');
        }
        return payload;
      },
    [analysisType, range, compareRange, channelIds, productIds, regionIds, modelConfigId, thinkingLevel, outputStyle],
  );

  const applyHistoryToFilters = (detail: HistoryItem) => {
    if (detail.startDate && detail.endDate) {
      setRange([dayjs(detail.startDate), dayjs(detail.endDate)]);
    }
    if (detail.compareStartDate && detail.compareEndDate) {
      setCompareRange([dayjs(detail.compareStartDate), dayjs(detail.compareEndDate)]);
    } else {
      setCompareRange(null);
    }
    if (detail.type) {
      setAnalysisType(detail.type);
    }
    setChannelIds(detail.channelId ? [detail.channelId] : []);
    setProductIds(detail.appId ? [detail.appId] : []);
    setRegionIds(detail.regionId ? [detail.regionId] : []);
    if (detail.modelConfigId) {
      setModelConfigId(detail.modelConfigId);
    }
    setThinkingLevel(detail.thinkingLevel || 'off');
  };

  const handleGenerate = async () => {
    if (!range?.[0] || !range?.[1]) {
      message.warning('请选择日期范围（必填）');
      return;
    }
    if (!modelConfigId) {
      message.warning('请选择模型（必填）');
      return;
    }

    const payload = buildPayload();
    const assistantId = `assistant-${Date.now()}`;
    setLoading(true);
    setActiveHistoryId(undefined);
    setStreamModelUsed(undefined);
    setLastRequestPayload(payload);

    const modelLabel = modelOptions.find(m => m.value === modelConfigId)?.label || '';
    const thinkingLabel = thinkingLevel === 'off' ? '关闭' : thinkingLevel === 'low' ? '快速' : currentProvider === 'deepseek' ? '开启思考' : '深度';
    setLastModelInfo(modelLabel);
    setLastThinkingInfo(thinkingLabel);

    setChatMessages([
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        isMarkdown: true,
        createdAt: new Date().toISOString(),
        streaming: true,
      },
    ]);

    try {
      await generateSummaryStream(payload, {
        onEvent: (raw) => {
          const event = raw.data || raw;
          if (event.type === 'start') {
            setStreamModelUsed(event.modelUsed);
            return;
          }

          if (event.type === 'chunk') {
            setChatMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? { ...item, content: `${item.content || ''}${event.content || ''}` }
                  : item,
              ),
            );
            return;
          }

          if (event.type === 'fallback') {
            setStreamModelUsed(event.modelUsed);
            setChatMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? { ...item, content: event.content || item.content, streaming: false }
                  : item,
              ),
            );
            return;
          }

          if (event.type === 'error') {
            message.error(event.message || '生成分析失败');
            setChatMessages([]);
            return;
          }
          if (event.type === 'done') {
            setStreamModelUsed(event.modelUsed || streamModelUsed);
            setChatMessages((prev) => {
              const updated = prev.map((item) => (item.id === assistantId ? { ...item, streaming: false } : item));
              const assistant = updated.find(i => i.id === assistantId);
              if (assistant?.content) setLastAssistantContent(assistant.content);
              return updated;
            });
          }
        },
      });
      await loadHistory();
    } catch (error: any) {
      setChatMessages([]);
      message.error(error?.message || '生成分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = async (item: HistoryItem) => {
    setActiveHistoryId(item.id);
    setLoading(true);
    setStreamModelUsed(item.title);
    try {
      const detail = await getSummaryDetail(item.id);
      applyHistoryToFilters(detail as HistoryItem);
      const config = (detail as any).configJson || {};
      setLastRequestPayload({
        type: detail.type,
        startDate: config.startDate || detail.startDate,
        endDate: config.endDate || detail.endDate,
        compareStartDate: config.compareStartDate,
        compareEndDate: config.compareEndDate,
        channelIds: config.channelIds,
        productIds: config.productIds,
        regionIds: config.regionIds,
        modelConfigId: config.modelConfigId,
        thinkingLevel: config.thinkingLevel || 'off',
      });
      setStreamModelUsed((detail as any).modelUsed);
      setChatMessages([
        {
          id: `history-${detail.id}`,
          role: 'assistant',
          content: detail.content || '',
          isMarkdown: true,
          createdAt: detail.createdAt,
          streaming: false,
        },
      ]);
      setLastAssistantContent(detail.content || '');
    } catch (error: any) {
      message.error(error?.message || '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }
    if (!lastAssistantContent) {
      message.warning('请先生成一次分析结果');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setAsking(true);
    try {
      const result = await generateSummary({
        type: 'single_period',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        modelConfigId,
        question: trimmed,
        context: lastAssistantContent,
      } as any);
      const markdown = result.content || result.markdown || '';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: markdown,
          isMarkdown: true,
          createdAt: new Date().toISOString(),
          streaming: false,
        },
      ]);
      await loadHistory();
    } catch (error: any) {
      message.error(error?.message || '追问失败，后端可能暂未支持 question 字段');
    } finally {
      setAsking(false);
    }
  };

  return (
    <PageContainer header={{ title: false }}>
      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={8}>
          <Card
            title={<><BarChartOutlined /> 分析配置</>}
            extra={
              <Button type="text" icon={<ReloadOutlined />} onClick={() => void Promise.all([loadOptions(), loadHistory()])}>
                刷新
              </Button>
            }
            styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
          >
            <Row gutter={12}>
              <Col span={12}>
                <Text type="secondary">分析产品</Text>
                <Select mode="multiple" value={productIds} onChange={setProductIds} options={productOptions} placeholder="选择产品" showSearch style={{ width: '100%', marginTop: 4 }} />
              </Col>
              <Col span={12}>
                <Text type="secondary">分析类型</Text>
                <Select value={analysisType} onChange={setAnalysisType} options={analysisTypeOptions} style={{ width: '100%', marginTop: 4 }} />
              </Col>
            </Row>
            <div>
              <Text type="secondary">日期范围</Text>
              <RangePicker value={range} onChange={(value) => setRange(value as [Dayjs, Dayjs] | null)} style={{ width: '100%', marginTop: 4 }} />
            </div>
            {analysisType === 'dual_period' && (
              <div>
                <RangePicker value={compareRange} onChange={(value) => setCompareRange(value as [Dayjs, Dayjs] | null)} placeholder={['对比开始', '对比结束']} style={{ width: '100%' }} />
              </div>
            )}
            <Row gutter={12}>
              <Col span={12}>
                <Text type="secondary">渠道筛选</Text>
                <Select mode="multiple" value={channelIds} onChange={setChannelIds} options={channelOptions} placeholder="选择渠道" showSearch style={{ width: '100%', marginTop: 4 }} />
              </Col>
              <Col span={12}>
                <Text type="secondary">推广地区筛选</Text>
                <Select mode="multiple" value={regionIds} onChange={setRegionIds} options={regionOptions} placeholder="选择推广地区" showSearch style={{ width: '100%', marginTop: 4 }} />
              </Col>
            </Row>
            <div>
              <Text type="secondary">模型选择</Text>
              <Select value={modelConfigId} onChange={setModelConfigId} options={modelOptions} placeholder="选择模型" style={{ width: '100%', marginTop: 4 }} />
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <Text type="secondary">思考模式</Text>
                <Select
                  value={thinkingLevel}
                  onChange={(v) => {
                    if (currentProvider === 'deepseek' && v === 'low') v = 'high';
                    setThinkingLevel(v);
                  }}
                  options={currentProvider === 'deepseek' ? thinkingLevelOptionsDeepSeek : thinkingLevelOptions}
                  style={{ width: '100%', marginTop: 4 }}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">输出风格</Text>
                <Select value={outputStyle} onChange={setOutputStyle} options={[
                  { label: '完整报告', value: 'full' },
                  { label: '简要总结', value: 'brief' },
                ]} style={{ width: '100%', marginTop: 4 }} />
              </Col>
            </Row>
            <Button type="primary" size="large" block loading={loading} icon={<ThunderboltOutlined />} onClick={() => void handleGenerate()}>
              生成分析
            </Button>
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card
            title={<><RobotOutlined /> AI 分析报告</>}
            extra={
              <Space>
                {lastModelInfo ? <Tag color="purple">{lastModelInfo}</Tag> : null}
                {lastThinkingInfo ? <Tag color={lastThinkingInfo === '关闭' ? 'default' : 'orange'}>{lastThinkingInfo}</Tag> : null}
                <Select
                  size="small"
                  value={undefined}
                  placeholder={<><HistoryOutlined /> 历史</>}
                  style={{ minWidth: 80 }}
                  loading={historyLoading}
                  options={historyItems.map(item => ({
                    label: `${item.createdAt ? dayjs(item.createdAt).format('YYYY/MM/DD') : '--'} ${item.title || ''}`,
                    value: item.id,
                  }))}
                  onSelect={(id) => { const item = historyItems.find(h => h.id === id); if (item) handleHistoryClick(item); }}
                />
              </Space>
            }
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 600 } }}
          >
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 24,
                background: '#fafbff',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {!hasResult && !loading ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="选择左侧指标和日期范围，点击生成分析" />
                </div>
              ) : null}

              {chatMessages.map((item) => {
                const isUser = item.role === 'user';
                return (
                  <div
                    key={item.id}
                    style={{
                      alignSelf: isUser ? 'flex-start' : 'stretch',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <Space size={8}>
                      {isUser ? <MessageOutlined style={{ color: '#8c8c8c' }} /> : <RobotOutlined style={{ color: '#1677ff' }} />}
                      <Text strong>{isUser ? '你的追问' : 'AI 回答'}</Text>
                      {item.createdAt ? <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.createdAt).format('YYYY/MM/DD')}</Text> : null}
                      {!isUser && item.streaming ? (
                        <Tag color="processing" icon={<LoadingOutlined spin />}>
                          生成中
                        </Tag>
                      ) : null}
                      {!isUser && !item.streaming && streamModelUsed ? <Tag color="blue">{streamModelUsed}</Tag> : null}
                    </Space>
                    <div
                      style={{
                        alignSelf: isUser ? 'flex-start' : 'stretch',
                        maxWidth: isUser ? '70%' : '100%',
                        background: isUser ? '#f5f5f5' : '#ffffff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
                      }}
                    >
                      {item.isMarkdown ? (
                        <div data-color-mode="light">
                          <MDEditor.Markdown source={item.content || (item.streaming ? 'AI 正在输出内容…' : '暂无内容')} />
                        </div>
                      ) : (
                        <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
                      )}
                    </div>
                  </div>
                );
              })}

              {(loading || asking) && !chatMessages.some((item) => item.streaming) ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <Spin tip={loading ? 'AI 正在分析数据...' : 'AI 正在整理追问...'} />
                </div>
              ) : null}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', padding: 16, background: '#fff' }}>
              <Input.Search
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onSearch={() => void handleAsk()}
                enterButton={<><SendOutlined /> 发送</>}
                placeholder="输入追问，例如：请重点解释 ROAS 下滑原因"
                loading={asking}
                disabled={!lastAssistantContent || loading}
              />
              {!lastAssistantContent ? (
                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                  先生成一份分析，再进行追问。
                </Text>
              ) : null}
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default GeneratePage;
