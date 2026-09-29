import type { Slot } from "../types";
import { requiredGapMinutes } from "../utils/required-gap.ts";

import { insertTop, toRanked } from "./ranked-schedule.ts";
import type { Ranked } from "./ranked-schedule.ts";

export function searchLevel(
  level: number,
  groups: readonly (readonly Slot[])[],
  chosen: Slot[],
  best: Ranked[],
): void {
  if (level === groups.length) {
    insertTop(best, toRanked(chosen));
    return;
  }

  const group = groups[level];

  if (!group) return;

  const previous = chosen[chosen.length - 1];

  for (const slot of group) {
    if (previous && !hasRequiredGap(previous, slot)) continue;

    chosen.push(slot);
    searchLevel(level + 1, groups, chosen, best);
    chosen.pop();
  }
}

function hasRequiredGap(previous: Slot, next: Slot): boolean {
  const gap = next.startMinutes - previous.endMinutes;

  return gap >= requiredGapMinutes(previous.clinicId, next.clinicId);
}
