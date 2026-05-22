import { request, toQuery } from '@/utils/request';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ProductPayload {
  appId: string;
  defaultCountry: string;
  appName: string;
  platform: string;
  bundleId: string;
  channelIds?: number[];
  regionIds?: number[];
  remark?: string;
}

export interface EntryPayload {
  productId: number;
  channelId: number;
  regionId: number;
  date: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  downloads?: number;
  revenue?: number;
  chargeCount?: number;
  registrations?: number;
  payingUsers?: number;
  retentionD1?: number;
  retentionD7?: number;
  retentionD30?: number;
}

export const login = (data: LoginPayload) =>
  request<{ token: string; user: API.CurrentUser }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const getProducts = (params: Record<string, unknown>) => request<any>(`/products${toQuery(params)}`);
export const getProduct = (id: number) => request<any>(`/products/${id}`);
export const createProduct = (data: ProductPayload) =>
  request<any>('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateProduct = (id: number, data: Partial<ProductPayload>) =>
  request<any>(`/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteProduct = (id: number) => request<any>(`/products/${id}`, { method: 'DELETE' });
export const lookupAppleApp = (appId: string, country: string) =>
  request<any>(`/products/apple-lookup${toQuery({ appId, country })}`);

export const getChannels = (params: Record<string, unknown>) => request<any>(`/dict/channel${toQuery(params)}`);
export const createChannel = (data: Record<string, unknown>) =>
  request<any>('/dict/channel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateChannel = (id: number, data: Record<string, unknown>) =>
  request<any>(`/dict/channel/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteChannel = (id: number) => request<any>(`/dict/channel/${id}`, { method: 'DELETE' });

export const getRegions = (params: Record<string, unknown>) => request<any>(`/dict/region${toQuery(params)}`);
export const createRegion = (data: Record<string, unknown>) =>
  request<any>('/dict/region', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateRegion = (id: number, data: Record<string, unknown>) =>
  request<any>(`/dict/region/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteRegion = (id: number) => request<any>(`/dict/region/${id}`, { method: 'DELETE' });

export const getEntries = (params: Record<string, unknown>) => request<any>(`/data-entries${toQuery(params)}`);
export const createEntry = (data: EntryPayload) =>
  request<any>('/data-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateEntry = (id: number, data: Partial<EntryPayload>) =>
  request<any>(`/data-entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteEntry = (id: number) => request<any>(`/data-entries/${id}`, { method: 'DELETE' });
export const importExcel = async (file: File, mode: string) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<any>(`/data-entries/import${toQuery({ mode })}`, {
    method: 'POST',
    body: formData,
  });
};
export const downloadTemplate = () => request<Blob>('/data-entries/template');

export const getOverview = (params: Record<string, unknown>) => request<any>(`/reports/overview${toQuery(params)}`);
export const getCrossAnalysis = (params: Record<string, unknown>) => request<any>(`/reports/cross-analysis${toQuery(params)}`);
export const getProductDetail = (params: Record<string, unknown>) =>
  request<any>(`/reports/product-detail${toQuery(params)}`);
export const getProductSummary = (params: Record<string, unknown>) =>
  request<any>(`/reports/product-summary${toQuery(params)}`);
export const getChannelSummary = (params: Record<string, unknown>) =>
  request<any>(`/reports/channel-summary${toQuery(params)}`);
export const getChannelDaily = (params: Record<string, unknown>) =>
  request<any>(`/reports/channel-daily${toQuery(params)}`);
export const getRegionSummary = (params: Record<string, unknown>) =>
  request<any>(`/reports/region-summary${toQuery(params)}`);
export const getRegionDaily = (params: Record<string, unknown>) =>
  request<any>(`/reports/region-daily${toQuery(params)}`);
export const exportReport = () => request<Blob>('/reports/export');

export const generateSummary = (data: Record<string, unknown>) =>
  request<any>('/ai-summary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const generateSummaryStream = async (
  params: Record<string, unknown>,
  handlers: {
    onEvent: (event: any) => void;
    onError?: (error: Error) => void;
  },
) => {
  const token = localStorage.getItem('promo_token');
  // Serialize arrays as comma-separated for GET query string
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length) queryParts.push(`${key}=${encodeURIComponent(value.join(','))}`);
    } else {
      queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  const url = `/api/ai-summary/generate-stream${queryParts.length ? '?' + queryParts.join('&') : ''}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    localStorage.removeItem('promo_token');
    localStorage.removeItem('promo_user');
    if (location.pathname !== '/login') {
      location.href = '/login';
    }
    throw new Error('登录已失效');
  }

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || '流式生成失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const segments = buffer.split('\n\n');
      buffer = segments.pop() || '';

      for (const segment of segments) {
        const line = segment
          .split('\n')
          .map((item) => item.trim())
          .find((item) => item.startsWith('data:'));

        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        handlers.onEvent(JSON.parse(payload));
      }
    }

    if (buffer.trim()) {
      const line = buffer
        .split('\n')
        .map((item) => item.trim())
        .find((item) => item.startsWith('data:'));
      if (line) {
        handlers.onEvent(JSON.parse(line.slice(5).trim()));
      }
    }
  } catch (error: any) {
    handlers.onError?.(error instanceof Error ? error : new Error('流式解析失败'));
    throw error;
  } finally {
    reader.releaseLock();
  }
};

export const getSummaryHistory = (params: Record<string, unknown>) => request<any>(`/ai-summary/history${toQuery(params)}`);
export const getSummaryDetail = (id: number) => request<any>(`/ai-summary/${id}`);
export const deleteSummary = (id: number) => request<any>(`/ai-summary/${id}`, { method: 'DELETE' });

export const getModelConfigs = (params: Record<string, unknown>) => request<any>(`/model-configs${toQuery(params)}`);
export const getActiveModelConfigs = () => request<any[]>('/model-configs/active');
export const fetchProviderModels = (provider: string, apiKey: string, baseUrl?: string) =>
  request<any>('/model-configs/fetch-models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey, baseUrl }),
  });

export const createModelConfig = (data: Record<string, unknown>) =>
  request<any>('/model-configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const updateModelConfig = (id: number, data: Record<string, unknown>) =>
  request<any>(`/model-configs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
export const deleteModelConfig = (id: number) => request<any>(`/model-configs/${id}`, { method: 'DELETE' });
