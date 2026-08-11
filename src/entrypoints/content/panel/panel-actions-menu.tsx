import { Button } from '@/components/ui/button';
import { usePortalContainer } from '@/contexts/portal-container';
import {
  createSettingsBackup,
  InvalidSettingsBackupError,
  parseSettingsBackup,
} from '@/settings-backup';
import { useSettingsStore } from '@/settings-store';
import { Menu } from '@base-ui/react/menu';
import { DownloadIcon, EllipsisIcon, UploadIcon } from 'lucide-react';
import { useRef } from 'react';

const MAX_BACKUP_FILE_SIZE = 1_000_000;

function getErrorMessage(error: unknown): string {
  if (error instanceof InvalidSettingsBackupError) return error.message;
  return 'JobZap could not import that file.';
}

function MenuItem(props: Menu.Item.Props) {
  return (
    <Menu.Item
      {...props}
      className="flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
    />
  );
}

export function PanelActionsMenu() {
  const inputRef = useRef<HTMLInputElement>(null);
  const portalContainer = usePortalContainer();

  function handleExport() {
    try {
      const { settings, activeFilters } = useSettingsStore.getState();
      const backup = createSettingsBackup({ settings, activeFilters });
      const contents = `${JSON.stringify(backup, null, 2)}\n`;
      const url = URL.createObjectURL(
        new Blob([contents], { type: 'application/json' }),
      );
      const link = document.createElement('a');

      link.href = url;
      link.download = `jobzap-settings-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      window.alert('JobZap could not export your settings.');
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (file.size > MAX_BACKUP_FILE_SIZE) {
      window.alert('That file is too large. Choose a file up to 1 MB.');
      return;
    }

    try {
      const nextState = parseSettingsBackup(await file.text());
      const shouldImport = window.confirm(
        `Import JobZap settings from “${file.name}”?\n\nThis will replace your current settings.`,
      );

      if (shouldImport) useSettingsStore.setState(nextState);
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="More actions"
            />
          }
        >
          <EllipsisIcon aria-hidden />
        </Menu.Trigger>

        <Menu.Portal container={portalContainer}>
          <Menu.Positioner
            side="bottom"
            align="end"
            sideOffset={4}
            collisionPadding={8}
            className="z-50 outline-none"
          >
            <Menu.Popup className="w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none">
              <MenuItem onClick={handleExport}>
                <DownloadIcon className="size-4" aria-hidden />
                Export settings
              </MenuItem>
              <MenuItem onClick={() => inputRef.current?.click()}>
                <UploadIcon className="size-4" aria-hidden />
                Import settings
              </MenuItem>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => void handleImport(event)}
      />
    </>
  );
}
