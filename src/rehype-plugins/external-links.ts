import { visit } from 'unist-util-visit';
import feather from 'feather-icons';
import parse from 'rehype-parse';
import { unified } from 'unified';
import type { Element as HastElement, Root as HastRoot } from 'hast';

export default function externalLinks() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: HastElement) => {
      if (node.tagName === 'a' && node.properties && node.properties.href) {
        const url = node.properties.href as string;
        if (url.startsWith('http')) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';

          // アイコンを追加する
          let iconSvg = feather.icons['arrow-up-right'].toSvg();
          iconSvg = iconSvg.replace(
            '<svg ',
            '<svg role="img" aria-label="新規タブまたはウィンドウで開く" ',
          );

          const parsedSvg = unified().use(parse, { fragment: true }).parse(iconSvg);

          const iconNode = parsedSvg.children[0] as HastElement;

          node.children.push(iconNode);
        }
      }
    });
  };
}
