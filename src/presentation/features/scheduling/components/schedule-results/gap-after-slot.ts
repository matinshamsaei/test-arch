import type { Slot } from "@domain/scheduling/types";

export function gapAfterSlot(
  slots: readonly Slot[],
  index: number,
): number | null {
  const current = slots[index];
  const next = slots[index + 1];

  if (!current || !next) return null;

  return next.startMinutes - current.endMinutes;
}
