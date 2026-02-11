import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { getOgImage } from '@/components/OgImage';
import {
  loadCache,
  saveCache,
  generateTitleHash,
  getCacheEntry,
  isCacheValid,
  updateCacheEntry,
} from '@/utils/ogImageCache';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_DIR = join(process.cwd(), '.astro', 'og-images');

// グローバルキャッシュ（ビルド中に1回だけロード）
let globalCache: Awaited<ReturnType<typeof loadCache>> | null = null;

export async function getStaticPaths() {
  const allPosts = await getCollection('blog');
  const recentPosts = allPosts.filter(
    (entry) => entry.data.pubDate && new Date(entry.data.pubDate) >= new Date('2024-01-01'),
  );

  // キャッシュを一度だけロード
  if (!globalCache) {
    globalCache = await loadCache();
  }

  return recentPosts.map((entry) => ({
    params: { slug: entry.slug },
    props: {
      title: entry.data.title,
      slug: entry.slug,
    },
  }));
}

export async function GET({ props: { title, slug } }: APIContext) {
  if (!globalCache) {
    globalCache = await loadCache();
  }

  const titleHash = generateTitleHash(title);
  const cacheEntry = getCacheEntry(globalCache, slug);
  const imagePath = join(CACHE_DIR, `${slug}.png`);

  // キャッシュが有効で、画像ファイルが存在する場合は再利用
  if (isCacheValid(cacheEntry, titleHash) && existsSync(imagePath)) {
    console.log(`[OG Image] Using cached image for: ${slug}`);
    const cachedImage = await readFile(imagePath);
    return new Response(cachedImage, {
      headers: {
        'content-type': 'image/png',
      },
    });
  }

  // 新規生成
  console.log(`[OG Image] Generating new image for: ${slug}`);
  const body = await getOgImage(title);

  // キャッシュディレクトリに保存
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
  await writeFile(imagePath, body);

  // キャッシュを更新して即座に保存
  globalCache = updateCacheEntry(globalCache, slug, titleHash);
  await saveCache(globalCache);

  return new Response(body, {
    headers: {
      'content-type': 'image/png',
    },
  });
}
