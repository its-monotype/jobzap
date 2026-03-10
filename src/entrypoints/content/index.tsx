import { useAppStore } from '@/store';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import {
  applyFilters,
  injectFilterStyles,
  INTEROP_IFRAME_SELECTOR,
} from './dom-filter';

function isJobSearchPage(url: string): boolean {
  const { pathname, searchParams } = new URL(url);

  if (pathname.startsWith('/jobs/search-results')) {
    return searchParams.has('keywords');
  }

  return (
    pathname.startsWith('/jobs/search') ||
    pathname.startsWith('/jobs/collections')
  );
}

export default defineContentScript({
  matches: ['https://www.linkedin.com/jobs/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    log('content script running', location.href);

    injectFilterStyles();

    const ui = await createShadowRootUi(ctx, {
      name: 'jobzap-ui',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    let timeoutId: number | undefined;
    let iframeObserver: MutationObserver | null = null;

    const debouncedApply = () => {
      if (!isJobSearchPage(location.href)) return;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = ctx.setTimeout(applyFilters, 200);
    };

    const observeInteropIframe = () => {
      if (iframeObserver) return;
      const iframe = document.querySelector<HTMLIFrameElement>(
        INTEROP_IFRAME_SELECTOR,
      );
      if (!iframe?.contentDocument?.body) return;

      injectFilterStyles(iframe.contentDocument);

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
          applyFilters();
          observeInteropIframe();
        },
        { once: true },
      );
    };

    const unsubscribeStore = useAppStore.subscribe((state, prevState) => {
      if (state.toggledFilters !== prevState.toggledFilters) {
        if (isJobSearchPage(location.href)) applyFilters();
      }
    });

    const bodyObserver = new MutationObserver(debouncedApply);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
      iframeObserver?.disconnect();
      iframeObserver = null;

      if (!isJobSearchPage(newUrl.href)) {
        ui.remove();
        return;
      }

      ui.mount();
      applyFilters();

      // TEMPORARY: LinkedIn renders legacy Ember search in an iframe when
      // navigating back from AI search, instead of a full reload.
      if (
        newUrl.pathname.startsWith('/jobs/search') &&
        !newUrl.pathname.startsWith('/jobs/search-results')
      ) {
        ctx.setTimeout(observeInteropIframe, 250);
      }
    });

    ctx.onInvalidated(() => {
      unsubscribeStore();
      bodyObserver.disconnect();
      iframeObserver?.disconnect();
    });

    if (isJobSearchPage(location.href)) {
      ui.mount();
      applyFilters();
    }
  },
});
