export default {
  dev: {
    '/api': {
      target: 'http://localhost:3003',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:3003',
      changeOrigin: true,
    },
  },
} as const;
