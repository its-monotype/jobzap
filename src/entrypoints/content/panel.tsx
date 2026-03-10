import { Logo } from '@/components/icons/logo';
import { Switch } from '@/components/ui/switch';
import { useActions, useSettings } from '@/store';

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>{label}</div>
      {children}
    </div>
  );
}

export function Panel() {
  const settings = useSettings();
  const actions = useActions();

  return (
    <div className="w-96 rounded-lg bg-white p-4 shadow-lg">
      <div className="flex gap-2">
        <Logo className="size-6" />
        <span className="text-lg font-semibold">JobZap</span>
      </div>

      <div className="mt-4 space-y-4">
        {/* TODO: Posted within (input + dropdown for units + preset buttons) */}

        <Row label="Default to Most Recent">
          <Switch
            checked={settings.defaultToRecentSort}
            onCheckedChange={(checked) =>
              actions.setDefaultToRecentSort(checked)
            }
          />
        </Row>

        <Row label="Promoted">
          <Switch
            checked={settings.enabledFilters.promoted}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('promoted', checked)
            }
          />
        </Row>

        <Row label="Viewed">
          <Switch
            checked={settings.enabledFilters.viewed}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('viewed', checked)
            }
          />
        </Row>

        <Row label="Dismissed">
          <Switch
            checked={settings.enabledFilters.dismissed}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('dismissed', checked)
            }
          />
        </Row>

        <Row label="Applied">
          <Switch
            checked={settings.enabledFilters.applied}
            onCheckedChange={(checked) =>
              actions.setFilterEnabled('applied', checked)
            }
          />
        </Row>

        {/* TODO: Blocked companies, excluded keywords (tags input component required) */}
      </div>
    </div>
  );
}
