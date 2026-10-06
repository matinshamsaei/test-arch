import type { BookingPort, BookingReceipt } from "../ports";

export interface BookSchedule {
  execute(slotIds: readonly string[]): Promise<BookingReceipt>;
}

export function createBookSchedule(booking: BookingPort): BookSchedule {
  return {
    execute(slotIds) {
      return booking.book({ slotIds: [...slotIds] });
    },
  };
}
