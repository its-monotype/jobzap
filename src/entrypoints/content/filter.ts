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

function shouldHide(anchor: HTMLElement) {
  const text = (anchor.textContent || '').toLowerCase();

  const hideViewed = text.includes('viewed');
  const hideApplied = text.includes('applied');
  const hideDismissed =
    !!anchor.querySelector('.job-card-list--is-dismissed') || // Classic
    !!anchor.querySelector('[data-view-name="undo-dismiss-job"]'); // AI

  return {
    hide: hideViewed || hideApplied || hideDismissed,
    hideViewed,
    hideApplied,
    hideDismissed,
  };
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
  log('applying filters');

  const cardAnchors = getCardAnchors();

  let aiCardCount = 0;
  let classicCardCount = 0;
  let hiddenViewed = 0;
  let hiddenApplied = 0;
  let hiddenDismissed = 0;

  for (const anchor of cardAnchors) {
    if (anchor.matches(AI_CARD_SELECTOR)) aiCardCount++;
    if (anchor.matches(CLASSIC_CARD_SELECTOR)) classicCardCount++;

    const decision = shouldHide(anchor);
    const hideTarget = getHideTarget(anchor);
    hideTarget.classList.toggle(HIDE_CLASS, decision.hide);

    if (decision.hideViewed) hiddenViewed++;
    if (decision.hideApplied) hiddenApplied++;
    if (decision.hideDismissed) hiddenDismissed++;
  }

  normalizeAiHr();

  log('applyFilters', {
    total: cardAnchors.length,
    aiCardCount,
    classicCardCount,
    hiddenViewed,
    hiddenApplied,
    hiddenDismissed,
  });
}
