import { createBookSchedule } from '../application/book-schedule.ts';
import type { SchedulingDependencies } from '../application/dependencies.ts';
import { createScheduleSearch } from '../application/schedule-search.ts';
import { createInMemorySchedulingApi, type InMemorySchedulingApi } from '../infrastructure/mock/in-memory-api.ts';

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
