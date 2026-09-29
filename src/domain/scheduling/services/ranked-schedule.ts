import { MAX_SCHEDULES } from "../constants.ts";
import { InvalidScheduleQueryError } from "../errors";
import type { Schedule, Slot } from "../types";
import { compareSchedules } from "../utils/compare.ts";

export interface Ranked {
  readonly slotIds: readonly string[];
  readonly slots: readonly Slot[];
  readonly endMinutes: number;
  readonly totalGapMinutes: number;
}

export function toRanked(chosen: readonly Slot[]): Ranked {
  const last = chosen[chosen.length - 1];
  if (!last)
    throw new InvalidScheduleQueryError("A schedule needs at least one slot.");

  return {
    slotIds: chosen.map((slot) => slot.id),
    slots: chosen.slice(),
    endMinutes: last.endMinutes,
    totalGapMinutes: totalGapMinutes(chosen),
  };
}

export function materialize(ranked: Ranked): Schedule {
  return {
    identity: ranked.slotIds.join(","),
    slotIds: ranked.slotIds,
    slots: ranked.slots.map((slot) => ({ ...slot })),
    endMinutes: ranked.endMinutes,
    totalGapMinutes: ranked.totalGapMinutes,
  };
}

export function insertTop(best: Ranked[], candidate: Ranked): void {
  const identity = candidate.slotIds.join(",");
  if (best.some((schedule) => schedule.slotIds.join(",") === identity)) return;

  let index = best.length;
  for (let position = 0; position < best.length; position += 1) {
    const current = best[position];
    if (!current) continue;
    if (compareSchedules(candidate, current) < 0) {
      index = position;
      break;
    }
  }

  best.splice(index, 0, candidate);
  if (best.length > MAX_SCHEDULES) best.pop();
}

function totalGapMinutes(slots: readonly Slot[]): number {
  let total = 0;

  for (let index = 1; index < slots.length; index += 1) {
    const previous = slots[index - 1];
    const next = slots[index];

    if (!previous || !next) continue;

    total += next.startMinutes - previous.endMinutes;
  }

  return total;
}
