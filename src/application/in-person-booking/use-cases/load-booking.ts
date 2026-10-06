import { assertOrderCode } from "@domain/in-person-booking";
import type { InPersonBooking } from "@domain/in-person-booking/types";

import { inPersonBookingError } from "../errors";
import type { InPersonBookingRepository } from "../repositories";

export async function loadBooking(
  repository: InPersonBookingRepository,
  orderCode: string,
): Promise<InPersonBooking> {
  const code = assertOrderCode(orderCode);
  const booking = await repository.findByOrderCode(code);
  if (!booking) {
    throw inPersonBookingError(`Booking ${code} was not found.`);
  }
  return booking;
}
