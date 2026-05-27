export default [
  {
    path: '/login',
    layout: false,
    component: './user/login',
  },

  // 仪表盘
  {
    path: '/dashboard',
    name: '仪表盘',
    icon: 'dashboard',
    routes: [
      { path: '/dashboard', name: '首页仪表盘', component: './Dashboard' },
    ],
  },

  // 核心数据
  {
    path: '/core',
    name: '核心数据',
    icon: 'database',
    routes: [
      { path: 'products', name: '产品中心', component: './Products' },
      { path: 'sites', name: '站点管理', component: './Sites' },
      { path: 'sites/:id/daily', name: '站点日数据', component: './Sites/DailyData', hideInMenu: true },
      {
        path: 'entries',
        name: '数据录入',
        routes: [
          { path: 'list', name: '数据列表', component: './Entries/List' },
          { path: 'manual', name: '手动录入', component: './Entries/Manual' },
          { path: 'import', name: 'Excel 导入', component: './Entries/Import' },
        ],
      },
    ],
  },

  // 分析报表
  {
    path: '/reports',
    name: '分析报表',
    icon: 'barChart',
    routes: [
      { path: 'overview', name: '数据概览', component: './Reports/Overview' },
      { path: 'cross', name: '交叉分析', component: './Reports/Cross' },
      { path: 'products', name: '产品分析', component: './Reports/ProductAnalysis' },
      { path: 'products/:id', name: '产品明细', component: './Reports/ProductDetail', hideInMenu: true },
    ],
  },

  // AI 总结
  {
    path: '/ai',
    name: 'AI 总结',
    icon: 'robot',
    routes: [
      { path: 'generate', name: '生成总结', component: './AI/Generate' },
      { path: 'history', name: '历史记录', component: './AI/History' },
      { path: 'model-config', name: '模型管理', component: './AI/ModelConfig' },
    ],
  },

  // 监控与工具
  {
    path: '/monitor',
    name: '监控与工具',
    icon: 'monitor',
    routes: [
      { path: 'live-site', name: '直播站点', component: './LiveSitePage' },
      { path: 'live-stream', name: '直播数据', component: './LiveStreamPage' },
      { path: 'streamer', name: '主播中心', component: './Dictionary/StreamerCenter' },
    ],
  },

  // 系统配置
  {
    path: '/dict',
    name: '系统配置',
    icon: 'setting',
    routes: [
      { path: 'channels', name: '推广渠道', component: './Dictionary/Channels' },
      { path: 'regions', name: '推广地区', component: './Dictionary/Regions' },
      { path: 'users', name: '用户管理', component: './Admin/UserManagement' },
    ],
  },

  { path: '/', redirect: '/dashboard' },
  { path: '/*', layout: false, component: './exception/404' },
];
