import { describe, expect, it } from "vitest";

import { loadSampleDataset } from "@infrastructure/adapters/mock/dataset.ts";

import { InvalidScheduleQueryError } from "./errors";
import { parseClock } from "./utils";
import type { PresenceWindow, Schedule, Slot } from "./types";
import { compareSchedules, findTopSchedules, requiredGapMinutes } from ".";

const serviceOrder = ["S1", "S2", "S3"] as const;

describe("findTopSchedules", () => {
  it("ranks the sample day as a2-b1-c1, a3-b3-c2, then a2-b1-c2", () => {
    const { slots } = loadSampleDataset();
    const schedules = findTopSchedules(slots, serviceOrder, fullDay());

    expect(summaries(schedules)).toEqual([
      { ids: ["a2", "b1", "c1"], end: "10:55", gap: 20 },
      { ids: ["a3", "b3", "c2"], end: "11:20", gap: 30 },
      { ids: ["a2", "b1", "c2"], end: "11:20", gap: 45 },
    ]);

    expectValid(schedules, serviceOrder, fullDay());
  });

  it("keeps a2-b1-c2 ahead of a2-b3-c2 when end and gap are equal", () => {
    const { slots } = loadSampleDataset();
    const schedules = findTopSchedules(slots, serviceOrder, fullDay());
    expect(schedules[2]?.slotIds).toEqual(["a2", "b1", "c2"]);
  });

  it("promotes the next schedules when c1 has no capacity", () => {
    const { slots } = loadSampleDataset();
    const withoutC1 = slots.map((slot) =>
      slot.id === "c1" ? { ...slot, remainingCapacity: 0 } : slot,
    );

    expect(
      summaries(findTopSchedules(withoutC1, serviceOrder, fullDay())),
    ).toEqual([
      { ids: ["a3", "b3", "c2"], end: "11:20", gap: 30 },
      { ids: ["a2", "b1", "c2"], end: "11:20", gap: 45 },
      { ids: ["a2", "b3", "c2"], end: "11:20", gap: 45 },
    ]);
  });

  it("returns no schedules for 09:00-10:50 with S1, S2, S3", () => {
    const { slots } = loadSampleDataset();
    const schedules = findTopSchedules(
      slots,
      serviceOrder,
      window("09:00", "10:50"),
    );

    expect(schedules).toEqual([]);
  });

  it("ranks two services by the same rules", () => {
    const { slots } = loadSampleDataset();

    expect(summaries(findTopSchedules(slots, ["S1", "S2"], fullDay()))).toEqual(
      [
        { ids: ["a2", "b1"], end: "10:15", gap: 10 },
        { ids: ["a1", "b2"], end: "10:30", gap: 40 },
        { ids: ["a3", "b3"], end: "10:40", gap: 20 },
      ],
    );
  });

  it("does not change rank when the slot list is reversed", () => {
    const { slots } = loadSampleDataset();
    const forward = findTopSchedules(slots, serviceOrder, fullDay());
    const reversed = findTopSchedules(
      [...slots].reverse(),
      serviceOrder,
      fullDay(),
    );

    expect(reversed.map((schedule) => schedule.identity)).toEqual(
      forward.map((schedule) => schedule.identity),
    );
  });

  it("orders equal end and gap by ASCII slot ids, with b1 before b3", () => {
    const slots = [
      makeSlot({ id: "a2", serviceId: "S1", start: "09:00", end: "09:30" }),
      makeSlot({ id: "b3", serviceId: "S2", start: "09:40", end: "10:00" }),
      makeSlot({ id: "b1", serviceId: "S2", start: "09:40", end: "10:00" }),
    ];

    expect(
      findTopSchedules(slots.reverse(), ["S1", "S2"], fullDay()).map(
        (schedule) => schedule.slotIds,
      ),
    ).toEqual([
      ["a2", "b1"],
      ["a2", "b3"],
    ]);
  });

  it("accepts a same-clinic gap of exactly 10 minutes and rejects 9", () => {
    const valid = [
      makeSlot({
        id: "p",
        serviceId: "S1",
        clinicId: "A",
        start: "10:00",
        end: "10:15",
      }),
      makeSlot({
        id: "n",
        serviceId: "S2",
        clinicId: "A",
        start: "10:25",
        end: "10:45",
      }),
    ];
    const early = [
      valid[0]!,
      makeSlot({
        id: "n",
        serviceId: "S2",
        clinicId: "A",
        start: "10:24",
        end: "10:44",
      }),
    ];

    expect(findTopSchedules(valid, ["S1", "S2"], fullDay())).toHaveLength(1);
    expect(findTopSchedules(early, ["S1", "S2"], fullDay())).toHaveLength(0);
    expect(requiredGapMinutes("A", "A")).toBe(10);
  });

  it("accepts a cross-clinic gap of exactly 30 minutes and rejects 29", () => {
    const first = makeSlot({
      id: "p",
      serviceId: "S1",
      clinicId: "A",
      start: "09:00",
      end: "10:00",
    });
    const valid = [
      first,
      makeSlot({
        id: "n",
        serviceId: "S2",
        clinicId: "B",
        start: "10:30",
        end: "10:50",
      }),
    ];
    const early = [
      first,
      makeSlot({
        id: "n",
        serviceId: "S2",
        clinicId: "B",
        start: "10:29",
        end: "10:49",
      }),
    ];

    expect(findTopSchedules(valid, ["S1", "S2"], fullDay())).toHaveLength(1);
    expect(findTopSchedules(early, ["S1", "S2"], fullDay())).toHaveLength(0);
    expect(requiredGapMinutes("A", "B")).toBe(30);
  });

  it("accepts slots that touch the presence window and rejects those outside it", () => {
    const slots = [
      makeSlot({ id: "p", serviceId: "S1", start: "09:00", end: "09:30" }),
      makeSlot({ id: "n", serviceId: "S2", start: "13:30", end: "14:00" }),
    ];

    expect(
      findTopSchedules(slots, ["S1", "S2"], window("09:00", "14:00")),
    ).toHaveLength(1);
    expect(
      findTopSchedules(slots, ["S1", "S2"], window("09:01", "14:00")),
    ).toHaveLength(0);
    expect(
      findTopSchedules(slots, ["S1", "S2"], window("09:00", "13:59")),
    ).toHaveLength(0);
  });

  it("drops a slot whose capacity is zero", () => {
    const slots = [
      makeSlot({
        id: "p",
        serviceId: "S1",
        start: "09:00",
        end: "09:30",
        remainingCapacity: 0,
      }),
      makeSlot({ id: "n", serviceId: "S2", start: "10:00", end: "10:20" }),
    ];
    expect(findTopSchedules(slots, ["S1", "S2"], fullDay())).toEqual([]);
  });

  it("does not mutate the input slots", () => {
    const { slots } = loadSampleDataset();
    const frozen = slots.map((slot) => Object.freeze({ ...slot }));
    expect(() =>
      findTopSchedules(frozen, serviceOrder, fullDay()),
    ).not.toThrow();
    expect(frozen[0]?.remainingCapacity).toBe(1);
  });

  it("rejects queries outside two or three distinct services", () => {
    const { slots } = loadSampleDataset();
    expect(() => findTopSchedules(slots, ["S1"], fullDay())).toThrow(
      InvalidScheduleQueryError,
    );
    expect(() => findTopSchedules(slots, ["S1", "S1"], fullDay())).toThrow(
      InvalidScheduleQueryError,
    );
  });
});

