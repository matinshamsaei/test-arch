import { expect, it } from "vitest";

import { createInMemoryInPersonBookingApi } from "@infrastructure/adapters/in-person-booking/in-memory-api.ts";

import { createCancelInPersonBooking } from "./cancel-booking.ts";
import { createCompleteInPersonBooking } from "./complete-booking.ts";
import { createListActiveInPersonBookings } from "./list-active-bookings.ts";

function useCases() {
  const api = createInMemoryInPersonBookingApi();
  return {
    api,
    list: createListActiveInPersonBookings(api),
    complete: createCompleteInPersonBooking(api),
    cancel: createCancelInPersonBooking(api),
  };
}

it("lists only bookings the domain marks as open", async () => {
  const { list } = useCases();
  const items = await list.execute();

  expect(items.map((item) => item.booking.orderCode)).toEqual([
    "IP-1001",
    "IP-1002",
  ]);
  expect(items[0]?.actions).toEqual({ complete: true, cancel: true });
});

it("refuses a hidden booking and stores the cancellation reason", async () => {
  const { api, complete, cancel, list } = useCases();

  await expect(complete.execute("IP-1003")).rejects.toMatchObject({
    kind: "InPersonBookingRuleError",
    code: "ACTION_NOT_ALLOWED",
  });

  await cancel.execute({ orderCode: "IP-1002", reason: "patient-absent" });
  expect((await api.findByOrderCode("IP-1002"))?.cancellationReason).toBe(
    "patient-absent",
  );
  expect((await list.execute()).map((item) => item.booking.orderCode)).toEqual([
    "IP-1001",
  ]);
});
