import { expect, it } from "vitest";

import {
  actionsFor,
  assertCancellationReason,
  isListedOnActiveBoard,
} from "./index.ts";
import type { InPersonBooking } from "./types";

function booking(overrides: Partial<InPersonBooking> = {}): InPersonBooking {
  return {
    orderCode: "IP-1",
    patientName: "نگین احمدی",
    kind: "in-person",
    status: "confirmed",
    cancellationReason: null,
    ...overrides,
  };
}

it("hides a reserved service and a finished visit from the active board", () => {
  expect(
    isListedOnActiveBoard(booking({ kind: "service", status: "reserved" })),
  ).toBe(false);
  expect(isListedOnActiveBoard(booking({ status: "completed" }))).toBe(false);
  expect(actionsFor(booking())).toEqual({ complete: true, cancel: true });
});

it("requires a known cancellation reason", () => {
  expect(assertCancellationReason("patient-absent")).toBe("patient-absent");
  expect(() => assertCancellationReason("")).toThrow(
    expect.objectContaining({
      kind: "InPersonBookingRuleError",
      code: "INVALID_CANCELLATION",
    }),
  );
});
