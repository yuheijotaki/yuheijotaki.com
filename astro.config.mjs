import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import swup from '@swup/astro';
import { imageService } from '@unpic/astro/service';
import externalLinks from './src/rehype-plugins/external-links';
import addHeadingLinks from './src/rehype-plugins/add-heading-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://yuheijotaki.com',
  server: {
    host: true,
    open: true,
  },
  compressHTML: true,
  integrations: [
    // (await import('astro-compress')).default({
    //   CSS: true,
    //   HTML: true,
    //   Image: false,
    //   JavaScript: true,
    //   SVG: false,
    // }),
    react(),
    mdx(),
    sitemap(),
    icon({
      iconDir: 'src/icons',
    }),
    swup({
      theme: false,
      // animationClass: 'transition-',
      // containers: ['main'] // セレクタ選択できるが指定すると動かなかったためHTML要素 `.transition-fade` を指定
      cache: true,
      preload: {
        hover: true,
        visible: false, // ビューポートに入るときにプリロードすると記事一覧で重くなるためfalseに
      },
      accessibility: true, // フォーカスが移動しないためtrueにするが、トップではロゴにフォーカス移動したほうがよさげなので要調整？
      progress: false,
      smoothScrolling: false,
      globalInstance: true,
      // updateHead: true,
      // updateBodyClass: true,
      // debug: true,
      // reloadScripts: false, // 遷移時にscriptを再読み込みさせない
    }),
  ],
  prefetch: {
    defaultStrategy: 'hover',
  },
  image: {
    service: imageService({
      // fallbackService: 'vercel',
      // placeholder: 'dominantColor',
      // layout: 'constrained',
    }),
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    rehypePlugins: [externalLinks, addHeadingLinks],
  },
  // experimental: {
  //   contentCollectionCache: true,
  // },
});
