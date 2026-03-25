import '@/globals.css';

import { createShadowRootUi, defineContentScript } from '#imports';
import { PortalContainerProvider } from '@/contexts/portal-container';
import { useAppStore } from '@/store';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import {
  AI_LIST_SELECTOR,
  applyFilters,
  CLASSIC_LIST_SELECTOR,
  injectFilterStyles,
  INTEROP_IFRAME_SELECTOR,
  removeFilterStyles,
} from './dom-filter';

export function isClassicSearchPage(url: string): boolean {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/jobs/search/') ||
    pathname.startsWith('/jobs/collections/')
  );
}

export function isAiSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return (
    pathname.startsWith('/jobs/search-results/') && searchParams.has('keywords')
  );
}

export function isJobSearchPage(url: string): boolean {
  return isClassicSearchPage(url) || isAiSearchPage(url);
}

function applyPostedWithin(url: string): boolean {
  const { postedWithin } = useAppStore.getState().settings;
  if (!isClassicSearchPage(url)) return false;

  const parsed = new URL(url);
  const expected = postedWithin ? `r${postedWithin * 60}` : null;
  const current = parsed.searchParams.get('f_TPR');

  if (current === expected) return false;

  if (expected) {
    parsed.searchParams.set('f_TPR', expected);
  } else {
    parsed.searchParams.delete('f_TPR');
  }

  location.replace(parsed.href);
  return true;
}

function applyRecentSort(url: string): boolean {
  if (!useAppStore.getState().settings.defaultToRecentSort) return false;
  if (!isClassicSearchPage(url)) return false;

  const parsed = new URL(url);
  if (parsed.searchParams.has('sortBy')) return false;

  parsed.searchParams.set('sortBy', 'DD');
  location.replace(parsed.href);
  return true;
}

/** Applies URL-based filters that trigger a page reload. Returns true if a reload was initiated. */
function applyUrlModifiers(url: string): boolean {
  if (applyPostedWithin(url)) return true;
  if (applyRecentSort(url)) return true;
  return false;
}

function syncFromUrl(url: string) {
  useAppStore.getState().actions.setIsAiSearchPage(isAiSearchPage(url));

  if (!isClassicSearchPage(url)) return;

  const parsed = new URL(url);
  const fTPR = parsed.searchParams.get('f_TPR');

  if (fTPR?.startsWith('r')) {
    const seconds = Number(fTPR.slice(1));
    if (Number.isFinite(seconds) && seconds > 0) {
      useAppStore.getState().actions.setPostedWithin(Math.round(seconds / 60));
    }
  } else if (fTPR === null) {
    useAppStore.getState().actions.setPostedWithin(null);
  }
}

export default defineContentScript({
  matches: ['https://www.linkedin.com/jobs/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    if (!useAppStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsubscribe = useAppStore.persist.onFinishHydration(() => {
          unsubscribe();
          resolve();
        });
      });
    }

    // wxt:locationchange event fires before location.href updates, so the
    // store subscriber would see a stale URL and trigger an unwanted redirect
    let currentUrl = location.href;

    syncFromUrl(currentUrl);

    injectFilterStyles();

    const ui = await createShadowRootUi(ctx, {
      name: 'jobzap-ui',
      position: 'inline',
      anchor: 'body',
      isolateEvents: ['keydown', 'keyup', 'keypress', 'wheel'],
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(
          <PortalContainerProvider container={container}>
            <App />
          </PortalContainerProvider>,
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    let timeoutId: number | undefined;
    let iframeObserver: MutationObserver | null = null;
    let listObserver: MutationObserver | null = null;

    const debouncedApply = () => {
      if (!isJobSearchPage(currentUrl)) return;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = ctx.setTimeout(applyFilters, 200);
    };

    const observeJobList = () => {
      listObserver?.disconnect();
      const target =
        document.querySelector(CLASSIC_LIST_SELECTOR) ??
        document.querySelector(AI_LIST_SELECTOR) ??
        document.body;
      listObserver = new MutationObserver(debouncedApply);
      listObserver.observe(target, { childList: true, subtree: true });
    };

    // When navigating from AI search back to classic search, LinkedIn renders the classic legacy Ember search inside an interop iframe
    const observeInteropIframe = () => {
      if (iframeObserver) return;
      const iframe = document.querySelector<HTMLIFrameElement>(
        INTEROP_IFRAME_SELECTOR,
      );
      if (!iframe?.contentDocument?.body) return;

      injectFilterStyles(iframe.contentDocument);

      const iframeListTarget =
        iframe.contentDocument.querySelector(CLASSIC_LIST_SELECTOR) ??
        iframe.contentDocument.body;

      // When the iframe is present on classic search page, the main document belongs to the stale AI search shell
      listObserver?.disconnect();
      listObserver = null;

      iframeObserver = new MutationObserver(debouncedApply);
      iframeObserver.observe(iframeListTarget, {
        childList: true,
        subtree: true,
      });

      iframe.addEventListener(
        'load',
        () => {
          iframeObserver?.disconnect();
          iframeObserver = null;
          applyFilters();
          observeInteropIframe();
        },
        { once: true },
      );
    };

    const unsubscribeStore = useAppStore.subscribe((state, prevState) => {
      if (!isJobSearchPage(currentUrl)) return;

      if (
        state.settings.postedWithin !== prevState.settings.postedWithin ||
        state.settings.defaultToRecentSort !==
          prevState.settings.defaultToRecentSort
      ) {
        applyUrlModifiers(currentUrl);
        return; // page will reload
      }

      if (
        state.activeFilters !== prevState.activeFilters ||
        state.settings.blockedCompanies !==
          prevState.settings.blockedCompanies ||
        state.settings.excludedKeywords !== prevState.settings.excludedKeywords
      ) {
        applyFilters();
      }
    });

    observeJobList();

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      currentUrl = newUrl.href;
      iframeObserver?.disconnect();
      iframeObserver = null;

      if (!isJobSearchPage(currentUrl)) {
        listObserver?.disconnect();
        listObserver = null;
        ui.remove();
        return;
      }

      syncFromUrl(currentUrl);
      if (!ui.mounted) ui.mount();
      applyFilters();
      observeJobList();

      // Classic search page may render inside an iframe when navigating back from AI search
      if (isClassicSearchPage(currentUrl)) {
        observeInteropIframe();
      }
    });

    ctx.onInvalidated(() => {
      ui.remove();
      unsubscribeStore();
      listObserver?.disconnect();
      listObserver = null;
      iframeObserver?.disconnect();
      iframeObserver = null;

      removeFilterStyles(document);

      const iframeDoc = document.querySelector<HTMLIFrameElement>(
        INTEROP_IFRAME_SELECTOR,
      )?.contentDocument;
      if (iframeDoc) {
        removeFilterStyles(iframeDoc);
      }
    });

    if (isJobSearchPage(currentUrl)) {
      if (applyUrlModifiers(currentUrl)) return; // page will reload
      ui.mount();
      applyFilters();
    }
  },
});
