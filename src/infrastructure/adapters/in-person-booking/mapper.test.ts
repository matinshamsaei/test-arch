import { expect, it } from "vitest";

import { BookStatus, BookingType } from "./api-types.ts";
import { toDomainBooking } from "./mapper.ts";

it("maps physician-panel booking rows into domain bookings", () => {
  const booking = toDomainBooking({
    orderCode: "ORD-1",
    patient: { name: "سارا", phoneNumber: "0912" },
    bookingType: { id: BookingType.InPerson, name: "حضوری" },
    bookStatus: { id: BookStatus.Confirmed, name: "تایید شده" },
  });

  expect(booking).toEqual({
    orderCode: "ORD-1",
    patientName: "سارا",
    kind: "in-person",
    status: "confirmed",
    cancellationReason: null,
  });
});

it("ignores unsupported booking types", () => {
  expect(
    toDomainBooking({
      orderCode: "ORD-2",
      patient: { name: "x", phoneNumber: "" },
      bookingType: { id: 1, name: "online" },
      bookStatus: { id: BookStatus.Confirmed, name: "تایید شده" },
    }),
  ).toBeNull();
});
