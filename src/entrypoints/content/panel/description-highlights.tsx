import { TagsInput } from '@/components/ui/tags-input';
import { useActions, useSettings } from '@/store';

export function DescriptionHighlights() {
  const settings = useSettings();
  const actions = useActions();

  return (
    <div className="space-y-2">
      <div className="text-sm">Description highlights</div>
      <TagsInput
        value={settings.descriptionKeywords}
        onChange={actions.setDescriptionKeywords}
        onClear={() => {
          if (
            window.confirm(
              `Clear all ${settings.descriptionKeywords.length} description highlights?`,
            )
          ) {
            actions.setDescriptionKeywords([]);
          }
        }}
        placeholder="Add word or phrase..."
      />
    </div>
  );
}
