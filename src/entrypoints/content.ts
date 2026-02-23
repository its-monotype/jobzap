const HIDE_CLASS = 'ljf-hidden';
const STYLE_ID = 'ljf-style';
const BADGE_ID = 'ljf-badge';

const CLASSIC_CARD_SELECTOR = 'li[data-occludable-job-id]';
const AI_CARD_SELECTOR = '[data-view-name="job-search-job-card"]';
const AI_CARD_LIST_SELECTOR = '[componentkey="SearchResultsMainContent"]';

// iframe LinkedIn uses to run legacy Ember search inside the React shell
const INTEROP_IFRAME_SELECTOR = 'iframe[data-testid="interop-iframe"]';

const log = (...args: unknown[]) => console.log('[LJF]', ...args);

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

function injectHideStyle(doc: Document = document) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `.${HIDE_CLASS}{display:none!important;}`;
  (doc.head ?? doc.documentElement).appendChild(s);
}

function ensureBadge(): HTMLElement {
  let badge = document.getElementById(BADGE_ID);
  if (badge) return badge;

  badge = document.createElement('div');
  badge.id = BADGE_ID;
  badge.style.cssText =
    'position:fixed;z-index:2147483647;bottom:12px;right:12px;padding:6px 10px;border-radius:10px;background:#111;color:#fff;font:12px/1.2 system-ui;box-shadow:0 6px 24px rgba(0,0,0,.25)';
  badge.textContent = 'LJF: scanning…';
  document.documentElement.appendChild(badge);

  return badge;
}

function shouldProcessJobsPage(): boolean {
  const p = location.pathname;

  if (!p.startsWith('/jobs/')) return false;

  if (p.startsWith('/jobs/search-results')) {
    return new URLSearchParams(location.search).has('keywords');
  }

  return p.startsWith('/jobs/search') || p.startsWith('/jobs/collections');
}

function apply() {
  log('applying');
  if (!shouldProcessJobsPage()) return;

  const badge = ensureBadge();
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

  badge.textContent =
    `LJF: cards=${cardAnchors.length} ai=${aiCardCount} classic=${classicCardCount} ` +
    `viewed=${hiddenViewed} applied=${hiddenApplied} dismissed=${hiddenDismissed}`;

  log('apply', {
    total: cardAnchors.length,
    aiCardCount,
    classicCardCount,
    hiddenViewed,
    hiddenApplied,
    hiddenDismissed,
  });
}

export default defineContentScript({
  matches: ['https://www.linkedin.com/jobs/*'],
  runAt: 'document_idle',
  main(ctx) {
    injectHideStyle();
    apply();

    let timeoutId: number | undefined;
    let iframeObserver: MutationObserver | null = null;

    const debouncedApply = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = ctx.setTimeout(apply, 200);
    };

    const attachInteropIframeObserver = () => {
      if (iframeObserver) return;
      const iframe = document.querySelector<HTMLIFrameElement>(
        INTEROP_IFRAME_SELECTOR,
      );
      if (!iframe?.contentDocument?.body) return;

      injectHideStyle(iframe.contentDocument);

      iframeObserver = new MutationObserver(debouncedApply);
      iframeObserver.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true,
      });

      iframe.addEventListener(
        'load',
        () => {
          iframeObserver?.disconnect();
          iframeObserver = null;
          apply();
          attachInteropIframeObserver();
        },
        { once: true },
      );
    };

    const observer = new MutationObserver(debouncedApply);
    observer.observe(document.body, { childList: true, subtree: true });

    ctx.addEventListener(window, 'wxt:locationchange', () => {
      iframeObserver?.disconnect();
      iframeObserver = null;
      apply();
      ctx.setTimeout(apply, 250);

      // TEMPORARY: LinkedIn renders legacy Ember search in an iframe when navigating back from AI search, instead of a full reload.
      if (
        location.pathname.startsWith('/jobs/search') &&
        !location.pathname.startsWith('/jobs/search-results')
      ) {
        ctx.setTimeout(attachInteropIframeObserver, 250);
      }
    });

    log('content script running', location.href);
  },
});
