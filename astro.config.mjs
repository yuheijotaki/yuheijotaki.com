import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    server: {
      host: true,
      open: true,
  },
  site: 'https://yuheijotaki.com',
  integrations: [mdx(), sitemap()],
});
