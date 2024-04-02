import satori from 'satori';
import sharp from 'sharp';
import { SITE_TITLE } from '@/consts';

export async function getOgImage(title: string) {
  const fontData = (await getFontData()) as ArrayBuffer;

  const titleMaxNum = 50;
  const titleLength = title.length;

  if (titleLength >= titleMaxNum) {
    title = title.substring(0, titleMaxNum);
    title += '...';
  }

  const svg = await satori(
    <main
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '20px 40px',
        backgroundColor: '#fffcf0',
        color: '#100f0f',
      }}>
      <section
        style={{
          width: '100%',
          height: '100%',
        }}>
        <h1
          style={{
            fontSize: '80px',
            lineHeight: '1.3em',
          }}>
          {title}
        </h1>
        <p
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            fontSize: '40px',
          }}>
          {SITE_TITLE}
        </p>
      </section>
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

async function getFontData() {
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

  if (!resource) return;

  return await fetch(resource[1]).then((res) => res.arrayBuffer());
}