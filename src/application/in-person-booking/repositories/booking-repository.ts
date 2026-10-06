import type { InPersonBooking } from "@domain/in-person-booking/types";

export interface InPersonBookingRepository {
  list(): Promise<readonly InPersonBooking[]>;
  findByOrderCode(orderCode: string): Promise<InPersonBooking | null>;
  save(booking: InPersonBooking): Promise<void>;
}
