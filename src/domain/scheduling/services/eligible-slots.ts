import type { PresenceWindow, Slot } from "../types";

export function eligibleSlots(
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
