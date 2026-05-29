export default [
  {
    path: '/login',
    layout: false,
    component: './user/login',
  },

  {
    path: '/dashboard',
    name: '仪表盘',
    icon: 'dashboard',
    access: 'dashboard',
    routes: [
      { path: '/dashboard', name: '首页仪表盘', component: './Dashboard', access: 'dashboard' },
    ],
  },

  {
    path: '/core',
    name: '核心数据',
    icon: 'database',
    access: 'core',
    routes: [
      { path: 'products', name: '产品中心', component: './Products', access: 'core' },
      { path: 'sites', name: '站点管理', component: './Sites', access: 'core' },
      { path: 'sites/:id/daily', name: '站点日数据', component: './Sites/DailyData', hideInMenu: true, access: 'core' },
      {
        path: 'entries',
        name: '数据录入',
        access: 'core',
        routes: [
          { path: 'list', name: '数据列表', component: './Entries/List', access: 'core' },
          { path: 'manual', name: '手动录入', component: './Entries/Manual', access: 'core' },
          { path: 'import', name: 'Excel 导入', component: './Entries/Import', access: 'core' },
        ],
      },
    ],
  },

  {
    path: '/reports',
    name: '分析报表',
    icon: 'barChart',
    access: 'reports',
    routes: [
      { path: 'overview', name: '数据概览', component: './Reports/Overview', access: 'reports' },
      { path: 'cross', name: '交叉分析', component: './Reports/Cross', access: 'reports' },
      { path: 'products', name: '产品分析', component: './Reports/ProductAnalysis', access: 'reports' },
      { path: 'products/:id', name: '产品明细', component: './Reports/ProductDetail', hideInMenu: true, access: 'reports' },
    ],
  },

  {
    path: '/ai',
    name: 'AI 总结',
    icon: 'robot',
    access: 'ai',
    routes: [
      { path: 'generate', name: '生成总结', component: './AI/Generate', access: 'ai' },
      { path: 'history', name: '历史记录', component: './AI/History', access: 'ai' },
      { path: 'model-config', name: '模型管理', component: './AI/ModelConfig', access: 'ai' },
    ],
  },

  {
    path: '/monitor',
    name: '监控与工具',
    icon: 'monitor',
    access: 'monitor',
    routes: [
      { path: 'live-site', name: '直播站点', component: './LiveSitePage', access: 'monitor' },
      { path: 'live-stream', name: '直播数据', component: './LiveStreamPage', access: 'monitor' },
      { path: 'streamer', name: '主播中心', component: './Dictionary/StreamerCenter', access: 'monitor' },
    ],
  },

  {
    path: '/system',
    name: '系统管理',
    icon: 'control',
    access: 'isAdmin',
    routes: [
      { path: 'ops-center', name: '运维中心', component: './OpsCenter', access: 'isSuperAdmin' },
      { path: 'log-center', name: '日志中心', component: './LogCenter', access: 'isAdmin' },
    ],
  },

  {
    path: '/dict',
    name: '系统配置',
    icon: 'setting',
    access: 'canViewDict',
    routes: [
      { path: 'channels', name: '推广渠道', component: './Dictionary/Channels', access: 'dict_channels' },
      { path: 'regions', name: '推广地区', component: './Dictionary/Regions', access: 'dict_regions' },
      { path: 'users', name: '用户管理', component: './Admin/UserManagement', access: 'dict_users' },
    ],
  },

  { path: '/', redirect: '/dashboard' },
  { path: '/*', layout: false, component: './exception/404' },
];
