import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://nationalcontractorassociation.com',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false,
    functionPerRoute: true,
  }),
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/react'],
    },
    ssr: {
      // Bundle @stackframe/stack for SSR to avoid ESM/CommonJS conflicts
      noExternal: ['@stackframe/stack'],
    },
  },
});
