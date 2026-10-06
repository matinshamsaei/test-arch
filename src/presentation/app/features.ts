import type { ComponentType } from "react";

import type { AppContainer } from "@composition/container.ts";

import { InPersonBookingPage } from "../features/in-person-booking";
import { SchedulingPage, createSchedulingStore } from "../features/scheduling";

export interface Workspace {
  readonly id: string;
  readonly label: string;
  readonly Page: ComponentType;
}

export const workspaces = [
  { id: "scheduling", label: "زمان‌بندی", Page: SchedulingPage },
  { id: "in-person-booking", label: "نوبت حضوری", Page: InPersonBookingPage },
] as const satisfies readonly Workspace[];

export type WorkspaceId = (typeof workspaces)[number]["id"];

export interface AppStores {
  readonly scheduling: ReturnType<typeof createSchedulingStore>;
}

export function createAppStores(container: AppContainer): AppStores {
  return {
    scheduling: createSchedulingStore(container.scheduling),
  };
}
