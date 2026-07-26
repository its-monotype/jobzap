import { normalizeText } from '@/lib/utils';

const CLASSIC_DETAILS_SELECTOR = '.jobs-search__job-details--container';
const CLASSIC_COMPANY_SELECTOR =
  '.job-details-jobs-unified-top-card__company-name';
// Semantic layout classes are generated; this screen identifier provides a stable details-pane boundary.
const SEMANTIC_DETAILS_SELECTOR =
  '[data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.SemanticJobDetails"]';
const SEMANTIC_COMPANY_SELECTOR = '[aria-label^="Company,"]';
const SEMANTIC_COMPANY_ANCHOR_SELECTOR = `${SEMANTIC_DETAILS_SELECTOR} a[href*="/company/"]:has(${SEMANTIC_COMPANY_SELECTOR})`;

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

  const companyLabel = context.root.querySelector<HTMLElement>(
    SEMANTIC_COMPANY_SELECTOR,
  );
  const companyNameLink = companyLabel?.querySelector<HTMLElement>(
    'a[href*="/company/"]',
  );
  // The inner name link can render first. Wait for the outer link so the
  // button never mounts inside navigation.
  const anchor =
    companyLabel?.closest<HTMLElement>('a[href*="/company/"]') ?? null;
  const companyName = normalizeText(companyNameLink?.textContent);

  return anchor && companyName ? { companyName, anchor } : null;
}
