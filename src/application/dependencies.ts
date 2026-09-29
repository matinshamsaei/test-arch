import type { BookSchedule } from "./use-cases/book-schedule.ts";
import type { CatalogPort, MockControlPort } from "./ports";
import type { ScheduleSearch } from "./use-cases/search-schedules.ts";

export interface SchedulingDependencies {
  readonly catalog: CatalogPort;
  readonly search: ScheduleSearch;
  readonly book: BookSchedule;
  readonly controls: MockControlPort;
}
