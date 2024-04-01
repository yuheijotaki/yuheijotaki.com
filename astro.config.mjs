import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://yuheijotaki.com',
  server: {
    host: true,
    open: true,
  },
  integrations: [
    (await import('astro-compress')).default({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: false,
    }),
    react(),
    mdx(),
    sitemap(),
    icon({
      iconDir: 'src/icons',
    }),
  ],
  // experimental: {
  //   contentCollectionCache: true,
  // },
});
