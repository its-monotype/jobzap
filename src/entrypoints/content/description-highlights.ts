import type { ContentScriptContext } from '#imports';
import { normalizeText } from '@/lib/utils';
import { useAppStore } from '@/store';
import { resolveJobDescription } from './job-details';

const DESCRIPTION_HIGHLIGHT = 'jobzap-description-highlight';
const TEXT_BLOCK_SELECTOR =
  'p, li, dt, dd, blockquote, pre, h1, h2, h3, h4, h5, h6, div, section, article';

function createKeywordPattern(keywords: string[]): RegExp | null {
  const patterns = Array.from(
    new Set(
      keywords
        .map(normalizeText)
        .filter(Boolean)
        .map((keyword) => keyword.toLowerCase())
        .map((keyword) =>
          keyword
            .split(' ')
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('\\s+'),
        ),
    ),
  ).sort((a, b) => b.length - a.length);

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

  const textGroups = new Map<Element, Text[]>();
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!node.textContent || !parent) return NodeFilter.FILTER_REJECT;
        if (
          parent.closest(
            'button, [role="button"], script, style, textarea, [aria-hidden="true"]',
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (!parent) continue;

    const block = parent.closest(TEXT_BLOCK_SELECTOR) ?? root;
    const group = textGroups.get(block);
    if (group) {
      group.push(textNode);
    } else {
      textGroups.set(block, [textNode]);
    }
  }

  const ranges: Range[] = [];

  for (const textNodes of textGroups.values()) {
    const segments: TextSegment[] = [];
    let text = '';

    for (const textNode of textNodes) {
      const start = text.length;
      text += textNode.data;
      segments.push({ node: textNode, start, end: text.length });
    }

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
  }

  return ranges;
}

function clearHighlights(): void {
  CSS.highlights?.delete(DESCRIPTION_HIGHLIGHT);
}

function highlightDescription(description: HTMLElement): void {
  clearHighlights();
  if (!CSS.highlights || typeof Highlight === 'undefined') return;

  const { descriptionKeywords } = useAppStore.getState().settings;
  const ranges = findKeywordRanges(description, descriptionKeywords);

  if (ranges.length > 0) {
    CSS.highlights.set(DESCRIPTION_HIGHLIGHT, new Highlight(...ranges));
  }
}

export function createDescriptionHighlights(ctx: ContentScriptContext) {
  if (!CSS.highlights || typeof Highlight === 'undefined') {
    return {
      start: () => undefined,
      stop: () => undefined,
    };
  }

  let description: HTMLElement | null = null;
  let active = false;

  function refresh(nextDescription = resolveJobDescription()) {
    description = nextDescription;

    if (nextDescription) {
      highlightDescription(nextDescription);
    } else {
      clearHighlights();
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (!active) return;

    const currentDescription = description;
    if (!currentDescription?.isConnected) {
      refresh();
      return;
    }

    if (
      mutations.some((mutation) => currentDescription.contains(mutation.target))
    ) {
      highlightDescription(currentDescription);
    }
  });

  function start(): void {
    if (active) return;

    active = true;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    refresh();
  }

  function stop(): void {
    if (!active) return;

    active = false;
    observer.disconnect();
    description = null;
    clearHighlights();
  }

  const unsubscribe = useAppStore.subscribe((state, previousState) => {
    if (!active) return;

    if (
      state.settings.descriptionKeywords !==
      previousState.settings.descriptionKeywords
    ) {
      refresh();
    }
  });

  ctx.onInvalidated(() => {
    stop();
    unsubscribe();
  });

  return { start, stop };
}
