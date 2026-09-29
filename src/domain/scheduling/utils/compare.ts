import type { Schedule } from "../types";

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
