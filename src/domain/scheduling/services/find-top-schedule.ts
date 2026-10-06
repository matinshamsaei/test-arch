import type { PresenceWindow, Schedule, Slot } from "../types/index.ts";

import { assertQuery } from "./assert-query/index.ts";
import { eligibleSlots } from "./eligible-slots.ts";
import { materialize } from "./ranked-schedule.ts";
import type { Ranked } from "./ranked-schedule.ts";
import { searchLevel } from "./search-level.ts";

export function findTopSchedules(
  slots: readonly Slot[],
  serviceIds: readonly string[],
  window: PresenceWindow,
): Schedule[] {
  assertQuery(serviceIds, window);

  const groups = serviceIds.map((serviceId) =>
    eligibleSlots(slots, serviceId, window),
  );

  if (groups.some((group) => group.length === 0)) return [];

  const best: Ranked[] = [];
  const chosen: Slot[] = [];

  searchLevel(0, groups, chosen, best);

  return best.map(materialize);
}
