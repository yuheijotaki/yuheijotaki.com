import { visit } from 'unist-util-visit';
import type { Element as HastElement, Root as HastRoot } from 'hast';

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

        const id = text;

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
