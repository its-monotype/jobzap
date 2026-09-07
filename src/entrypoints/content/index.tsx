import '@/globals.css';
import pageStyles from './page-styles.css?inline';

import {
  createShadowRootUi,
  defineContentScript,
  MatchPattern,
} from '#imports';
import { PortalContainerProvider } from '@/contexts/portal-container';
import { useSettingsStore } from '@/settings-store';
import ReactDOM from 'react-dom/client';
import { shallow } from 'zustand/vanilla/shallow';
import { App } from './app';
import { createCompanyBlockButton } from './company-block-button';
import { updateDescriptionHighlights } from './description-highlights';
import { resolveJobDetails } from './job-details';
import { applyFilters, resolveJobList } from './job-list-filter';
import { buildRecentSortUrl, isJobSearchPage } from './search-url';

const LINKEDIN_MATCH_PATTERN = 'https://www.linkedin.com/*';
const linkedinPattern = new MatchPattern(LINKEDIN_MATCH_PATTERN);

function applyDefaultSort(url: string): boolean {
  if (!useSettingsStore.getState().settings.defaultToRecentSort) return false;

  const nextUrl = buildRecentSortUrl(url);
  if (!nextUrl) return false;
  location.replace(nextUrl);
  return true;
}

export default defineContentScript({
  matches: [LINKEDIN_MATCH_PATTERN],
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

    let currentUrl = location.href;

    const unsubscribeStore = useSettingsStore.subscribe((state, prevState) => {
      if (!isJobSearchPage(currentUrl)) return;

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
      if (!linkedinPattern.includes(newUrl)) return;

      currentUrl = newUrl.href;

      if (!isJobSearchPage(currentUrl)) {
        stopObservingPage();
        panelUi.remove();
        return;
      }

      if (applyDefaultSort(currentUrl)) return; // page will reload
      if (!panelUi.mounted) panelUi.mount();
      observePage();
    });

    ctx.onInvalidated(() => {
      unsubscribeStore();
      stopObservingPage();
      pageStyle.remove();
    });

    if (isJobSearchPage(currentUrl)) {
      if (applyDefaultSort(currentUrl)) return; // page will reload
      panelUi.mount();
      observePage();
    }
  },
});
