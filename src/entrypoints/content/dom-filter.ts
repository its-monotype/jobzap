import { FilterId } from '@/constants';
import { useAppStore } from '@/store';

const HIDE_CLASS = 'jz-hidden';
const STYLE_ID = 'jz-style';

const CLASSIC_CARD_SELECTOR = 'li[data-occludable-job-id]';
const AI_CARD_SELECTOR = '[data-view-name="job-search-job-card"]';
const AI_CARD_LIST_SELECTOR = '[componentkey="SearchResultsMainContent"]';

// iframe LinkedIn uses to run legacy Ember search inside the React shell
export const INTEROP_IFRAME_SELECTOR = 'iframe[data-testid="interop-iframe"]';

function getCardAnchors(): HTMLElement[] {
  const docs: Document[] = [document];
  const iframeDoc = document.querySelector<HTMLIFrameElement>(
    INTEROP_IFRAME_SELECTOR,
  )?.contentDocument;
  if (iframeDoc) docs.push(iframeDoc);
  return docs.flatMap((doc) =>
    Array.from(
      doc.querySelectorAll<HTMLElement>(
        `${CLASSIC_CARD_SELECTOR}, ${AI_CARD_SELECTOR}`,
      ),
    ),
  );
}

function getHideTarget(anchor: HTMLElement): HTMLElement {
  // AI Search: anchor is nested, but the visible block is its parent (non-display:contents)
  if (anchor.matches(AI_CARD_SELECTOR) && anchor.parentElement) {
    return anchor.parentElement;
  }

  // Classic Search: anchor is the visible list item already
  return anchor;
}

function normalizeAiHr() {
  const aiCard = document.querySelector(AI_CARD_SELECTOR);
  if (!aiCard) return;

  const listContainer = aiCard.closest<HTMLElement>(AI_CARD_LIST_SELECTOR);
  if (!listContainer) return;

  for (const el of Array.from(listContainer.children)) {
    if (el.tagName !== 'HR') continue;

    const prev = el.previousElementSibling as HTMLElement | null;
    if (!prev) {
      el.classList.add(HIDE_CLASS);
      continue;
    }

    const block = prev.firstElementChild as HTMLElement | null;
    const isVisible = block && !block.classList.contains(HIDE_CLASS);

    // show hr only if previous card is visible
    el.classList.toggle(HIDE_CLASS, !isVisible);
  }
}

export function injectFilterStyles(doc: Document = document) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `.${HIDE_CLASS}{display:none!important;}`;
  (doc.head ?? doc.documentElement).appendChild(s);
}

export function applyFilters() {
  const { toggledFilters, actions } = useAppStore.getState();
  const cards = getCardAnchors();

  const counts: Partial<Record<FilterId, number>> = {};
  let aiCards = 0;
  let classicCards = 0;

  for (const card of cards) {
    if (card.matches(AI_CARD_SELECTOR)) aiCards++;
    if (card.matches(CLASSIC_CARD_SELECTOR)) classicCards++;

    const text = (card.textContent || '').toLowerCase();
    const matches = {
      promoted: toggledFilters.promoted && text.includes('promoted'),
      viewed: toggledFilters.viewed && text.includes('viewed'),
      applied: toggledFilters.applied && text.includes('applied'),
      dismissed:
        toggledFilters.dismissed &&
        (!!card.querySelector('.job-card-list--is-dismissed') ||
          !!card.querySelector('[data-view-name="undo-dismiss-job"]')),
    };

    getHideTarget(card).classList.toggle(
      HIDE_CLASS,
      Object.values(matches).some(Boolean),
    );

    for (const [id, match] of Object.entries(matches)) {
      if (match) counts[id as FilterId] = (counts[id as FilterId] ?? 0) + 1;
    }
  }

  normalizeAiHr();

  actions.setFilterCounts(counts);

  log('applyFilters', {
    total: cards.length,
    aiCards,
    classicCards,
    ...counts,
  });
}
