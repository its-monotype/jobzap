import type { FilterId } from '@/constants';
import { useAppStore } from '@/store';

const HIDE_CLASS = 'jz-hidden';
const STYLE_ID = 'jz-style';

// iframe LinkedIn uses to run legacy Ember search inside the React shell
export const INTEROP_IFRAME_SELECTOR = 'iframe[data-testid="interop-iframe"]';

export const CLASSIC_LIST_SELECTOR = '.scaffold-layout__list';
const CLASSIC_CARD_SELECTOR = 'li[data-occludable-job-id]';

const DISMISS_BTN = 'button[aria-label^="Dismiss "][aria-label$=" job"]';
const DISMISSED_UNDO_BTN = 'button[aria-label$=" job is dismissed, undo"]'; // present on dismissed cards of both types

export const AI_LIST_SELECTOR = '[componentkey="SearchResultsMainContent"]';
const AI_CARD_MARKER = `${DISMISS_BTN}, ${DISMISSED_UNDO_BTN}`;

function normalizeText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Queries selector and returns normalized textContent, empty string if not found. */
function getText(root: ParentNode, selector: string): string {
  return normalizeText(root.querySelector<HTMLElement>(selector)?.textContent);
}

/** Queries selector and returns normalized attribute value, empty string if not found. */
function getAttr(root: ParentNode, selector: string, attr: string): string {
  return normalizeText(
    root.querySelector<HTMLElement>(selector)?.getAttribute(attr),
  );
}

function firstText(root: HTMLElement, selectors: string[]): string {
  for (const sel of selectors) {
    const text = getText(root, sel);
    if (text) return text;
  }
  return '';
}

function extractClassicMeta(card: HTMLElement) {
  return {
    title: firstText(card, [
      '.artdeco-entity-lockup__title .visually-hidden',
      '.artdeco-entity-lockup__title strong',
    ]),
    company: firstText(card, [
      '.artdeco-entity-lockup__subtitle > span',
      '.artdeco-entity-lockup__subtitle',
    ]),
  };
}

function extractAiMeta(card: HTMLElement) {
  // classes are hashed at build time
  // aria-labels on action buttons are screen-reader requirements, stable across deploys
  const dismissLabel = getAttr(card, DISMISS_BTN, 'aria-label');
  const undoLabel = getAttr(card, DISMISSED_UNDO_BTN, 'aria-label');

  const title =
    normalizeText(
      dismissLabel.replace(/^Dismiss\s+/i, '').replace(/\s+job$/i, ''),
    ) ||
    normalizeText(undoLabel.replace(/\s+job is dismissed,\s*undo$/i, '')) ||
    getText(card, 'p'); // fallback: first <p> is always the title

  // p-tag order is consistently [title, company, location, ...footer] across all observed cards
  const paras = Array.from(card.querySelectorAll<HTMLElement>('p'))
    .map((el) => normalizeText(el.textContent))
    .filter(Boolean);

  return {
    title,
    company: paras[1] !== paras[0] ? (paras[1] ?? '') : '',
  };
}

function isClassicDismissed(card: HTMLElement): boolean {
  return (
    !!card.querySelector('.job-card-list--is-dismissed') ||
    !!card.querySelector(DISMISSED_UNDO_BTN)
  );
}

function isAiDismissed(card: HTMLElement): boolean {
  return !!card.querySelector(DISMISSED_UNDO_BTN);
}

function collectClassicCards(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(CLASSIC_CARD_SELECTOR));
}

function collectAiCards(doc: Document): HTMLElement[] {
  const list = doc.querySelector<HTMLElement>(AI_LIST_SELECTOR);
  if (!list) return [];

  return (Array.from(list.children) as HTMLElement[]).filter(
    (el) => el.tagName !== 'HR' && el.querySelector(AI_CARD_MARKER),
  );
}

function getCards(isAiSearch: boolean): HTMLElement[] {
  if (isAiSearch) return collectAiCards(document);

  // Classic search may be rendered inside an interop iframe when navigating back from the AI search shell
  const iframeDoc = document.querySelector<HTMLIFrameElement>(
    INTEROP_IFRAME_SELECTOR,
  )?.contentDocument;
  const iframeCards = iframeDoc ? collectClassicCards(iframeDoc) : [];
  if (iframeCards.length) return iframeCards;

  return collectClassicCards(document);
}

/** Hides the <hr> separator after each hidden card to avoid stacking dividers between visible cards. */
function normalizeAiHr() {
  const list = document.querySelector<HTMLElement>(AI_LIST_SELECTOR);
  if (!list) return;

  for (const el of Array.from(list.children)) {
    if (el.tagName !== 'HR') continue;
    const prev = el.previousElementSibling as HTMLElement | null;
    if (!prev) {
      el.classList.add(HIDE_CLASS);
      continue;
    }
    el.classList.toggle(HIDE_CLASS, prev.classList.contains(HIDE_CLASS));
  }
}

export function injectFilterStyles(doc: Document = document) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `.${HIDE_CLASS}{display:none!important;}`;
  (doc.head ?? doc.documentElement).appendChild(s);
}

export function removeFilterStyles(doc: Document = document) {
  doc.getElementById(STYLE_ID)?.remove();
}

export function applyFilters() {
  const {
    activeFilters,
    settings,
    actions,
    isAiSearchPage: isAiSearch,
  } = useAppStore.getState();

  const cards = getCards(isAiSearch);

  const blockedCompanies = settings.blockedCompanies.map((c) =>
    c.toLowerCase(),
  );
  const excludedKeywords = settings.excludedKeywords.map((k) =>
    k.toLowerCase(),
  );

  const counts: Partial<Record<FilterId, number>> = {};
  const visibleCompanies = new Set<string>();

  for (const el of cards) {
    const text = (el.textContent ?? '').toLowerCase();
    const meta = isAiSearch ? extractAiMeta(el) : extractClassicMeta(el);
    const title = meta.title.toLowerCase();
    const company = meta.company.toLowerCase();

    const matches = {
      promoted: activeFilters.promoted && text.includes('promoted'),
      viewed: activeFilters.viewed && text.includes('viewed'),
      applied: activeFilters.applied && text.includes('applied'),
      dismissed:
        activeFilters.dismissed &&
        (isAiSearch ? isAiDismissed(el) : isClassicDismissed(el)),
      companies:
        activeFilters.companies &&
        company.length > 0 &&
        blockedCompanies.some((b) => company.includes(b)),
      keywords:
        activeFilters.keywords &&
        title.length > 0 &&
        excludedKeywords.some((k) => title.includes(k)),
    };

    el.classList.toggle(HIDE_CLASS, Object.values(matches).some(Boolean));

    for (const [id, match] of Object.entries(matches)) {
      if (match) counts[id as FilterId] = (counts[id as FilterId] ?? 0) + 1;
    }

    if (meta.company) visibleCompanies.add(meta.company);
  }

  if (isAiSearch) normalizeAiHr();

  actions.setFilterCounts(counts);
  actions.setVisibleCompanies(Array.from(visibleCompanies).sort());

  console.log('applyFilters', { total: cards.length, ...counts });
}
