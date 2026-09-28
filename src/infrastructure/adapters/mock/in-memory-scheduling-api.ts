import {
  SCHEDULE_DATE,
  SCHEDULE_TIME_ZONE,
} from "../../../domain/scheduling/constants.ts";
import type { Service, Slot } from "../../../domain/scheduling/types/index.ts";
import { SchedulingError } from "../../../application/errors/index.ts";
import type {
  BookingReceipt,
  MockMode,
} from "../../../application/ports/index.ts";
import { responseDelay } from "../../utils";

import { loadSampleDataset } from "./dataset.ts";
import type { ApiOptions, InMemorySchedulingApi, StoredSlot } from "./types";

const SLOT_READ_MS = 300;
const BOOK_MS = 500;
const SLOW_SEARCH_MS = 1500;
const FAST_SEARCH_MS = 200;

export function createInMemorySchedulingApi(
  options: ApiOptions = {},
): InMemorySchedulingApi {
  const sleep = options.sleep ?? responseDelay;
  const base = loadSampleDataset();

  let mode: MockMode = "normal";
  let services = cloneServices(base.services);
  let slots = cloneSlots(base.slots);
  let searchOrdinal = 0;
  let readsToFail = 0;
  let bookingSequence = 0;

  function nextSlotDelay(): number {
    if (mode !== "out-of-order") return SLOT_READ_MS;
    searchOrdinal += 1;
    if (searchOrdinal === 1) return SLOW_SEARCH_MS;
    if (searchOrdinal === 2) return FAST_SEARCH_MS;
    return SLOT_READ_MS;
  }

  const api: InMemorySchedulingApi = {
    async getServices() {
      await sleep(SLOT_READ_MS);
      return cloneServices(services);
    },

    async getSlots(date) {
      await sleep(nextSlotDelay());
      if (readsToFail > 0) {
        readsToFail -= 1;
        throw new SchedulingError(
          "TRANSIENT",
          "Temporary failure while reading slots.",
        );
      }
      if (date !== SCHEDULE_DATE) {
        return { date, timeZone: SCHEDULE_TIME_ZONE, slots: [] };
      }
      return {
        date: SCHEDULE_DATE,
        timeZone: SCHEDULE_TIME_ZONE,
        slots: cloneSlots(slots),
      };
    },

    async book(command) {
      await sleep(BOOK_MS);
      const slotIds = [...command.slotIds];
      assertWellFormed(slots, slotIds);

      if (mode === "capacity-conflict") {
        const conflictingSlot = slots.find((slot) => slot.id === "c1");
        if (conflictingSlot) conflictingSlot.remainingCapacity = 0;
      }

      const unavailable = slotIds.filter((id) => {
        const slot = slots.find((item) => item.id === id);
        return slot == null || slot.remainingCapacity <= 0;
      });
      if (unavailable.length > 0) {
        throw new SchedulingError(
          "SLOT_UNAVAILABLE",
          "Slot capacity is unavailable.",
          unavailable,
        );
      }

      for (const id of slotIds) {
        const slot = slots.find((item) => item.id === id);
        if (!slot)
          throw new SchedulingError("INVALID_REQUEST", "Unknown slot id.");
        slot.remainingCapacity -= 1;
      }

      bookingSequence += 1;
      const receipt: BookingReceipt = {
        bookingId: `bk-${bookingSequence}`,
        slotIds,
        status: "confirmed",
      };
      return receipt;
    },

    setMode(next) {
      mode = next;
      readsToFail = next === "transient-error" ? 1 : 0;
      if (next === "out-of-order") searchOrdinal = 0;
    },

    reset() {
      mode = "normal";
      services = cloneServices(base.services);
      slots = cloneSlots(base.slots);
      searchOrdinal = 0;
      readsToFail = 0;
      bookingSequence = 0;
    },
  };

  return api;
}

function assertWellFormed(
  slots: readonly StoredSlot[],
  slotIds: readonly string[],
): void {
  if (slotIds.length === 0 || new Set(slotIds).size !== slotIds.length) {
    throw new SchedulingError(
      "INVALID_REQUEST",
      "Slot ids must be distinct and non-empty.",
    );
  }

  const missing = slotIds.filter((id) => !slots.some((slot) => slot.id === id));
  if (missing.length > 0) {
    throw new SchedulingError("INVALID_REQUEST", "Unknown slot id.");
  }
}

function cloneServices(services: readonly Service[]): Service[] {
  return services.map((service) => ({ ...service }));
}

function cloneSlots(slots: readonly Slot[]): StoredSlot[] {
  return slots.map((slot) => ({ ...slot }));
}
