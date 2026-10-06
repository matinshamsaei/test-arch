import { actionsFor, isListedOnActiveBoard } from "@domain/in-person-booking";
import type {
  InPersonBooking,
  InPersonBookingActions,
} from "@domain/in-person-booking/types";

import type { InPersonBookingRepository } from "../repositories";

export interface InPersonBookingView {
  readonly booking: InPersonBooking;
  readonly actions: InPersonBookingActions;
}

export interface ListActiveInPersonBookings {
  execute(): Promise<readonly InPersonBookingView[]>;
}

export function createListActiveInPersonBookings(
  repository: InPersonBookingRepository,
): ListActiveInPersonBookings {
  return {
    async execute() {
      const items = await repository.list();
      return items.filter(isListedOnActiveBoard).map((booking) => ({
        booking,
        actions: actionsFor(booking),
      }));
    },
  };
}
