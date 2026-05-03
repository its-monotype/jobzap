import { Logo } from '@/components/icons/logo';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActions, useSettings } from '@/store';
import { BlockedCompanies } from './blocked-companies';
import { ExcludedKeywords } from './excluded-keywords';
import { FilterStatus } from './filter-status';
import { PostedWithin } from './posted-within';

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm">{label}</div>
      {children}
    </div>
  );
}

export function Panel() {
  const settings = useSettings();
  const actions = useActions();

  return (
    <div className="flex max-h-[calc(100vh-140px)] w-80 flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="flex flex-col gap-2 border-b p-4">
        <div className="flex items-center gap-1.5">
          <Logo className="size-6" />
          <span className="text-lg font-semibold">JobZap</span>
        </div>
        <FilterStatus />
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <PostedWithin />

        <SettingRow label="Default to Most Recent">
          <Switch
            checked={settings.defaultToRecentSort}
            onCheckedChange={(checked) =>
              actions.setDefaultToRecentSort(checked)
            }
          />
        </SettingRow>

        <Separator />

        <SettingRow label="Promoted">
          <Switch
            checked={settings.enabledFilters.promoted}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('promoted', checked)
            }
          />
        </SettingRow>
        <SettingRow label="Viewed">
          <Switch
            checked={settings.enabledFilters.viewed}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('viewed', checked)
            }
          />
        </SettingRow>
        <SettingRow label="Dismissed">
          <Switch
            checked={settings.enabledFilters.dismissed}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('dismissed', checked)
            }
          />
        </SettingRow>
        <SettingRow label="Applied">
          <Switch
            checked={settings.enabledFilters.applied}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('applied', checked)
            }
          />
        </SettingRow>

        <Separator />

        <BlockedCompanies />
        <ExcludedKeywords />
      </div>

      <div className="flex items-center justify-center gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        <a
          href="https://github.com/its-monotype/jobzap"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          GitHub
        </a>
        <span>·</span>
        <a
          href="mailto:hello@jobzap.app"
          className="transition-colors hover:text-foreground"
        >
          Report issue
        </a>
      </div>
    </div>
  );
}
