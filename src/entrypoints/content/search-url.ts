export function isClassicSearchPage(url: string): boolean {
  return new URL(url).pathname.startsWith('/jobs/search/');
}

function isClassicCollectionPage(url: string): boolean {
  return new URL(url).pathname.startsWith('/jobs/collections/');
}

function isAiSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return (
    pathname.startsWith('/jobs/search-results/') && searchParams.has('keywords')
  );
}

export function isJobSearchPage(url: string): boolean {
  return (
    isClassicSearchPage(url) ||
    isAiSearchPage(url) ||
    isClassicCollectionPage(url)
  );
}

export function parsePostedWithin(url: string): number | null | undefined {
  if (!isJobSearchPage(url) || isClassicCollectionPage(url)) return undefined;

  const parsed = new URL(url);
  const fTPR = parsed.searchParams.get('f_TPR');
  if (fTPR === null) return null;
  if (!fTPR.startsWith('r')) return undefined;

  const seconds = Number(fTPR.slice(1));
  const minutes = Math.round(seconds / 60);
  if (!Number.isSafeInteger(minutes) || minutes < 1) return undefined;

  return minutes;
}

export function buildPostedWithinUrl(
  url: string,
  postedWithin: number | null,
): string | null {
  if (!isJobSearchPage(url) || isClassicCollectionPage(url)) return null;

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

export function buildRecentSortUrl(url: string): string | null {
  if (!isClassicSearchPage(url)) return null;

  const parsed = new URL(url);
  if (parsed.searchParams.has('sortBy')) return null;

  parsed.searchParams.set('sortBy', 'DD');
  return parsed.href;
}
