import { browser, defineBackground } from '#imports';

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    void browser.tabs
      .sendMessage(tab.id, { type: 'TOGGLE_PANEL' })
      .catch(() => undefined);
  });
});
