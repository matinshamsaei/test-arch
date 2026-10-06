import { expect, it } from "vitest";

import type { BookingReceipt } from "@application/scheduling/ports";
import { createContainer } from "@composition/container.ts";
import { loadSampleDataset } from "@infrastructure/adapters/mock/dataset.ts";
import type { CapacityPort } from "@application/scheduling/ports";
import type { SlotSnapshot } from "@domain/scheduling/types";
import { createScheduleSearch } from "@application/scheduling/use-cases/search-schedules.ts";
import {
  SCHEDULE_DATE,
  SCHEDULE_TIME_ZONE,
} from "@domain/scheduling/constants.ts";

import { createSchedulingStore } from "./store.ts";
import { canBook } from "./utils";

const instant = async () => {};

it("shows loading, then the empty narrow window, and ignores the late wide response", async () => {
  const { slots } = loadSampleDataset();
  const snapshot: SlotSnapshot = {
    date: SCHEDULE_DATE,
    timeZone: SCHEDULE_TIME_ZONE,
    slots,
  };
  let releaseFirst: ((value: SlotSnapshot) => void) | undefined;
  let calls = 0;
  const capacity: CapacityPort = {
    getSlots: () => {
      calls += 1;
      if (calls === 1) {
        return new Promise<SlotSnapshot>((resolve) => {
          releaseFirst = resolve;
        });
      }
      return Promise.resolve(snapshot);
    },
  };
  const store = createSchedulingStore({
    catalog: { getServices: async () => [] },
    search: createScheduleSearch(capacity),
    book: { execute: async () => Promise.reject(new Error("unused")) },
    controls: { setMode: () => {}, reset: () => {} },
  });

  const wide = store.getState().search();
  expect(store.getState().phase).toBe("loading");
  store.getState().setWindowEnd("10:50");
  const narrow = store.getState().search();
  await narrow;

  expect(store.getState().phase).toBe("empty");
  expect(store.getState().windowEnd).toBe("10:50");
  expect(store.getState().schedules).toEqual([]);

  releaseFirst?.(snapshot);
  await wide;

  expect(store.getState().phase).toBe("empty");
  expect(store.getState().schedules).toEqual([]);
});

it("keeps the form and rebuilds suggestions after a capacity conflict", async () => {
  const container = createContainer({ sleep: instant });
  container.scheduling.api.setMode("capacity-conflict");
  const store = createSchedulingStore(container.scheduling);

  await store.getState().search();
  expect(store.getState().schedules[0]?.slotIds).toEqual(["a2", "b1", "c1"]);
  store.getState().selectSchedule("a2,b1,c1");
  await store.getState().bookSelected();

  expect(store.getState().selectedIds).toEqual(["S1", "S2", "S3"]);
  expect(store.getState().windowStart).toBe("09:00");
  expect(store.getState().windowEnd).toBe("14:00");
  expect(store.getState().conflictingSlotIds).toEqual(["c1"]);
  expect(store.getState().phase).toBe("ready");
  expect(
    store.getState().schedules.map((schedule) => schedule.slotIds),
  ).toEqual([
    ["a3", "b3", "c2"],
    ["a2", "b1", "c2"],
    ["a2", "b3", "c2"],
  ]);

  const after = await container.scheduling.api.getSlots(SCHEDULE_DATE);
  expect(after.slots.find((slot) => slot.id === "a2")?.remainingCapacity).toBe(
    1,
  );
  expect(after.slots.find((slot) => slot.id === "b1")?.remainingCapacity).toBe(
    1,
  );
  expect(after.slots.find((slot) => slot.id === "c1")?.remainingCapacity).toBe(
    0,
  );
});

it("blocks a second submit and a selection change while booking is in flight", async () => {
  const container = createContainer({ sleep: instant });
  const received: string[][] = [];
  let release: ((receipt: BookingReceipt) => void) | undefined;
  const store = createSchedulingStore({
    catalog: container.scheduling.catalog,
    search: container.scheduling.search,
    controls: container.scheduling.controls,
    book: {
      execute(slotIds) {
        received.push([...slotIds]);
        return new Promise<BookingReceipt>((resolve) => {
          release = resolve;
        });
      },
    },
  });

  await store.getState().search();
  store.getState().selectSchedule("a2,b1,c1");
  const pending = store.getState().bookSelected();
  expect(store.getState().phase).toBe("booking");

  store.getState().selectSchedule("a3,b3,c2");
  store.getState().setWindowEnd("10:50");
  await store.getState().bookSelected();

  expect(store.getState().selectedIdentity).toBe("a2,b1,c1");
  expect(received).toEqual([["a2", "b1", "c1"]]);
  expect(canBook(store.getState())).toBe(false);

  release?.({
    bookingId: "bk-1",
    slotIds: ["a2", "b1", "c1"],
    status: "confirmed",
  });
  await pending;
  expect(store.getState().receipt?.bookingId).toBe("bk-1");
  expect(store.getState().receipt?.slots.map((slot) => slot.id)).toEqual([
    "a2",
    "b1",
    "c1",
  ]);
});

it("makes an edited result bookable again only when the form matches the search", async () => {
  const store = createSchedulingStore(createContainer({ sleep: instant }).scheduling);
  await store.getState().search();
  store.getState().selectSchedule("a2,b1,c1");
  expect(canBook(store.getState())).toBe(true);

  store.getState().setWindowEnd("13:00");
  expect(canBook(store.getState())).toBe(false);

  store.getState().setWindowEnd("14:00");
  expect(canBook(store.getState())).toBe(true);
});

it("keeps the current phase when the form is invalid", async () => {
  const store = createSchedulingStore(createContainer({ sleep: instant }).scheduling);
  store.getState().toggleService("S3");
  store.getState().toggleService("S2");
  await store.getState().search();

  expect(store.getState().formError).toBe("دو یا سه خدمت انتخاب کنید.");
  expect(store.getState().phase).toBe("idle");
});
