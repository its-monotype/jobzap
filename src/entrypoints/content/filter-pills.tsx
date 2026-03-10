import { FILTERS, FilterId } from '@/constants';
import {
  useActions,
  useEnabledFilters,
  useFilterCounts,
  useToggledFilters,
} from '@/store';
import { FilterPill } from './filter-pill';

export function FilterPills() {
  const enabledFilters = useEnabledFilters();
  const toggledFilters = useToggledFilters();
  const filterCounts = useFilterCounts();
  const actions = useActions();

  const pills = Object.entries(FILTERS)
    .filter(([id]) => enabledFilters[id as FilterId])
    .map(([id, meta]) => ({
      id,
      label: meta.label,
      color: meta.color,
      count: filterCounts[id as FilterId] ?? 0,
      active: toggledFilters[id as FilterId],
    }));

  return (
    <div className="flex flex-col items-end gap-2">
      {pills.map(({ id, ...rest }) => (
        <FilterPill
          key={id}
          {...rest}
          onClick={() => actions.toggleFilter(id as FilterId)}
        />
      ))}
    </div>
  );
}
