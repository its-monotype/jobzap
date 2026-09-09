import { createIntegratedUi, type ContentScriptContext } from '#imports';
import { isCompanyBlocked, useSettingsStore } from '@/settings-store';
import type { CompanyTarget } from './job-details';

export function createCompanyBlockButton(ctx: ContentScriptContext) {
  let target: CompanyTarget | null = null;

  const updateButton = () => {
    const button = ui.mounted;
    if (!button || !target) return;
    const blocked = isCompanyBlocked(
      target.companyName,
      useSettingsStore.getState().settings.blockedCompanies,
    );
    const action = blocked ? 'Unblock' : 'Block';
    const label = action + ' company';
    if (button.textContent !== label) button.textContent = label;
    button.ariaLabel = action + ' ' + target.companyName;
  };

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!target?.anchor.isConnected) return;
    const { actions, settings } = useSettingsStore.getState();
    if (isCompanyBlocked(target.companyName, settings.blockedCompanies)) {
      actions.unblockCompany(target.companyName);
    } else {
      actions.blockCompany(target.companyName);
    }
  };

  const ui = createIntegratedUi<HTMLButtonElement>(ctx, {
    tag: 'button',
    position: 'inline',
    anchor: () => target?.anchor,
    append: 'after',
    onMount: (element) => {
      const button = element as HTMLButtonElement;
      button.type = 'button';
      button.className = 'jz-company-block-button';
      button.addEventListener('click', handleClick);
      return button;
    },
    onRemove: (button) => button?.removeEventListener('click', handleClick),
  });

  const unsubscribe = useSettingsStore.subscribe((state, previousState) => {
    if (
      state.settings.blockedCompanies !==
      previousState.settings.blockedCompanies
    ) {
      updateButton();
    }
  });
  ctx.onInvalidated(unsubscribe);

  return {
    sync(nextTarget: CompanyTarget | null) {
      if (target?.anchor !== nextTarget?.anchor || !ui.mounted?.isConnected) {
        ui.remove();
        target = nextTarget;
        if (target) ui.mount();
      } else {
        target = nextTarget;
      }
      updateButton();
    },
    remove() {
      ui.remove();
      target = null;
    },
  };
}
