import type { InPersonBooking } from "@domain/in-person-booking/types";

export function sampleInPersonBookings(): InPersonBooking[] {
  return [
    {
      orderCode: "IP-1001",
      patientName: "نگین احمدی",
      kind: "in-person",
      status: "confirmed",
      cancellationReason: null,
    },
    {
      orderCode: "IP-1002",
      patientName: "رضا محمدی",
      kind: "service",
      status: "awaiting-payment",
      cancellationReason: null,
    },
    {
      orderCode: "IP-1003",
      patientName: "رزرو پنهان",
      kind: "service",
      status: "reserved",
      cancellationReason: null,
    },
    {
      orderCode: "IP-1004",
      patientName: "تمام شده",
      kind: "in-person",
      status: "completed",
      cancellationReason: null,
    },
  ];
}
