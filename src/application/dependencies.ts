import type { BookSchedule } from './book-schedule.ts';
import type { CatalogPort, MockControlPort } from './ports.ts';
import type { ScheduleSearch } from './schedule-search.ts';

export interface SchedulingDependencies {
  readonly catalog: CatalogPort;
  readonly search: ScheduleSearch;
  readonly book: BookSchedule;
  readonly controls: MockControlPort;
}
