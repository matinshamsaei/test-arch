import { inPersonBookingRuleError } from "../../errors";
import type { InPersonBooking, InPersonBookingActions } from "../../types";

const ACTIVE_STATUSES = ["reserved", "awaiting-payment", "confirmed"] as const;

export function isListedOnActiveBoard(booking: InPersonBooking): boolean {
  const active = (ACTIVE_STATUSES as readonly string[]).includes(
    booking.status,
  );
  if (!active) return false;
  return !(booking.status === "reserved" && booking.kind === "service");
}

export function actionsFor(booking: InPersonBooking): InPersonBookingActions {
  const open = isListedOnActiveBoard(booking);
  return { complete: open, cancel: open };
}

export function assertAllowed(
  booking: InPersonBooking,
  action: keyof InPersonBookingActions,
): void {
  if (!actionsFor(booking)[action]) {
    throw inPersonBookingRuleError(
      "ACTION_NOT_ALLOWED",
      `Booking ${booking.orderCode} cannot ${action}.`,
    );
  }
}
