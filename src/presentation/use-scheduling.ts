import { useContext } from 'react';
import { useStore } from 'zustand';
import type { SchedulingStore } from './store.ts';
import { SchedulingStoreContext } from './store-context.ts';

export function useScheduling<T>(selector: (state: SchedulingStore) => T): T {
  const store = useContext(SchedulingStoreContext);
  if (!store) throw new Error('SchedulingStoreProvider is missing.');
  return useStore(store, selector);
}
