export const FILTERS = {
  promoted: { label: 'Promoted', color: 'var(--color-amber-500)' },
  viewed: { label: 'Viewed', color: 'var(--color-sky-500)' },
  dismissed: { label: 'Dismissed', color: 'var(--color-red-500)' },
  applied: { label: 'Applied', color: 'var(--color-green-500)' },
  companies: { label: 'Companies', color: 'var(--color-purple-500)' },
  keywords: { label: 'Keywords', color: 'var(--color-pink-500)' },
} as const;

export type FilterId = keyof typeof FILTERS;
