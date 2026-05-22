export default [
  {
    path: '/login',
    layout: false,
    component: './user/login',
  },

  // 核心业务
  {
    path: '/core',
    name: '核心业务',
    icon: 'dashboard',
    routes: [
      { path: 'dashboard', name: '首页仪表盘', component: './Dashboard' },
      { path: 'products', name: '产品中心', component: './Products' },
      { path: 'entries/list', name: '数据列表', component: './Entries/List' },
      { path: 'entries/manual', name: '手动录入', component: './Entries/Manual' },
      { path: 'entries/import', name: 'Excel 导入', component: './Entries/Import' },
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

  // 字典管理
  {
    path: '/dict',
    name: '字典管理',
    icon: 'book',
    routes: [
      { path: 'channels', name: '推广渠道', component: './Dictionary/Channels' },
      { path: 'regions', name: '推广地区', component: './Dictionary/Regions' },
    ],
  },

  { path: '/', redirect: '/core/dashboard' },
  { path: '/*', layout: false, component: './exception/404' },
];
