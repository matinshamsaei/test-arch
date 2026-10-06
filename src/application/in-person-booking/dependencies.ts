import type { CancelInPersonBooking } from "./use-cases/cancel-booking.ts";
import type { CompleteInPersonBooking } from "./use-cases/complete-booking.ts";
import type { ListActiveInPersonBookings } from "./use-cases/list-active-bookings.ts";

export interface InPersonBookingDependencies {
  readonly listActive: ListActiveInPersonBookings;
  readonly complete: CompleteInPersonBooking;
  readonly cancel: CancelInPersonBooking;
}
