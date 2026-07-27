import '@/globals.css';
import pageStyles from './page-styles.css?inline';

import { createShadowRootUi, defineContentScript } from '#imports';
import { PortalContainerProvider } from '@/contexts/portal-container';
import { useSettingsStore } from '@/settings-store';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import { createCompanyBlockButton } from './company-block-button';
import { createDescriptionHighlights } from './description-highlights';
import { applyFilters, resolveJobList } from './job-list-filter';

export function isClassicSearchPage(url: string): boolean {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/jobs/search/') ||
    pathname.startsWith('/jobs/collections/')
  );
}

export function isSemanticSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return (
    pathname.startsWith('/jobs/search-results/') && searchParams.has('keywords')
  );
}

export function isJobSearchPage(url: string): boolean {
  return isClassicSearchPage(url) || isSemanticSearchPage(url);
}

function applyPostedWithin(url: string): boolean {
  const { postedWithin } = useSettingsStore.getState().settings;
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
  if (!useSettingsStore.getState().settings.defaultToRecentSort) return false;
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

function syncClassicSettingsFromUrl(url: string) {
  if (!isClassicSearchPage(url)) return;

  const parsed = new URL(url);
  const fTPR = parsed.searchParams.get('f_TPR');

  if (fTPR?.startsWith('r')) {
    const seconds = Number(fTPR.slice(1));
    if (Number.isFinite(seconds) && seconds > 0) {
      useSettingsStore
        .getState()
        .actions.setPostedWithin(Math.round(seconds / 60));
    }
  } else if (fTPR === null) {
    useSettingsStore.getState().actions.setPostedWithin(null);
  }
}

export default defineContentScript({
  matches: ['https://www.linkedin.com/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    if (!useSettingsStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsubscribe = useSettingsStore.persist.onFinishHydration(() => {
          unsubscribe();
          resolve();
        });
      });
    }

    // wxt:locationchange event fires before location.href updates, so the
    // store subscriber would see a stale URL and trigger an unwanted redirect
    let currentUrl = location.href;

    syncClassicSettingsFromUrl(currentUrl);

    const pageStyle = document.createElement('style');
    pageStyle.id = 'jz-style';
    pageStyle.textContent = pageStyles;
    document.getElementById(pageStyle.id)?.remove();
    (document.head ?? document.documentElement).append(pageStyle);

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

    const companyBlockButton = createCompanyBlockButton(ctx);
    companyBlockButton.autoMount();

    const descriptionHighlights = createDescriptionHighlights(ctx);

    let listObserver: MutationObserver | null = null;

    const observeJobList = () => {
      listObserver?.disconnect();
      const jobList = resolveJobList()?.root;

      if (!jobList) {
        listObserver = null;
        return;
      }

      listObserver = new MutationObserver(() => applyFilters());
      listObserver.observe(jobList, {
        childList: true,
        subtree: true,
      });
    };

    const unsubscribeStore = useSettingsStore.subscribe((state, prevState) => {
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

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      currentUrl = newUrl.href;

      if (!isJobSearchPage(currentUrl)) {
        listObserver?.disconnect();
        listObserver = null;
        descriptionHighlights.stop();
        ui.remove();
        return;
      }

      syncClassicSettingsFromUrl(currentUrl);
      if (applyUrlModifiers(currentUrl)) return; // page will reload
      if (!ui.mounted) ui.mount();
      descriptionHighlights.start();
      applyFilters();
      observeJobList();
    });

    ctx.onInvalidated(() => {
      companyBlockButton.remove();
      unsubscribeStore();
      listObserver?.disconnect();
      listObserver = null;
      pageStyle.remove();
    });

    if (isJobSearchPage(currentUrl)) {
      if (applyUrlModifiers(currentUrl)) return; // page will reload
      ui.mount();
      descriptionHighlights.start();
      applyFilters();
      observeJobList();
    }
  },
});
