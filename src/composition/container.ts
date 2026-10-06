import { inPersonBooking } from "./in-person-booking.ts";
import { createSchedulingContainer } from "./scheduling.ts";
import type {
  SchedulingContainer,
  SchedulingContainerOptions,
} from "./scheduling.ts";

export type AppContainerOptions = SchedulingContainerOptions;

export interface AppContainer {
  readonly scheduling: SchedulingContainer;
  readonly inPersonBooking: typeof inPersonBooking;
}

export function createContainer(
  options: AppContainerOptions = {},
): AppContainer {
  return {
    scheduling: createSchedulingContainer(options),
    inPersonBooking,
  };
}
