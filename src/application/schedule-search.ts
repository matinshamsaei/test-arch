import { findTopSchedules } from '../domain/find-schedules.ts';
import type { PresenceWindow, Schedule } from '../domain/types.ts';
import type { CapacityPort } from './ports.ts';

export interface SearchInput {
  readonly date: string;
  readonly serviceIds: readonly string[];
  readonly window: PresenceWindow;
}

export type SearchOutcome =
  | {
      readonly status: 'ready';
      readonly requestId: number;
      readonly schedules: readonly Schedule[];
    }
  | {
      readonly status: 'stale';
      readonly requestId: number;
    };

export interface ScheduleSearch {
  execute(input: SearchInput): Promise<SearchOutcome>;
}

export function createScheduleSearch(capacity: CapacityPort): ScheduleSearch {
  let latestRequestId = 0;

  return {
    async execute(input) {
      const requestId = ++latestRequestId;

      try {
        const snapshot = await capacity.getSlots(input.date);
        if (requestId !== latestRequestId) return { status: 'stale', requestId };

        const schedules = findTopSchedules(snapshot.slots, input.serviceIds, input.window);
        if (requestId !== latestRequestId) return { status: 'stale', requestId };

        return { status: 'ready', requestId, schedules };
      } catch (error) {
        if (requestId !== latestRequestId) return { status: 'stale', requestId };
        throw error;
      }
    },
  };
}
