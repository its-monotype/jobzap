import '@/globals.css';
import pageStyles from './page-styles.css?inline';

import { createShadowRootUi, defineContentScript } from '#imports';
import { PortalContainerProvider } from '@/contexts/portal-container';
import { useSettingsStore } from '@/settings-store';
import ReactDOM from 'react-dom/client';
import { shallow } from 'zustand/vanilla/shallow';
import { App } from './app';
import { createCompanyBlockButton } from './company-block-button';
import { updateDescriptionHighlights } from './description-highlights';
import { resolveJobDetails } from './job-details';
import { applyFilters, resolveJobList } from './job-list-filter';

function isClassicSearchPage(url: string): boolean {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/jobs/search/') ||
    pathname.startsWith('/jobs/collections/')
  );
}

function isSemanticSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return (
    pathname.startsWith('/jobs/search-results/') && searchParams.has('keywords')
  );
}

function isJobSearchPage(url: string): boolean {
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
  const { actions, settings } = useSettingsStore.getState();

  if (fTPR?.startsWith('r')) {
    const seconds = Number(fTPR.slice(1));
    if (!Number.isFinite(seconds) || seconds <= 0) return;

    const postedWithin = Math.round(seconds / 60);
    if (settings.postedWithin !== postedWithin) {
      actions.setPostedWithin(postedWithin);
    }
  } else if (fTPR === null && settings.postedWithin !== null) {
    actions.setPostedWithin(null);
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

    const panelUi = await createShadowRootUi(ctx, {
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

    let jobListRoot: HTMLElement | null = null;
    let jobDescription: HTMLElement | null = null;

    const syncJobList = () => {
      const jobList = resolveJobList();
      jobListRoot = jobList?.root ?? null;
      applyFilters(jobList);
    };

    const syncDescriptionHighlights = () => {
      jobDescription = resolveJobDetails()?.description ?? null;
      updateDescriptionHighlights(jobDescription);
    };

    const pageObserver = new MutationObserver((mutations) => {
      const currentJobListRoot = jobListRoot;
      const shouldSyncJobList =
        !currentJobListRoot?.isConnected ||
        mutations.some((mutation) =>
          currentJobListRoot.contains(mutation.target),
        );

      const currentJobDescription = jobDescription;
      const shouldSyncDescription =
        !currentJobDescription?.isConnected ||
        mutations.some((mutation) =>
          currentJobDescription.contains(mutation.target),
        );

      if (shouldSyncJobList) {
        syncJobList();
      }

      if (shouldSyncDescription) {
        syncDescriptionHighlights();
      }
    });

    const observePage = () => {
      pageObserver.disconnect();
      pageObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      syncJobList();
      syncDescriptionHighlights();
    };

    const stopObservingPage = () => {
      pageObserver.disconnect();
      jobListRoot = null;
      jobDescription = null;
      updateDescriptionHighlights(null);
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
        !shallow(
          state.settings.descriptionKeywords,
          prevState.settings.descriptionKeywords,
        )
      ) {
        syncDescriptionHighlights();
      }

      if (
        !shallow(state.activeFilters, prevState.activeFilters) ||
        !shallow(
          state.settings.blockedCompanies,
          prevState.settings.blockedCompanies,
        ) ||
        !shallow(
          state.settings.excludedKeywords,
          prevState.settings.excludedKeywords,
        )
      ) {
        syncJobList();
      }
    });

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      currentUrl = newUrl.href;

      if (!isJobSearchPage(currentUrl)) {
        stopObservingPage();
        panelUi.remove();
        return;
      }

      syncClassicSettingsFromUrl(currentUrl);
      if (applyUrlModifiers(currentUrl)) return; // page will reload
      if (!panelUi.mounted) panelUi.mount();
      observePage();
    });

    ctx.onInvalidated(() => {
      unsubscribeStore();
      stopObservingPage();
      pageStyle.remove();
    });

    if (isJobSearchPage(currentUrl)) {
      if (applyUrlModifiers(currentUrl)) return; // page will reload
      panelUi.mount();
      observePage();
    }
  },
});
