import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/components/ui/tags-input';
import { useActions, useSettings } from '@/store';

export function ExcludedKeywords() {
  const settings = useSettings();
  const actions = useActions();

  const keywords = settings.excludedKeywords;
  const enabled = settings.enabledFilters.keywords;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Keywords</div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            actions.setFilterEnabled('keywords', checked)
          }
        />
      </div>
      <TagsInput
        value={keywords}
        onChange={actions.setExcludedKeywords}
        placeholder="Add keyword..."
      />
    </div>
  );
}
