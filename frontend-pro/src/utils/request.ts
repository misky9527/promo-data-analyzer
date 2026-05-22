import { message } from 'antd';

const LOGIN_PATH = '/login';

function getToken() {
  return localStorage.getItem('promo_token');
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || '请求失败');
  }

  if (contentType.includes('application/json')) {
    const body = await response.json();
    if (typeof body === 'object' && body && 'code' in body) {
      if (body.code !== 0) {
        throw new Error(body.message || '请求失败');
      }
      return body.data as T;
    }
    return body as T;
  }

  return (await response.blob()) as T;
}

export async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api${input}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('promo_token');
    localStorage.removeItem('promo_user');
    if (location.pathname !== LOGIN_PATH) {
      location.href = LOGIN_PATH;
    }
    throw new Error('登录已失效');
  }

  try {
    return await parseResponse<T>(response);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '网络错误');
    throw error;
  }
}

export function toQuery(params: Record<string, unknown>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    sp.set(key, String(value));
  });
  const query = sp.toString();
  return query ? `?${query}` : '';
}
