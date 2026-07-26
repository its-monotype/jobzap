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
        <div className="text-sm">Title keywords</div>
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
        onClear={() => {
          if (
            window.confirm(
              `Clear all ${keywords.length} excluded job title keywords?`,
            )
          ) {
            actions.setExcludedKeywords([]);
          }
        }}
        placeholder="Add keyword..."
      />
    </div>
  );
}
