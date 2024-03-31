import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/consts';
const parser = new MarkdownIt();

export async function GET(context) {
  const blog = await getCollection('blog');
  return rss({
    // 出力されるXMLの`<title>`フィールド
    title: SITE_TITLE,
    // 出力されるXMLの`<description>`フィールド
    description: SITE_DESCRIPTION,
    // エンドポイントのコンテキストからプロジェクトの"site"を取得
    // https://docs.astro.build/ja/reference/api-reference/#contextsite
    site: context.site,
    // 出力されるXMLの<item>の
    // コンテンツコレクションやglobインポートを利用した例については「`items`の生成」セクションをご覧ください
    items: blog.map((post) => ({
      // title: post.data.title,
      // pubDate: post.data.pubDate,
      // description: post.data.description,
      // customData: post.data.customData,
      // 記事の`slug`からRSSリンクを生成
      // この例では、すべての記事が`/blog/[slug]`ルートでレンダリングされていると仮定しています
      link: `/blog/${post.slug}/`,
      content: sanitizeHtml(parser.render(post.body)),
      ...post.data,
    })),
    // (任意) カスタムXMLを挿入
    // customData: `<language>en-us</language>`,
  });
}
