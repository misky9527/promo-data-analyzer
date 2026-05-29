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
export const disableChannel = (id: number) => request<any>(`/dict/channel/${id}/disable`, { method: 'POST' });
export const enableChannel = (id: number) => request<any>(`/dict/channel/${id}/enable`, { method: 'POST' });
export const deleteChannel = (id: number) => request<any>(`/dict/channel/${id}`, { method: 'DELETE' });
export const restoreChannel = (id: number) => request<any>(`/dict/channel/${id}/restore`, { method: 'POST' });
export const permanentDeleteChannel = (id: number) => request<any>(`/dict/channel/${id}/permanent`, { method: 'DELETE' });
export const getRecycleChannels = (params: Record<string, unknown>) => request<any>(`/dict/channel/recycle${toQuery(params)}`);

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
export const disableRegion = (id: number) => request<any>(`/dict/region/${id}/disable`, { method: 'POST' });
export const enableRegion = (id: number) => request<any>(`/dict/region/${id}/enable`, { method: 'POST' });
export const deleteRegion = (id: number) => request<any>(`/dict/region/${id}`, { method: 'DELETE' });
export const restoreRegion = (id: number) => request<any>(`/dict/region/${id}/restore`, { method: 'POST' });
export const permanentDeleteRegion = (id: number) => request<any>(`/dict/region/${id}/permanent`, { method: 'DELETE' });
export const getRecycleRegions = (params: Record<string, unknown>) => request<any>(`/dict/region/recycle${toQuery(params)}`);

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
export const importExcel = async (file: File, mode: string, productId?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams();
  params.set('mode', mode);
  if (productId) params.set('productId', String(productId));
  return request<any>(`/data-entries/import?${params.toString()}`, {
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
export const getSiteSummary = (params: Record<string, unknown>) =>
  request<any>(`/reports/site-summary${toQuery(params)}`);
export const getSiteDaily = (params: Record<string, unknown>) =>
  request<any>(`/reports/site-daily${toQuery(params)}`);
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

// === 站点 ===
export const getSites = (params: Record<string, unknown>) => request<any>(`/sites${toQuery(params)}`);
export const getSite = (id: number) => request<any>(`/sites/${id}`);
export const createSite = (data: any) => request<any>('/sites', { method: 'POST', data });
export const updateSite = (id: number, data: any) => request<any>(`/sites/${id}`, { method: 'PATCH', data });
export const deleteSite = (id: number) => request<any>(`/sites/${id}`, { method: 'DELETE' });

// === 站点日数据 ===
export const getSiteDailyData = (params: Record<string, unknown>) => request<any>(`/site-daily-data${toQuery(params)}`);
export const createSiteDailyData = (data: any) => request<any>('/site-daily-data', { method: 'POST', data });
export const updateSiteDailyData = (id: number, data: any) => request<any>(`/site-daily-data/${id}`, { method: 'PATCH', data });
export const deleteSiteDailyData = (id: number) => request<any>(`/site-daily-data/${id}`, { method: 'DELETE' });
export const importSiteDailyExcel = (file: File, mode: string, siteId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams();
  params.set('mode', mode);
  params.set('siteId', String(siteId));
  return request<any>(`/site-daily-data/import?${params.toString()}`, { method: 'POST', body: formData });
};
export const downloadSiteDailyTemplate = () => request<Blob>('/sites/daily/template');

// === 直播站点 ===
export const fetchLiveSiteList = () => request<API.LiveSiteItem[]>('/admin/live-site/list');
export const createLiveSite = (data: { code: string; name: string }) =>
  request<API.LiveSiteItem>('/admin/live-site', { method: 'POST', data });
export const deleteLiveSite = (id: number) =>
  request<any>(`/admin/live-site/${id}`, { method: 'DELETE' });

// === 导入记录 ===
export const getImportRecords = (params: Record<string, unknown>) =>
  request<any>(`/admin/import-record${toQuery(params)}`);
export const deleteImportRecord = (id: number) =>
  request<any>(`/admin/import-record/${id}`, { method: 'DELETE' });
export const emptyImportRecycleBin = () =>
  request<any>('/admin/import-record/recycle-bin', { method: 'DELETE' });
export const restoreImportRecord = (id: number) =>
  request<any>(`/admin/import-record/${id}/restore`, { method: 'PATCH' });

// === 直播数据 ===
export const importLiveStreamData = async (files: File[], dedupMode?: string) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const url = dedupMode
    ? `/admin/live-stream/import?dedupMode=${dedupMode}`
    : '/admin/live-stream/import';
  return request<{
    files: { fileName: string; success: number; failed: number; error?: string; duplicates?: number }[];
    totalSuccess: number;
    totalFailed: number;
  }>(url, {
    method: 'POST',
    body: formData,
  });
};
export const getLiveStreamList = (params: Record<string, unknown>) => request<any>(`/admin/live-stream/list${toQuery(params)}`);
export const getDailySummary = (params: Record<string, unknown>) => request<any>(`/admin/live-stream/daily-summary${toQuery(params)}`);
export const deleteLiveStreamRecord = (id: number) => request<any>(`/admin/live-stream/${id}`, { method: 'DELETE' });
export const getEventSummary = (params: Record<string, unknown>) =>
  request<any>(`/admin/live-stream/event-summary${toQuery(params)}`);
export const getHostSummary = (params: Record<string, unknown>) =>
  request<any>(`/admin/live-stream/host-summary${toQuery(params)}`);
export const getEventHostSummary = (params: Record<string, unknown>) =>
  request<any>(`/admin/live-stream/event-host-summary${toQuery(params)}`);
export const batchDeleteLiveStreamRecords = (ids: number[]) =>
  request<any>('/admin/live-stream/batch-delete', { method: 'POST', data: { ids } });

// === 管理员用户管理 ===
export const fetchAdminUserList = (params: Record<string, unknown>) =>
  request<API.PageResult<API.AdminUserRecord>>(`/admin/admin-user/list${toQuery(params)}`);
export const createAdminUser = (data: Record<string, unknown>) =>
  request('/admin/admin-user', { method: 'POST', data });
export const updateAdminUser = (id: number, data: Record<string, unknown>) =>
  request(`/admin/admin-user/${id}`, { method: 'PUT', data });
export const deleteAdminUser = (id: number) =>
  request(`/admin/admin-user/${id}`, { method: 'DELETE' });
export const resetAdminUserPassword = (id: number) =>
  request(`/admin/admin-user/${id}/reset-password`, { method: 'POST' });
export const changeAdminUserPassword = (data: { oldPassword: string; newPassword: string }) =>
  request('/admin/admin-user/change-password', { method: 'POST', data });
export const updateAdminUserSelf = (data: { username?: string }) =>
  request('/admin/admin-user/self', { method: 'PUT', data });
export const setAdminUserPassword = (id: number, data: { newPassword: string }) =>
  request(`/admin/admin-user/${id}/change-password`, { method: 'POST', data });

// === 主播中心 ===
export const getStreamers = (params: Record<string, unknown>) => request<any>(`/admin/streamer${toQuery(params)}`);
export const createStreamer = (data: Record<string, unknown>) =>
  request<any>('/admin/streamer', { method: 'POST', data });
export const updateStreamer = (id: number, data: Record<string, unknown>) =>
  request<any>(`/admin/streamer/${id}`, { method: 'PATCH', data });
export const deleteStreamer = (id: number) => request<any>(`/admin/streamer/${id}`, { method: 'DELETE' });

// === 运维中心 ===
export const executeSql = (sql: string) =>
  request<{ columns: string[]; rows: any[] }>('/admin/ops/execute', {
    method: 'POST',
    data: { sql },
  });
