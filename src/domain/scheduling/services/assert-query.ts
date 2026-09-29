import { MAX_SERVICES, MIN_SERVICES } from "../constants.ts";
import { InvalidScheduleQueryError } from "../errors";
import type { PresenceWindow } from "../types";

export function assertQuery(
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