function summaries(schedules: readonly Schedule[]) {
  return schedules.map((schedule) => ({
    ids: schedule.slotIds,
    end: format(schedule.endMinutes),
    gap: schedule.totalGapMinutes,
  }));
}

function expectValid(
  schedules: readonly Schedule[],
  serviceIds: readonly string[],
  presence: PresenceWindow,
) {
  expect(schedules.length).toBeLessThanOrEqual(3);
  expect(new Set(schedules.map((schedule) => schedule.identity)).size).toBe(
    schedules.length,
  );

  for (let index = 1; index < schedules.length; index += 1) {
    const previous = schedules[index - 1];
    const current = schedules[index];

    if (!previous || !current) continue;

    expect(compareSchedules(previous, current)).toBeLessThanOrEqual(0);
  }

  for (const schedule of schedules) {
    expect(schedule.slots.map((slot) => slot.serviceId)).toEqual(serviceIds);
    expect(schedule.identity).toBe(schedule.slotIds.join(","));

    let gap = 0;

    for (let index = 0; index < schedule.slots.length; index += 1) {
      const slot = schedule.slots[index];
      const previous = schedule.slots[index - 1];
      if (!slot) continue;
      expect(slot.remainingCapacity).toBeGreaterThan(0);
      expect(slot.startMinutes).toBeGreaterThanOrEqual(presence.startMinutes);
      expect(slot.endMinutes).toBeLessThanOrEqual(presence.endMinutes);
      if (previous) {
        const between = slot.startMinutes - previous.endMinutes;
        expect(between).toBeGreaterThanOrEqual(
          requiredGapMinutes(previous.clinicId, slot.clinicId),
        );
        gap += between;
      }
    }

    expect(schedule.totalGapMinutes).toBe(gap);
    expect(schedule.endMinutes).toBe(
      schedule.slots[schedule.slots.length - 1]?.endMinutes,
    );
  }
}

function fullDay(): PresenceWindow {
  return window("09:00", "14:00");
}

function window(start: string, end: string): PresenceWindow {
  return { startMinutes: clock(start), endMinutes: clock(end) };
}

function clock(value: string): number {
  const minutes = parseClock(value);
  if (minutes == null) throw new Error(`Invalid clock: ${value}`);
  return minutes;
}

function format(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function makeSlot(input: {
  id: string;
  serviceId: string;
  clinicId?: string;
  start: string;
  end: string;
  remainingCapacity?: number;
}): Slot {
  return {
    id: input.id,
    serviceId: input.serviceId,
    doctorId: "d1",
    clinicId: input.clinicId ?? "A",
    startMinutes: clock(input.start),
    endMinutes: clock(input.end),
    remainingCapacity: input.remainingCapacity ?? 1,
  };
}
