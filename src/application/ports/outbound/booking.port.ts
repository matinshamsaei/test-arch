export interface BookCommand {
  readonly slotIds: readonly string[];
}

export interface BookingReceipt {
  readonly bookingId: string;
  readonly slotIds: readonly string[];
  readonly status: "confirmed";
}

export interface BookingPort {
  book(command: BookCommand): Promise<BookingReceipt>;
}
