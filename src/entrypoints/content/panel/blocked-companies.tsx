import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/components/ui/tags-input';
import { useActions, useSettings, useVisibleCompanies } from '@/store';

export function BlockedCompanies() {
  const settings = useSettings();
  const actions = useActions();
  const visibleCompanies = useVisibleCompanies();

  const blockedCompanies = settings.blockedCompanies;
  const enabled = settings.enabledFilters.companies;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Companies</div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            actions.setFilterEnabled('companies', checked)
          }
        />
      </div>
      <TagsInput
        value={blockedCompanies}
        onChange={actions.setBlockedCompanies}
        onClear={() => {
          if (
            window.confirm(
              `Clear all ${blockedCompanies.length} blocked companies?`,
            )
          ) {
            actions.setBlockedCompanies([]);
          }
        }}
        suggestions={visibleCompanies}
        placeholder="Add company..."
      />
    </div>
  );
}
