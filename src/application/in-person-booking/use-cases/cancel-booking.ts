import { cancelledBooking } from "@domain/in-person-booking";
import type { CancellationReason } from "@domain/in-person-booking/types";

import type { InPersonBookingRepository } from "../repositories";
import { loadBooking } from "./load-booking.ts";

export interface CancelInPersonBookingCommand {
  readonly orderCode: string;
  readonly reason: CancellationReason;
}

export interface CancelInPersonBooking {
  execute(command: CancelInPersonBookingCommand): Promise<void>;
}

export function createCancelInPersonBooking(
  repository: InPersonBookingRepository,
): CancelInPersonBooking {
  return {
    async execute(command) {
      const booking = await loadBooking(repository, command.orderCode);
      await repository.save(cancelledBooking(booking, command.reason));
    },
  };
}
