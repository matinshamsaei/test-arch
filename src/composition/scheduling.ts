import type { SchedulingDependencies } from "@application/scheduling/dependencies.ts";
import { createBookSchedule } from "@application/scheduling/use-cases/book-schedule.ts";
import { createScheduleSearch } from "@application/scheduling/use-cases/search-schedules.ts";
import { createInMemorySchedulingApi } from "@infrastructure/adapters/mock/in-memory-scheduling-api.ts";
import type { InMemorySchedulingApi } from "@infrastructure/adapters/mock/types";

export interface SchedulingContainerOptions {
  readonly sleep?: (ms: number) => Promise<void>;
}

export interface SchedulingContainer extends SchedulingDependencies {
  readonly api: InMemorySchedulingApi;
}

export function createSchedulingContainer(
  options: SchedulingContainerOptions = {},
): SchedulingContainer {
  const api = createInMemorySchedulingApi(options);

  return {
    api,
    catalog: api,
    search: createScheduleSearch(api),
    book: createBookSchedule(api),
    controls: api,
  };
}
