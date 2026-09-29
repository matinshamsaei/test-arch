import type { ReactNode } from "react";
import type { StoreApi } from "zustand";

import type { SchedulingStore } from "../types";
import { SchedulingStoreContext } from "../contexts";

export function SchedulingStoreProvider({
  store,
  children,
}: {
  readonly store: StoreApi<SchedulingStore>;
  readonly children: ReactNode;
}) {
  return (
    <SchedulingStoreContext value={store}>{children}</SchedulingStoreContext>
  );
}
