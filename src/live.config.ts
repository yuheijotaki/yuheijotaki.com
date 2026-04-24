import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { createBlogClient, fetchBlogList, fetchBlogEntry } from '@/utils/microcms';

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
        const serviceDomain = import.meta.env.MICROCMS_DOMAIN;
        const apiKey = import.meta.env.MICROCMS_PRODUCTION_API_KEY;

        if (!serviceDomain || !apiKey) {
          const error = new Error(
            'MICROCMS_DOMAIN and MICROCMS_PRODUCTION_API_KEY are required. ' +
              `serviceDomain: ${!!serviceDomain}, apiKey: ${!!apiKey}`,
          );
          console.error('[Live Collection] Environment variables missing:', error);
          return { error };
        }

        const client = createBlogClient(serviceDomain, apiKey);
        const response = await fetchBlogList(client);

        return {
          entries: response.contents.map((post) => ({
            id: post.id,
            data: {
              title: post.title,
              updatedAt: new Date(post.updatedAt),
              publishedAt: new Date(post.publishedAt ?? post.createdAt),
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
        const id =
          typeof idOrFilter === 'string' ? idOrFilter : idOrFilter?.id || idOrFilter?.filter?.id;

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

        const client = createBlogClient(serviceDomain, apiKey);
        const post = await fetchBlogEntry(client, id);

        return {
          id: post.id,
          data: {
            title: post.title,
            updatedAt: new Date(post.updatedAt),
            publishedAt: new Date(post.publishedAt ?? post.createdAt),
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

export const collections = { liveBlog };
