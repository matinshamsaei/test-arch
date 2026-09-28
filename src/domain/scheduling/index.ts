import {
  DIFFERENT_CLINIC_GAP_MINUTES,
  MAX_SCHEDULES,
  MAX_SERVICES,
  MIN_SERVICES,
  SAME_CLINIC_GAP_MINUTES,
} from "./constants.ts";
import { InvalidScheduleQueryError } from "./errors/index.ts";
import type { PresenceWindow, Schedule, Slot } from "./types/index.ts";

export function requiredGapMinutes(
  previousClinicId: string,
  nextClinicId: string,
): number {
  return previousClinicId === nextClinicId
    ? SAME_CLINIC_GAP_MINUTES
    : DIFFERENT_CLINIC_GAP_MINUTES;
}

export function compareAscii(left: string, right: string): number {
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);

    if (difference !== 0) return difference;
  }

  return left.length - right.length;
}

export function compareSlotIdSequence(
  left: readonly string[],
  right: readonly string[],
): number {
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftId = left[index];
    const rightId = right[index];

    if (leftId === undefined || rightId === undefined) break;

    const difference = compareAscii(leftId, rightId);

    if (difference !== 0) return difference;
  }

  return left.length - right.length;
}

export function compareSchedules(
  left: Pick<Schedule, "endMinutes" | "totalGapMinutes" | "slotIds">,
  right: Pick<Schedule, "endMinutes" | "totalGapMinutes" | "slotIds">,
): number {
  if (left.endMinutes !== right.endMinutes)
    return left.endMinutes - right.endMinutes;

  if (left.totalGapMinutes !== right.totalGapMinutes) {
    return left.totalGapMinutes - right.totalGapMinutes;
  }

  return compareSlotIdSequence(left.slotIds, right.slotIds);
}

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

function assertQuery(
  serviceIds: readonly string[],
  window: PresenceWindow,
): void {
  if (serviceIds.length < MIN_SERVICES || serviceIds.length > MAX_SERVICES) {
    throw new InvalidScheduleQueryError("Select two or three services.");
  }

  if (new Set(serviceIds).size !== serviceIds.length) {
    throw new InvalidScheduleQueryError("Services must be distinct.");
  }

  if (window.startMinutes >= window.endMinutes) {
    throw new InvalidScheduleQueryError(
      "Presence window must end after it starts.",
    );
  }
}

function eligibleSlots(
  slots: readonly Slot[],
  serviceId: string,
  window: PresenceWindow,
): Slot[] {
  const eligible: Slot[] = [];

  for (const slot of slots) {
    if (slot.serviceId !== serviceId) continue;
    if (slot.remainingCapacity <= 0) continue;
    if (slot.endMinutes <= slot.startMinutes) continue;
    if (slot.startMinutes < window.startMinutes) continue;
    if (slot.endMinutes > window.endMinutes) continue;

    eligible.push(slot);
  }

  return eligible;
}

function searchLevel(
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

interface Ranked {
  readonly slotIds: readonly string[];
  readonly slots: readonly Slot[];
  readonly endMinutes: number;
  readonly totalGapMinutes: number;
}

function toRanked(chosen: readonly Slot[]): Ranked {
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

function materialize(ranked: Ranked): Schedule {
  return {
    identity: ranked.slotIds.join(","),
    slotIds: ranked.slotIds,
    slots: ranked.slots.map((slot) => ({ ...slot })),
    endMinutes: ranked.endMinutes,
    totalGapMinutes: ranked.totalGapMinutes,
  };
}

function insertTop(best: Ranked[], candidate: Ranked): void {
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
