import { Logo } from '@/components/icons/logo';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActions, useSettings } from '@/settings-store';
import { BlockedCompanies } from './blocked-companies';
import { DescriptionHighlights } from './description-highlights';
import { ExcludedKeywords } from './excluded-keywords';
import { FilterStatus } from './filter-status';
import { usePageStore } from '../page-store';
import {
  buildRecentSortUrl,
  buildPostedWithinUrl,
  isClassicSearchPage,
  parsePostedWithin,
  supportsPostedWithin,
} from '../search-url';
import { PostedWithin } from './posted-within';
import { PanelActionsMenu } from './panel-actions-menu';

export function Panel() {
  const url = usePageStore((state) => state.url);
  const settings = useSettings();
  const actions = useActions();
  const postedWithinSupported = supportsPostedWithin(url);
  const recentSortSupported = isClassicSearchPage(url);
  const postedWithin = parsePostedWithin(url) ?? null;

  function handleDefaultSortChange(checked: boolean) {
    actions.setDefaultToRecentSort(checked);
    if (!checked) return;

    const nextUrl = buildRecentSortUrl(location.href);
    if (nextUrl) location.replace(nextUrl);
  }

  function handlePostedWithinApply(value: number | null) {
    const nextUrl = buildPostedWithinUrl(location.href, value);
    if (nextUrl) location.replace(nextUrl);
  }

  return (
    <div className="flex max-h-[calc(100vh-140px)] w-80 flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="flex flex-col gap-2 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Logo className="size-6" />
            <span className="text-lg font-semibold">JobZap</span>
          </div>
          <PanelActionsMenu />
        </div>
        <FilterStatus />
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        {postedWithinSupported && (
          <PostedWithin
            key={postedWithin}
            postedWithin={postedWithin}
            onApply={handlePostedWithinApply}
          />
        )}

        {recentSortSupported && (
          <SettingRow label="Default to most recent">
            <Switch
              checked={settings.defaultToRecentSort}
              onCheckedChange={handleDefaultSortChange}
            />
          </SettingRow>
        )}

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

        <Separator />

        <DescriptionHighlights />
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
        <span aria-hidden>·</span>
        <a
          href="mailto:hello@jobzap.app"
          className="transition-colors hover:text-foreground"
        >
          Feedback
        </a>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}
