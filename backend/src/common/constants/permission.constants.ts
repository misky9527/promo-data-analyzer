export const PERMISSION_MENUS = {
  dashboard: {
    key: 'dashboard',
    label: '仪表盘',
  },
  core: {
    key: 'core',
    label: '核心数据',
    children: [
      { label: '产品中心' },
      { label: '站点管理' },
      { label: '数据录入' },
    ],
  },
  reports: {
    key: 'reports',
    label: '分析报表',
    children: [
      { label: '数据概览' },
      { label: '交叉分析' },
      { label: '产品分析' },
    ],
  },
  ai: {
    key: 'ai',
    label: 'AI总结',
    children: [
      { label: '生成总结' },
      { label: '历史记录' },
      { label: '模型管理' },
    ],
  },
  monitor: {
    key: 'monitor',
    label: '监控与工具',
    children: [
      { label: '直播站点' },
      { label: '直播数据' },
      { label: '主播中心' },
    ],
  },
  dict: {
    label: '系统配置',
    children: [
      { key: 'dict_channels', label: '推广渠道' },
      { key: 'dict_regions', label: '推广地区' },
      { key: 'dict_users', label: '用户管理' },
    ],
  },
} as const;

export const ALL_PERMISSIONS = [
  PERMISSION_MENUS.dashboard.key,
  PERMISSION_MENUS.core.key,
  PERMISSION_MENUS.reports.key,
  PERMISSION_MENUS.ai.key,
  PERMISSION_MENUS.monitor.key,
  ...PERMISSION_MENUS.dict.children.map((item) => item.key),
] as const;

export const DEFAULT_ADMIN_PERMISSIONS = [
  PERMISSION_MENUS.dashboard.key,
  PERMISSION_MENUS.core.key,
  PERMISSION_MENUS.reports.key,
  PERMISSION_MENUS.ai.key,
  PERMISSION_MENUS.monitor.key,
  ...PERMISSION_MENUS.dict.children.map((item) => item.key),
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);
