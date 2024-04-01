// import type { APIContext } from 'astro';
// import { getCollection } from 'astro:content';
// import { getOgImage } from '@/components/OgImage';

// export async function getStaticPaths() {
//   const posts = await getCollection('blog');

//   return posts.map((entry) => ({
//     params: { slug: entry.slug },
//     props: { title: entry.data.title },
//   }));
// }

// export async function GET({ props: { title } }: APIContext) {
//   const body = await getOgImage(title);
//   return new Response(body, {
//     headers: {
//       'content-type': 'image/png',
//     },
//   });
// }
