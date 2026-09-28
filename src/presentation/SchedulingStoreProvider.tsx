import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand';
import type { SchedulingStore } from './store.ts';
import { SchedulingStoreContext } from './store-context.ts';

export function SchedulingStoreProvider({
  store,
  children,
}: {
  readonly store: StoreApi<SchedulingStore>;
  readonly children: ReactNode;
}) {
  return <SchedulingStoreContext value={store}>{children}</SchedulingStoreContext>;
}
