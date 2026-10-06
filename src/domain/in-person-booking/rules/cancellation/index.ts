import { inPersonBookingRuleError } from "../../errors";
import type { CancellationReason, InPersonBooking } from "../../types";
import { assertAllowed } from "../activation";

const CANCELLATION_REASONS = [
  "clinic-closed",
  "patient-absent",
  "doctor-absent",
] as const satisfies readonly CancellationReason[];

export function assertCancellationReason(reason: string): CancellationReason {
  if (!(CANCELLATION_REASONS as readonly string[]).includes(reason)) {
    throw inPersonBookingRuleError(
      "INVALID_CANCELLATION",
      "A cancellation reason is required.",
    );
  }
  return reason as CancellationReason;
}

export function cancelledBooking(
  booking: InPersonBooking,
  reason: string,
): InPersonBooking {
  assertAllowed(booking, "cancel");
  return {
    ...booking,
    status: "cancelled",
    cancellationReason: assertCancellationReason(reason),
  };
}
