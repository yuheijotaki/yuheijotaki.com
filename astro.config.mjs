import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';
import externalLinks from './src/rehype-plugins/external-links';
import addHeadingLinks from './src/rehype-plugins/add-heading-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://yuheijotaki.com',
  adapter: vercel(),
  experimental: {
    liveContentCollections: true,
  },
  server: {
    host: true,
    open: true,
  },
  compressHTML: true,
  integrations: [
    react(),
    mdx(),
    sitemap(),
    icon({
      iconDir: 'src/icons',
    }),
  ],
  prefetch: {
    defaultStrategy: 'hover',
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    rehypePlugins: [externalLinks, addHeadingLinks],
  },
  // vite: {
  //   css: {
  //     preprocessorOptions: {
  //       scss: {
  //         api: 'modern-compiler',
  //       },
  //     },
  //   },
  // },
});
