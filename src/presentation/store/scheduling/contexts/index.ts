import { createContext } from "react";
import type { StoreApi } from "zustand";

import type { SchedulingStore } from "../types";

export const SchedulingStoreContext =
  createContext<StoreApi<SchedulingStore> | null>(null);
