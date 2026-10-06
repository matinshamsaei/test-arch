import { inPersonBookingRuleError } from "../../errors";
import type { InPersonBooking } from "../../types";
import { assertAllowed } from "../activation";

export function assertOrderCode(orderCode: string): string {
  const value = orderCode.trim();
  if (!value) {
    throw inPersonBookingRuleError("INVALID_ORDER", "Order code is required.");
  }
  return value;
}

export function completedBooking(booking: InPersonBooking): InPersonBooking {
  assertAllowed(booking, "complete");
  return { ...booking, status: "completed" };
}
