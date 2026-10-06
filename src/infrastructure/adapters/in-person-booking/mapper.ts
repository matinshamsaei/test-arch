import type {
  InPersonBooking,
  InPersonBookingKind,
  InPersonBookingStatus,
} from "@domain/in-person-booking/types";

import { BookStatus, BookingType } from "./api-types.ts";
import type { ApiInPersonBooking } from "./api-types.ts";

function mapStatus(id: number): InPersonBookingStatus | null {
  switch (id) {
    case BookStatus.Reserved:
      return "reserved";
    case BookStatus.AwaitingPayment:
      return "awaiting-payment";
    case BookStatus.Confirmed:
      return "confirmed";
    case BookStatus.Cancelled:
    case BookStatus.Rejected:
      return "cancelled";
    case BookStatus.Completed:
      return "completed";
    default:
      return null;
  }
}

function mapKind(id: number): InPersonBookingKind | null {
  switch (id) {
    case BookingType.InPerson:
      return "in-person";
    case BookingType.Services:
      return "service";
    default:
      return null;
  }
}

export function toDomainBooking(
  row: ApiInPersonBooking,
): InPersonBooking | null {
  const status = mapStatus(row.bookStatus.id);
  const kind = mapKind(row.bookingType.id);
  if (!status || !kind) return null;

  return {
    orderCode: row.orderCode,
    patientName: row.patient.name || row.patient.phoneNumber || row.orderCode,
    kind,
    status,
    cancellationReason: null,
  };
}
