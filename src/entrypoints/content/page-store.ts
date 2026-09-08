import { create } from 'zustand';

export const usePageStore = create(() => ({ url: location.href }));
