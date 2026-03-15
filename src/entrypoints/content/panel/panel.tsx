import { Logo } from '@/components/icons/logo';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActions, useSettings } from '@/store';
import { BlockedCompanies } from './blocked-companies';
import { ExcludedKeywords } from './excluded-keywords';
import { PostedWithin } from './posted-within';

type SettingRowProps = {
  label: string;
  children: React.ReactNode;
};

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
    <div className="w-80 rounded-lg bg-white p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Logo className="size-6" />
        <span className="text-lg font-semibold">JobZap</span>
      </div>

      <div className="mt-4 space-y-4">
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
    </div>
  );
}
