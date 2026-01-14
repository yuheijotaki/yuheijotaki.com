import { defineLiveCollection } from 'astro:content';
import { createClient } from 'microcms-js-sdk';
import { z } from 'astro:content';
import { loadEnv } from 'vite';

// 環境変数をロード
const env = loadEnv('', process.cwd(), '');

// microCMS レスポンスの型定義
interface MicroCMSBlogPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
}

interface MicroCMSResponse {
  contents: MicroCMSBlogPost[];
  totalCount: number;
  offset: number;
  limit: number;
}

// スキーマ定義
const blogSchema = z.object({
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date(),
});

// Live Content Collection の定義
const liveBlog = defineLiveCollection({
  type: 'live',
  loader: {
    loadCollection: async () => {
      try {
        // loader内で環境変数を読み込む
        const serviceDomain = env.MICROCMS_DOMAIN;
        const apiKey = env.MICROCMS_PRODUCTION_API_KEY;

        if (!serviceDomain || !apiKey) {
          throw new Error('MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required');
        }

        const client = createClient({
          serviceDomain,
          apiKey,
        });

        const response = await client.get<MicroCMSResponse>({
          endpoint: 'blog',
        });

        return {
          entries: response.contents.map((post) => ({
            id: post.id,
            data: {
              title: post.title,
              createdAt: new Date(post.createdAt),
              updatedAt: new Date(post.updatedAt),
              publishedAt: new Date(post.publishedAt),
            },
          })),
          cacheHint: {
            tags: ['microcms-blog'],
          },
        };
      } catch (error) {
        console.error('microCMS fetch error:', error);
        return {
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
      }
    },
    loadEntry: async (id: string) => {
      try {
        const serviceDomain = env.MICROCMS_DOMAIN;
        const apiKey = env.MICROCMS_PRODUCTION_API_KEY;

        if (!serviceDomain || !apiKey) {
          throw new Error('MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required');
        }

        const client = createClient({
          serviceDomain,
          apiKey,
        });

        const post = await client.get<MicroCMSBlogPost>({
          endpoint: 'blog',
          contentId: id,
        });

        return {
          entry: {
            id: post.id,
            data: {
              title: post.title,
              createdAt: new Date(post.createdAt),
              updatedAt: new Date(post.updatedAt),
              publishedAt: new Date(post.publishedAt),
            },
          },
          cacheHint: {
            tags: [`microcms-blog-${id}`],
          },
        };
      } catch (error) {
        console.error('microCMS fetch error:', error);
        return {
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
      }
    },
  },
  schema: blogSchema,
});

// コレクションをエクスポート
export const collections = { liveBlog };
