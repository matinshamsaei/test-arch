import { createContext } from "react";
import type { StoreApi } from "zustand";

import type { SchedulingStore } from "./store.types.ts";

export const SchedulingStoreContext =
  createContext<StoreApi<SchedulingStore> | null>(null);
