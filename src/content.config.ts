import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: rssSchema.extend({
    title: z.string(),
    pubDate: z.coerce.date(),
    draft: z.optional(z.boolean()),
  }),
});

export const collections = { blog };
