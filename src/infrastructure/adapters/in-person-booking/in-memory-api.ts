import { inPersonBookingError } from "@application/in-person-booking/errors";
import type { InPersonBookingRepository } from "@application/in-person-booking/repositories";

import { sampleInPersonBookings } from "./dataset.ts";

export function createInMemoryInPersonBookingApi(): InPersonBookingRepository {
  const bookings = sampleInPersonBookings();

  return {
    async list() {
      return bookings.map((booking) => ({ ...booking }));
    },

    async findByOrderCode(orderCode) {
      const booking = bookings.find((item) => item.orderCode === orderCode);
      return booking ? { ...booking } : null;
    },

    async save(booking) {
      const index = bookings.findIndex((item) => item.orderCode === booking.orderCode);
      if (index < 0) {
        throw inPersonBookingError(`Booking ${booking.orderCode} was not found.`);
      }
      bookings[index] = { ...booking };
    },
  };
}
