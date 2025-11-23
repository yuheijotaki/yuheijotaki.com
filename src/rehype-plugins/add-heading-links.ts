import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';
import { createHash } from 'crypto';

export default function addHeadingLinks() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: HastElement) => {
      if (node.tagName.match(/^h[1-6]$/)) {
        const text = node.children
          .map((child) => {
            if (child.type === 'text') return child.value;
            return '';
          })
          .join(' ')
          .trim();

        if (!text) return;

        const id = createHash('sha256').update(text).digest('hex').substring(0, 8);

        node.properties = node.properties || {};
        node.properties.id = id;

        const linkNode: HastElement = {
          type: 'element',
          tagName: 'a',
          properties: { href: `#${id}`, className: ['heading-link'] },
          children: node.children,
        };

        node.children = [linkNode];
      }
    });
  };
}
