import { useContext } from "react";
import { useStore } from "zustand";

import type { SchedulingStore } from "../store/store.types.ts";
import { SchedulingStoreContext } from "../store/store.context.ts";

export default function useScheduling<T>(
  selector: (state: SchedulingStore) => T,
): T {
  const store = useContext(SchedulingStoreContext);
  if (!store) throw new Error("SchedulingStoreProvider is missing.");
  return useStore(store, selector);
}
