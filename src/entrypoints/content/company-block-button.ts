import { createIntegratedUi, type ContentScriptContext } from '#imports';
import { isCompanyBlocked, useSettingsStore } from '@/settings-store';
import { COMPANY_ANCHOR_SELECTOR, resolveCompanyTarget } from './job-details';

const BUTTON_CLASS = 'jz-company-block-button';

function updateButton(button: HTMLButtonElement): void {
  const target = resolveCompanyTarget();
  if (!target) return;

  const { blockedCompanies } = useSettingsStore.getState().settings;
  const blocked = isCompanyBlocked(target.companyName, blockedCompanies);
  const label = blocked ? 'Unblock company' : 'Block company';

  if (button.textContent !== label) button.textContent = label;
  button.ariaLabel = `${blocked ? 'Unblock' : 'Block'} ${target.companyName}`;
}

function handleClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();

  const target = resolveCompanyTarget();
  if (!target) return;

  const { actions, settings } = useSettingsStore.getState();
  if (isCompanyBlocked(target.companyName, settings.blockedCompanies)) {
    actions.unblockCompany(target.companyName);
  } else {
    actions.blockCompany(target.companyName);
  }
}

export function createCompanyBlockButton(ctx: ContentScriptContext) {
  const ui = createIntegratedUi<HTMLButtonElement>(ctx, {
    tag: 'button',
    position: 'inline',
    anchor: COMPANY_ANCHOR_SELECTOR,
    append: 'after',
    onMount: (element) => {
      const button = element as HTMLButtonElement;
      button.type = 'button';
      button.className = BUTTON_CLASS;
      button.textContent = 'Block company';

      button.addEventListener('click', handleClick);
      updateButton(button);
      return button;
    },
    onRemove: (button) => {
      button?.removeEventListener('click', handleClick);
    },
  });

  const unsubscribe = useSettingsStore.subscribe((state, previousState) => {
    if (
      ui.mounted &&
      state.settings.blockedCompanies !==
        previousState.settings.blockedCompanies
    ) {
      updateButton(ui.mounted);
    }
  });

  ctx.onInvalidated(unsubscribe);

  return ui;
}
