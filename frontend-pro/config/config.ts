import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { UMI_ENV = 'dev' } = process.env;

export default defineConfig({
  esbuildMinifyIIFE: true,
  hash: true,
  routes,
  proxy: proxy[UMI_ENV as keyof typeof proxy],
  fastRefresh: true,
  model: {},
  initialState: {},
  request: {},
  access: {},
  layout: {
    locale: false,
    ...defaultSettings,
  },
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        token: {
          colorPrimary: '#1677ff',
        },
      },
    },
  },
  title: '推广数据分析系统',
  ignoreMomentLocale: true,
  routePrefetch: {},
  manifest: {},
  define: {
    'process.env.CI': process.env.CI,
  },
});
