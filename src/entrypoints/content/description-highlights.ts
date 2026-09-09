import { normalizeText } from '@/lib/utils';
import { useSettingsStore } from '@/settings-store';

const DESCRIPTION_HIGHLIGHT = 'jobzap-description-highlight';
const TEXT_BLOCK_SELECTOR =
  'p, li, dt, dd, blockquote, pre, h1, h2, h3, h4, h5, h6, div, section, article';

function createKeywordPattern(keywords: string[]): RegExp | null {
  const uniquePatterns = new Set<string>();
  for (const value of keywords) {
    const keyword = normalizeText(value).toLowerCase();
    if (!keyword) continue;

    const pattern = keyword
      .split(' ')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+');
    uniquePatterns.add(pattern);
  }
  const patterns = Array.from(uniquePatterns).sort(
    (a, b) => b.length - a.length,
  );

  return patterns.length > 0 ? new RegExp(patterns.join('|'), 'giu') : null;
}

interface TextSegment {
  node: Text;
  start: number;
  end: number;
}

function findKeywordRanges(root: HTMLElement, keywords: string[]): Range[] {
  const pattern = createKeywordPattern(keywords);
  if (!pattern) return [];

  const ranges: Range[] = [];
  let segments: TextSegment[] = [];
  let text = '';

  const flush = () => {
    pattern.lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue;

      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      const startSegment = segments.find(
        (segment) => matchStart >= segment.start && matchStart < segment.end,
      );
      const endSegment = segments.find(
        (segment) => matchEnd > segment.start && matchEnd <= segment.end,
      );
      if (!startSegment || !endSegment) continue;

      const range = root.ownerDocument.createRange();
      range.setStart(startSegment.node, matchStart - startSegment.start);
      range.setEnd(endSegment.node, matchEnd - endSegment.start);
      ranges.push(range);
    }
    segments = [];
    text = '';
  };

  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const start = text.length;
      text += textNode.data;
      segments.push({ node: textNode, start, end: text.length });
      return;
    }
    if (!(node instanceof Element)) return;
    if (
      node.matches(
        'button, [role="button"], script, style, textarea, [aria-hidden="true"]',
      )
    ) {
      flush();
      return;
    }
    if (node.tagName === 'BR') {
      text += '\n';
      return;
    }

    const isBlock = node.matches(TEXT_BLOCK_SELECTOR);
    if (isBlock) flush();
    for (const child of node.childNodes) visit(child);
    if (isBlock) flush();
  };

  visit(root);
  flush();
  return ranges;
}

function clearHighlights(): void {
  CSS.highlights?.delete(DESCRIPTION_HIGHLIGHT);
}

export function updateDescriptionHighlights(
  description: HTMLElement | null,
): void {
  clearHighlights();
  if (!description || !CSS.highlights || typeof Highlight === 'undefined') {
    return;
  }

  const { descriptionKeywords } = useSettingsStore.getState().settings;
  const ranges = findKeywordRanges(description, descriptionKeywords);

  if (ranges.length > 0) {
    CSS.highlights.set(DESCRIPTION_HIGHLIGHT, new Highlight(...ranges));
  }
}
