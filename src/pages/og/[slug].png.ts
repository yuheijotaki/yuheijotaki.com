import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { getOgImage } from '@/components/OgImage';

export async function getStaticPaths() {
  const allPosts = await getCollection('blog');
  const recentPosts = allPosts.filter(
    (entry) => entry.data.pubDate && new Date(entry.data.pubDate) >= new Date('2024-01-01'),
  );

  return recentPosts.map((entry) => ({
    params: { slug: entry.slug },
    props: { title: entry.data.title },
  }));
}

export async function GET({ props: { title } }: APIContext) {
  const body = await getOgImage(title);
  return new Response(body, {
    headers: {
      'content-type': 'image/png',
    },
  });
}
