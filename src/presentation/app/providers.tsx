import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

import { SchedulingStoreProvider } from "../features/scheduling";
import type { AppStores } from "./features.ts";

export function AppStoresProvider({
  stores,
  queryClient,
  children,
}: {
  readonly stores: AppStores;
  readonly queryClient: QueryClient;
  readonly children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SchedulingStoreProvider store={stores.scheduling}>
        {children}
      </SchedulingStoreProvider>
    </QueryClientProvider>
  );
}
