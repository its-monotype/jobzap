import { normalizeText } from '@/lib/utils';

const CLASSIC_DETAILS_SELECTOR = '.jobs-search__job-details--container';
const CLASSIC_COMPANY_SELECTOR =
  '.job-details-jobs-unified-top-card__company-name';
// Semantic layout classes are generated; this screen identifier provides a stable details-pane boundary.
const SEMANTIC_DETAILS_SELECTOR =
  '[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]';
const SEMANTIC_COMPANY_SELECTOR = '[aria-label^="Company,"]';
const SEMANTIC_COMPANY_ANCHOR_SELECTOR = `${SEMANTIC_DETAILS_SELECTOR} a[href*="/company/"]:has(${SEMANTIC_COMPANY_SELECTOR})`;
const CLASSIC_DESCRIPTION_SELECTOR =
  '#job-details, .jobs-description-content__text';
const SEMANTIC_DESCRIPTION_SELECTOR = '[id^="JobDetails_AboutTheJob_"]';

export const COMPANY_ANCHOR_SELECTOR = `${CLASSIC_COMPANY_SELECTOR}, ${SEMANTIC_COMPANY_ANCHOR_SELECTOR}`;

export interface JobDetailsContext {
  layout: 'classic' | 'semantic';
  root: HTMLElement;
}

export interface CompanyTarget {
  companyName: string;
  anchor: HTMLElement;
}

export function resolveJobDetails(): JobDetailsContext | null {
  const semanticRoot = document.querySelector<HTMLElement>(
    SEMANTIC_DETAILS_SELECTOR,
  );
  if (semanticRoot) return { layout: 'semantic', root: semanticRoot };

  const classicRoot = document.querySelector<HTMLElement>(
    CLASSIC_DETAILS_SELECTOR,
  );
  return classicRoot ? { layout: 'classic', root: classicRoot } : null;
}

export function findCompanyTarget(
  context: JobDetailsContext,
): CompanyTarget | null {
  if (context.layout === 'classic') {
    const anchor = context.root.querySelector<HTMLElement>(
      CLASSIC_COMPANY_SELECTOR,
    );
    const companyName = normalizeText(anchor?.textContent);

    return anchor && companyName ? { companyName, anchor } : null;
  }

  const companyElement = context.root.querySelector<HTMLElement>(
    SEMANTIC_COMPANY_SELECTOR,
  );
  // LinkedIn nests the visible company link inside a larger navigation link.
  const anchor =
    companyElement?.closest<HTMLElement>('a[href*="/company/"]') ?? null;
  const companyName = normalizeText(companyElement?.textContent);

  return anchor && companyName ? { companyName, anchor } : null;
}

export function resolveJobDescription(): HTMLElement | null {
  const context = resolveJobDetails();
  if (!context) return null;

  const selector =
    context.layout === 'classic'
      ? CLASSIC_DESCRIPTION_SELECTOR
      : SEMANTIC_DESCRIPTION_SELECTOR;

  return context.root.querySelector<HTMLElement>(selector);
}
