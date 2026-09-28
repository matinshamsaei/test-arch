import { createBookSchedule } from "../application/use-cases/book-schedule.ts";
import type { SchedulingDependencies } from "../application/dependencies.ts";
import { createScheduleSearch } from "../application/use-cases/search-schedules.ts";
import { createInMemorySchedulingApi } from "../infrastructure/adapters/mock/in-memory-scheduling-api.ts";
import type { InMemorySchedulingApi } from "../infrastructure/adapters/mock/types/index.ts";

export interface AppContainer extends SchedulingDependencies {
  readonly api: InMemorySchedulingApi;
}

interface ContainerOptions {
  readonly sleep?: (ms: number) => Promise<void>;
}

export function createContainer(options: ContainerOptions = {}): AppContainer {
  const api = createInMemorySchedulingApi(options);

  return {
    api,
    catalog: api,
    search: createScheduleSearch(api),
    book: createBookSchedule(api),
    controls: api,
  };
}
