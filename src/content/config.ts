import { z, defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';
import { createClient } from 'microcms-js-sdk';
import { loadEnv } from 'vite';

// 環境変数をロード
const env = loadEnv('', process.cwd(), '');

const blog = defineCollection({
  type: 'content',
  schema: rssSchema.extend({
    draft: z.optional(z.boolean()),
  }),
});

// 静的版用のmicroCMS Content Collection（ビルド時に取得）
const staticMicroCMSBlog = defineCollection({
  loader: async () => {
    const serviceDomain = env.MICROCMS_DOMAIN;
    const apiKey = env.MICROCMS_PRODUCTION_API_KEY;

    if (!serviceDomain || !apiKey) {
      console.error('MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required');
      return [];
    }

    const client = createClient({
      serviceDomain,
      apiKey,
    });

    try {
      const response = await client.get({
        endpoint: 'blog',
      });

      return response.contents.map((post: any) => ({
        id: post.id,
        title: post.title,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        publishedAt: new Date(post.publishedAt),
      }));
    } catch (error) {
      console.error('Failed to fetch from microCMS:', error);
      return [];
    }
  },
  schema: z.object({
    title: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    publishedAt: z.date(),
  }),
});

export const collections = { blog, staticMicroCMSBlog };
