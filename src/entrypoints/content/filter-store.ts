import type { FilterId } from '@/constants';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface FilterResults {
  counts: Partial<Record<FilterId, number>>;
  jobListCompanies: string[];
}

interface FilterStore extends FilterResults {
  setResults: (results: FilterResults) => void;
}

export const useFilterStore = create<FilterStore>()((set) => ({
  counts: {},
  jobListCompanies: [],
  setResults: (results) => set(results),
}));

export const useFilterCounts = () =>
  useFilterStore(useShallow((state) => state.counts));
export const useJobListCompanies = () =>
  useFilterStore(useShallow((state) => state.jobListCompanies));
