import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeStringify from 'rehype-stringify';

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Minden táblázatot vízszintesen görgethető wrapperbe tesz (mobil). */
function rehypeTablaWrap() {
  const wrap = (node: HastNode) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      // A GFM task list checkboxai csak megjelenítésre szolgálnak; akadálymentes felirat nélkül a Lighthouse hibát jelez.
      if (child.type === 'element' && child.tagName === 'input' && child.properties?.type === 'checkbox') {
        child.properties.ariaLabel = child.properties.checked ? 'kipipálva' : 'nincs kipipálva';
      }
      if (child.type === 'element' && child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['tabla-wrap'] },
          children: [child],
        };
      }
      wrap(child);
      return child;
    });
  };
  return (tree: HastNode) => wrap(tree);
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
  .use(rehypeTablaWrap)
  .use(rehypeStringify);

/** Markdown → HTML (GFM táblák, task listák; a linkek új lapon nyílnak). */
export function renderMarkdown(md: string): string {
  return String(processor.processSync(md));
}

/** Egysoros markdown → HTML, a körülvevő <p> nélkül. */
export function renderInline(md: string): string {
  return renderMarkdown(md)
    .trim()
    .replace(/^<p>([\s\S]*)<\/p>$/, '$1');
}
