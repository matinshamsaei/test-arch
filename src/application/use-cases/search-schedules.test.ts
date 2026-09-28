import { expect, it } from "vitest";
import {
  SCHEDULE_DATE,
  SCHEDULE_TIME_ZONE,
} from "../../domain/scheduling/constants.ts";
import { loadSampleDataset } from "../../infrastructure/adapters/mock/dataset.ts";
import type { CapacityPort } from "../ports/index.ts";
import type { SlotSnapshot } from "../../domain/scheduling/types/index.ts";
import { createScheduleSearch } from "./search-schedules.ts";

it("drops a slower search after a newer search has already resolved", async () => {
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

  const search = createScheduleSearch(capacity);
  const wide = search.execute({
    date: SCHEDULE_DATE,
    serviceIds: ["S1", "S2", "S3"],
    window: { startMinutes: 9 * 60, endMinutes: 14 * 60 },
  });
  const narrow = search.execute({
    date: SCHEDULE_DATE,
    serviceIds: ["S1", "S2", "S3"],
    window: { startMinutes: 9 * 60, endMinutes: 10 * 60 + 50 },
  });

  const second = await narrow;

  releaseFirst?.(snapshot);

  const first = await wide;

  expect(second).toMatchObject({ status: "ready", schedules: [] });

  expect(first).toMatchObject({ status: "stale" });
});
