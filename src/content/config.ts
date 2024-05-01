import { z, defineCollection } from 'astro:content';
import { rssSchema } from '@astrojs/rss';

const blog = defineCollection({
  type: 'content',
  schema: rssSchema.extend({
    draft: z.optional(z.boolean()),
  }),
});

export const collections = { blog };
