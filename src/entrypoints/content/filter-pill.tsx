import { cn } from '@/lib/utils';

interface FilterPillProps {
  label: string;
  color: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export function FilterPill({
  label,
  count,
  active,
  color = 'var(--color-neutral-500)',
  onClick,
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={
        {
          '--pill-color': color,
        } as React.CSSProperties
      }
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full bg-(--pill-color)/70 px-2 pr-3 font-medium backdrop-blur-sm transition-colors hover:bg-(--pill-color)/80 active:bg-(--pill-color)/90',
        !active && 'opacity-70',
      )}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-sm leading-none">
        {active ? count : 'OFF'}
      </span>
      <span>{label}</span>
    </button>
  );
}
