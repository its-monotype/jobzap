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

        <Row label="Default to most recent">
          <Switch
            checked={settings.defaultToMostRecent}
            onCheckedChange={(checked) =>
              actions.updateSettings({ defaultToMostRecent: checked })
            }
          />
        </Row>

        <Row label="Promoted">
          <Switch
            checked={settings.filters.promoted}
            onCheckedChange={() => actions.toggleFilter('promoted')}
          />
        </Row>

        <Row label="Viewed">
          <Switch
            checked={settings.filters.viewed}
            onCheckedChange={() => actions.toggleFilter('viewed')}
          />
        </Row>

        <Row label="Dismissed">
          <Switch
            checked={settings.filters.dismissed}
            onCheckedChange={() => actions.toggleFilter('dismissed')}
          />
        </Row>

        <Row label="Applied">
          <Switch
            checked={settings.filters.applied}
            onCheckedChange={() => actions.toggleFilter('applied')}
          />
        </Row>

        {/* TODO: Blocked companies, excluded keywords (tags input component required) */}
      </div>
    </div>
  );
}
