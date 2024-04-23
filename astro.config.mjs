import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import swup from '@swup/astro';
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
    swup({
      theme: false,
      animationClass: 'transition-',
      // containers: ['main'] // セレクタ選択できるが指定すると動かなかったためHTML要素 `.transition-fade` を指定
      cache: true,
      preload: {
        hover: true,
        visible: false, // ビューポートに入るときにプリロードすると記事一覧で重くなるためfalseに
      },
      accessibility: true, // フォーカスが移動しないためtrueにするが、トップではロゴにフォーカス移動したほうがよさげなので要調整？
      progress: false,
      // debug: true,
    }),
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
