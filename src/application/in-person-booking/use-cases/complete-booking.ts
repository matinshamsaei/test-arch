import { completedBooking } from "@domain/in-person-booking";

import type { InPersonBookingRepository } from "../repositories";
import { loadBooking } from "./load-booking.ts";

export interface CompleteInPersonBooking {
  execute(orderCode: string): Promise<void>;
}

export function createCompleteInPersonBooking(
  repository: InPersonBookingRepository,
): CompleteInPersonBooking {
  return {
    async execute(orderCode) {
      const booking = await loadBooking(repository, orderCode);
      await repository.save(completedBooking(booking));
    },
  };
}
