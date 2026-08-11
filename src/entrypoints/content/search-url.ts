export function isClassicSearchPage(url: string): boolean {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/jobs/search/') ||
    pathname.startsWith('/jobs/collections/')
  );
}

function isAiSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return (
    pathname.startsWith('/jobs/search-results/') && searchParams.has('keywords')
  );
}

export function isJobSearchPage(url: string): boolean {
  return isClassicSearchPage(url) || isAiSearchPage(url);
}

export function getPostedWithinFromUrl(url: string): number | null | undefined {
  if (!isJobSearchPage(url)) return undefined;

  const parsed = new URL(url);
  const fTPR = parsed.searchParams.get('f_TPR');
  if (fTPR === null) return null;
  if (!fTPR.startsWith('r')) return undefined;

  const seconds = Number(fTPR.slice(1));
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;

  return Math.round(seconds / 60);
}

export function getPostedWithinUrl(
  url: string,
  postedWithin: number | null,
): string | null {
  if (!isJobSearchPage(url)) return null;

  const parsed = new URL(url);
  const expectedFTPR = postedWithin === null ? null : `r${postedWithin * 60}`;

  if (parsed.searchParams.get('f_TPR') === expectedFTPR) return null;

  if (expectedFTPR) {
    parsed.searchParams.set('f_TPR', expectedFTPR);
  } else {
    parsed.searchParams.delete('f_TPR');
  }

  return parsed.href;
}

export function getRecentSortUrl(url: string): string | null {
  if (!isClassicSearchPage(url)) return null;

  const parsed = new URL(url);
  if (parsed.searchParams.has('sortBy')) return null;

  parsed.searchParams.set('sortBy', 'DD');
  return parsed.href;
}
