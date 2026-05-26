import type { ReactNode } from 'react';
import { Tooltip } from 'antd';

export interface MetricDef {
  label: string;
  description: string;
}

export const METRICS: Record<string, MetricDef> = {
  impressions: { label: '展示量', description: '广告展示次数' },
  clicks: { label: '点击量', description: '用户点击广告次数' },
  downloads: { label: '下载量', description: '应用下载/安装次数' },
  spend: { label: '消耗', description: '广告花费总额（元）' },
  revenue: { label: '充值金额', description: '用户充值总金额（元）' },
  registrations: { label: '注册人数', description: '注册用户数' },
  payingUsers: { label: '充值人数', description: '当日充值用户数（去重）' },
  payRate: { label: '付费率', description: '充值人数 ÷ 下载量 × 100%' },
  costPerRegistration: { label: '注册成本', description: '每获得一个注册用户的平均花费（元）= 消耗 ÷ 注册人数' },
  costPerPayingUser: { label: '充值成本', description: '每获得一个充值用户的平均花费（元）= 消耗 ÷ 充值人数' },
  ctr: { label: 'CTR', description: '点击率 = 点击量 ÷ 展示量 × 100%' },
  cvr: { label: 'CVR', description: '转化率 = 下载量 ÷ 点击量 × 100%' },
  cpi: { label: 'CPI', description: '单次安装成本 = 消耗 ÷ 下载量（元）' },
  cpm: { label: 'CPM', description: '千次展示成本 = 消耗 ÷ 展示量 × 1000（元）' },
  cpc: { label: 'CPC', description: '单次点击成本 = 消耗 ÷ 点击量（元）' },
  roas: { label: 'ROAS', description: '广告支出回报率 = 充值金额 ÷ 消耗 × 100%' },
  registrationRate: { label: '注册率', description: '注册人数 ÷ 下载量 × 100%' },
  ltv: { label: 'LTV', description: '用户生命周期价值 = 充值金额 ÷ 下载量（元）' },
};

/**
 * Return a tooltip-wrapped ReactNode for a column header.
 * Falls back to the raw key when the metric is unknown.
 */
export function renderMetricTitle(key: string): ReactNode {
  const def = METRICS[key];
  if (!def) return key;
  return (
    <Tooltip title={def.description}>
      <span>{def.label}</span>
    </Tooltip>
  );
}

/**
 * Return the human-readable label (no tooltip) for a metric key.
 */
export function getMetricLabel(key: string): string {
  return METRICS[key]?.label || key;
}
