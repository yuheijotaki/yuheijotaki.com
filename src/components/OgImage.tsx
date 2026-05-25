import satori from 'satori';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const FONT_CACHE_PATH = join(
  process.cwd(),
  'node_modules',
  '.cache',
  'astro-og',
  'noto-sans-jp-700.ttf',
);

let fontDataPromise: Promise<ArrayBuffer> | null = null;

export async function getOgImage(title: string) {
  const fontData = await getFontData();

  const titleMaxNum = 38;
  const titleLength = title.length;

  if (titleLength >= titleMaxNum) {
    title = title.substring(0, titleMaxNum);
    title += '...';
  }

  const svg = await satori(
    <main
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        backgroundColor: '#fffcf0',
        color: '#100f0f',
        border: '#100f0f 2rem solid',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
      }}>
      <h1
        style={{
          fontSize: '5rem',
          lineHeight: '1.3em',
        }}>
        {title}
      </h1>
    </main>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Sans-serif',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

function getFontData(): Promise<ArrayBuffer> {
  if (!fontDataPromise) {
    fontDataPromise = loadFontData();
  }
  return fontDataPromise;
}

async function loadFontData(): Promise<ArrayBuffer> {
  if (existsSync(FONT_CACHE_PATH)) {
    const buf = await readFile(FONT_CACHE_PATH);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }

  const API = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700`;

  const css = await (
    await fetch(API, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    })
  ).text();

  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (!resource) {
    throw new Error('Failed to extract font URL from Google Fonts CSS response');
  }

  const fontBuffer = await fetch(resource[1]).then((res) => res.arrayBuffer());

  const cacheDir = dirname(FONT_CACHE_PATH);
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }
  await writeFile(FONT_CACHE_PATH, Buffer.from(fontBuffer));

  return fontBuffer;
}
