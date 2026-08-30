import type { FilterId } from '@/constants';
import { normalizeText } from '@/lib/utils';
import { useSettingsStore } from '@/settings-store';
import { useFilterStore } from './filter-store';

const HIDE_CLASS = 'jz-hidden';

const CLASSIC_LIST_SELECTOR = '.scaffold-layout__list';
const CLASSIC_CARD_SELECTOR = 'li[data-occludable-job-id]';

const DISMISSED_UNDO_SELECTOR = 'button[aria-label$=" job is dismissed, undo"]';

const SEMANTIC_LIST_SELECTOR = '[componentkey="SearchResultsMainContent"]';
const SEMANTIC_CARD_SELECTOR = '[componentkey^="job-card-component-ref-"]';

interface JobListContext {
  layout: 'classic' | 'semantic';
  root: HTMLElement;
}

interface JobCardData {
  title: string;
  company: string;
  promoted: boolean;
  viewed: boolean;
  applied: boolean;
  dismissed: boolean;
}

export function resolveJobList(): JobListContext | null {
  const semanticRoot = document.querySelector<HTMLElement>(
    SEMANTIC_LIST_SELECTOR,
  );
  if (semanticRoot) return { layout: 'semantic', root: semanticRoot };

  const classicRoot = document.querySelector<HTMLElement>(
    CLASSIC_LIST_SELECTOR,
  );
  return classicRoot ? { layout: 'classic', root: classicRoot } : null;
}

function getText(root: ParentNode | undefined, selector: string): string {
  return normalizeText(root?.querySelector<HTMLElement>(selector)?.textContent);
}

function getMetadataFlags(elements: Iterable<Element>) {
  const values = Array.from(elements, (el) =>
    normalizeText(el.textContent).toLowerCase(),
  );

  return {
    promoted: values.includes('promoted'),
    viewed: values.includes('viewed'),
    applied: values.includes('applied'),
  };
}

function parseClassicCard(card: HTMLElement): JobCardData {
  return {
    title: getText(card, '.artdeco-entity-lockup__title [aria-hidden="true"]'),
    company: getText(card, '.artdeco-entity-lockup__subtitle'),
    ...getMetadataFlags(
      card.querySelectorAll('.job-card-container__footer-item'),
    ),
    dismissed: !!card.querySelector(
      `.job-card-list--is-dismissed, ${DISMISSED_UNDO_SELECTOR}`,
    ),
  };
}

function parseSemanticCard(card: HTMLElement): JobCardData {
  // Semantic classes are hashed, so fields are read from stable paragraph order.
  const paragraphs = card.querySelectorAll<HTMLElement>('p');
  const metadataRow = paragraphs[paragraphs.length - 1]?.parentElement;
  const metadata = metadataRow
    ? Array.from(metadataRow.children).filter((el) => el.tagName === 'P')
    : [];

  return {
    title: getText(paragraphs[0], '[aria-hidden="true"]'),
    company: normalizeText(paragraphs[1]?.textContent),
    ...getMetadataFlags(metadata),
    dismissed: !!card.querySelector(DISMISSED_UNDO_SELECTOR),
  };
}

function collectCards(context: JobListContext): HTMLElement[] {
  if (context.layout === 'semantic') {
    return (Array.from(context.root.children) as HTMLElement[]).filter((el) =>
      el.querySelector(SEMANTIC_CARD_SELECTOR),
    );
  }

  return Array.from(
    context.root.querySelectorAll<HTMLElement>(CLASSIC_CARD_SELECTOR),
  );
}

/** Hides the <hr> separator after each hidden card to avoid stacking dividers between visible cards. */
function normalizeSemanticHr(list: HTMLElement) {
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

export function applyFilters(jobList: JobListContext | null) {
  const { activeFilters, settings } = useSettingsStore.getState();

  const isSemantic = jobList?.layout === 'semantic';
  const cards = jobList ? collectCards(jobList) : [];

  const blockedCompanies = settings.blockedCompanies
    .map((company) => normalizeText(company).toLowerCase())
    .filter(Boolean);
  const excludedKeywords = settings.excludedKeywords
    .map((keyword) => normalizeText(keyword).toLowerCase())
    .filter(Boolean);

  const counts: Partial<Record<FilterId, number>> = {};
  const jobListCompanies = new Set<string>();
  let hiddenCount = 0;

  for (const card of cards) {
    const cardData = isSemantic
      ? parseSemanticCard(card)
      : parseClassicCard(card);
    const title = cardData.title.toLowerCase();
    const company = cardData.company.toLowerCase();

    const matches = {
      promoted: activeFilters.promoted && cardData.promoted,
      viewed: activeFilters.viewed && cardData.viewed,
      applied: activeFilters.applied && cardData.applied,
      dismissed: activeFilters.dismissed && cardData.dismissed,
      companies:
        activeFilters.companies &&
        company.length > 0 &&
        blockedCompanies.some((b) => company.includes(b)),
      keywords:
        activeFilters.keywords &&
        title.length > 0 &&
        excludedKeywords.some((k) => title.includes(k)),
    };

    const hidden = Object.values(matches).some(Boolean);
    card.classList.toggle(HIDE_CLASS, hidden);
    if (hidden) hiddenCount += 1;

    for (const [id, match] of Object.entries(matches)) {
      if (match) counts[id as FilterId] = (counts[id as FilterId] ?? 0) + 1;
    }

    if (cardData.company) jobListCompanies.add(cardData.company);
  }

  if (isSemantic) normalizeSemanticHr(jobList.root);

  useFilterStore.getState().setResults({
    counts,
    hiddenCount,
    jobListCompanies: Array.from(jobListCompanies).sort(),
  });

  console.log('applyFilters', {
    total: cards.length,
    hidden: hiddenCount,
    ...counts,
  });
}
