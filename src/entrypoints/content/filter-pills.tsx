import { FILTER_CONFIG, FilterId } from '@/constants';
import { useActions, useActiveFilters, useCounts, useSettings } from '@/store';
import { FilterPill } from './filter-pill';

export function FilterPills() {
  const settings = useSettings();
  const counts = useCounts();
  const active = useActiveFilters();
  const actions = useActions();

  const pills = Object.entries(FILTER_CONFIG)
    .filter(([id]) => settings.filters[id as FilterId])
    .map(([id, meta]) => ({
      id,
      label: meta.label,
      color: meta.color,
      count: counts[id as FilterId] ?? 0,
      active: active[id as FilterId],
    }));

  return (
    <div className="flex flex-col items-end gap-2">
      {pills.map(({ id, ...rest }) => (
        <FilterPill
          key={id}
          {...rest}
          onClick={() => actions.toggleActive(id as FilterId)}
        />
      ))}
    </div>
  );
}
