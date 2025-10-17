import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://nationalcontractorassociation.com',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'server', // SSR for dynamic pages
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/react'],
    },
  },
});
