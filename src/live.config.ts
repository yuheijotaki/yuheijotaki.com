import { defineLiveCollection } from 'astro:content';
import { createClient } from 'microcms-js-sdk';
import { z } from 'astro:content';

// microCMS レスポンスの型定義
interface MicroCMSBlogPost {
  id: string;
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
  updatedAt: z.date(),
  publishedAt: z.date(),
});

// Live Content Collection の定義
const liveBlog = defineLiveCollection({
  type: 'live',
  loader: {
    name: 'microcms-blog-loader',
    loadCollection: async () => {
      try {
        // Vercel環境では process.env を直接使用
        const serviceDomain = import.meta.env.MICROCMS_DOMAIN;
        const apiKey = import.meta.env.MICROCMS_PRODUCTION_API_KEY;

        console.log('[Live Collection] loadCollection called');
        console.log('[Live Collection] serviceDomain exists:', !!serviceDomain);
        console.log('[Live Collection] apiKey exists:', !!apiKey);

        if (!serviceDomain || !apiKey) {
          const error = new Error(
            'MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required. ' +
              `serviceDomain: ${!!serviceDomain}, apiKey: ${!!apiKey}`,
          );
          console.error('[Live Collection] Environment variables missing:', error);
          return { error };
        }

        const client = createClient({
          serviceDomain,
          apiKey,
        });

        console.log('[Live Collection] Fetching from microCMS...');
        const response = await client.get<MicroCMSResponse>({
          endpoint: 'blog',
        });

        console.log('[Live Collection] Fetched entries:', response.contents.length);

        return {
          entries: response.contents.map((post) => ({
            id: post.id,
            data: {
              title: post.title,
              updatedAt: new Date(post.updatedAt),
              publishedAt: new Date(post.publishedAt),
            },
          })),
          cacheHint: {
            tags: ['microcms-blog'],
          },
        };
      } catch (error) {
        console.error('[Live Collection] microCMS fetch error:', error);
        return {
          error: error instanceof Error ? error : new Error('Unknown error'),
        };
      }
    },
    loadEntry: async (idOrFilter) => {
      try {
        // 文字列の場合とオブジェクトの場合の両方に対応
        const id =
          typeof idOrFilter === 'string' ? idOrFilter : idOrFilter?.id || idOrFilter?.filter?.id;

        console.log('[Live Collection] loadEntry called with:', idOrFilter);
        console.log('[Live Collection] Extracted id:', id);

        if (!id) {
          return {
            error: new Error('ID is required'),
          };
        }

        const serviceDomain = import.meta.env.MICROCMS_DOMAIN;
        const apiKey = import.meta.env.MICROCMS_PRODUCTION_API_KEY;

        if (!serviceDomain || !apiKey) {
          const error = new Error('MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required');
          console.error('[Live Collection] Environment variables missing:', error);
          return { error };
        }

        const client = createClient({
          serviceDomain,
          apiKey,
        });

        const post = await client.get<MicroCMSBlogPost>({
          endpoint: 'blog',
          contentId: id,
        });

        console.log('[Live Collection] Fetched entry:', post.id);

        return {
          id: post.id,
          data: {
            title: post.title,
            updatedAt: new Date(post.updatedAt),
            publishedAt: new Date(post.publishedAt),
          },
          cacheHint: {
            tags: [`microcms-blog-${id}`],
          },
        };
      } catch (error) {
        console.error('[Live Collection] microCMS fetch error:', error);
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
