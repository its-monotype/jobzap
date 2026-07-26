import { cn } from '@/lib/utils';
import { useActiveFilters, useFilterCounts } from '@/store';

export function FilterStatus() {
  const activeFilters = useActiveFilters();
  const isFiltering = Object.values(activeFilters).some((v) => v);
  const counts = useFilterCounts();
  const hiddenCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2 rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'size-2 rounded-full',
            isFiltering ? 'bg-emerald-500' : 'bg-muted-foreground',
          )}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isFiltering ? 'Filters active' : 'Filters inactive'}
          </span>

          {isFiltering && (
            <span className="text-xs text-muted-foreground">
              {hiddenCount} jobs hidden
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
