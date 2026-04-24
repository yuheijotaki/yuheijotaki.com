import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';
import externalLinks from './src/rehype-plugins/external-links';
import addHeadingLinks from './src/rehype-plugins/add-heading-links';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ブログ記事の pubDate を事前にマップ化（sitemap の lastmod に利用）
const blogDir = './src/content/blog';
const blogPubDates = new Map();
for (const file of readdirSync(blogDir)) {
  if (!/\.(md|mdx)$/.test(file) || file.startsWith('_')) continue;
  // Astro は URL に `@` を含めないため、ここでもスラッグから除去する
  const slug = file.replace(/\.(md|mdx)$/, '').replace(/@/g, '');
  const content = readFileSync(join(blogDir, file), 'utf-8');
  const match = content.match(/^pubDate:\s*(.+)$/m);
  if (!match) continue;
  const date = new Date(match[1].trim());
  if (!Number.isNaN(date.valueOf())) {
    blogPubDates.set(slug, date.toISOString());
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://yuheijotaki.com',
  adapter: vercel(),
  server: {
    host: true,
    open: true,
  },
  compressHTML: true,
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/demo/'),
      serialize(item) {
        const match = item.url.match(/\/blog\/([^/]+)\/?$/);
        if (match) {
          const lastmod = blogPubDates.get(match[1]);
          if (lastmod) item.lastmod = lastmod;
        }
        return item;
      },
    }),
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
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          importers: [
            {
              findFileUrl(url) {
                if (!url.startsWith('@/')) return null;
                return pathToFileURL(resolve('./src', url.slice(2)));
              },
            },
          ],
        },
      },
    },
  },
});
