import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

interface CacheEntry {
  titleHash: string;
  generatedAt: string;
}

interface OgImageCache {
  [slug: string]: CacheEntry;
}

const CACHE_FILE_PATH = join(process.cwd(), '.astro', 'og-cache.json');

/**
 * タイトルからハッシュ値を生成
 */
export function generateTitleHash(title: string): string {
  return createHash('sha256').update(title, 'utf-8').digest('hex');
}

/**
 * キャッシュファイルを読み込み
 */
export async function loadCache(): Promise<OgImageCache> {
  try {
    if (!existsSync(CACHE_FILE_PATH)) {
      return {};
    }
    const content = await readFile(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(content) as OgImageCache;
  } catch (error) {
    console.warn('Failed to load OG image cache:', error);
    return {};
  }
}

/**
 * キャッシュファイルに保存
 */
export async function saveCache(cache: OgImageCache): Promise<void> {
  try {
    const cacheDir = dirname(CACHE_FILE_PATH);
    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }
    await writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save OG image cache:', error);
  }
}

/**
 * 指定されたスラッグのキャッシュエントリを取得
 */
export function getCacheEntry(cache: OgImageCache, slug: string): CacheEntry | undefined {
  return cache[slug];
}

/**
 * キャッシュが有効かどうかをチェック
 */
export function isCacheValid(cacheEntry: CacheEntry | undefined, currentTitleHash: string): boolean {
  if (!cacheEntry) {
    return false;
  }
  return cacheEntry.titleHash === currentTitleHash;
}

/**
 * キャッシュエントリを更新
 */
export function updateCacheEntry(
  cache: OgImageCache,
  slug: string,
  titleHash: string,
): OgImageCache {
  return {
    ...cache,
    [slug]: {
      titleHash,
      generatedAt: new Date().toISOString(),
    },
  };
}
