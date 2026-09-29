import { expect, it } from "vitest";

import { findTopSchedules } from ".";
import type { Slot } from "./types";

it("measures exhaustive search for 3 services and 50 slots each", () => {
  const slots = [
    ...band("S1", 9 * 60, 9 * 60 + 10),
    ...band("S2", 9 * 60 + 20, 9 * 60 + 30),
    ...band("S3", 9 * 60 + 40, 9 * 60 + 50),
  ].reverse();

  const started = performance.now();
  const schedules = findTopSchedules(slots, ["S1", "S2", "S3"], {
    startMinutes: 8 * 60,
    endMinutes: 12 * 60,
  });
  const elapsed = performance.now() - started;

  console.log(
    `[bench] 3 services x 50 slots exhaustive search: ${elapsed.toFixed(1)} ms`,
  );

  expect(schedules.map((schedule) => schedule.identity)).toEqual([
    "S1-00,S2-00,S3-00",
    "S1-00,S2-00,S3-01",
    "S1-00,S2-00,S3-02",
  ]);

  expect(elapsed).toBeLessThan(2000);
});

function band(
  serviceId: string,
  startMinutes: number,
  endMinutes: number,
): Slot[] {
  return Array.from({ length: 50 }, (_, index) => ({
    id: `${serviceId}-${String(index).padStart(2, "0")}`,
    serviceId,
    doctorId: `d${index % 7}`,
    clinicId: "A",
    startMinutes,
    endMinutes,
    remainingCapacity: 1,
  }));
}
