import { formatClock } from "@domain/scheduling/utils";
import type { Schedule, Service } from "@domain/scheduling/types";
import { persianDigits } from "../../formatting";

import { gapAfterSlot } from "./gap-after-slot.ts";
import { ScheduleSlotDetails } from "./ScheduleSlotDetails.tsx";

type SuggestedScheduleCardProps = {
  schedule: Schedule;
  rank: number;
  services: readonly Service[];
  checked: boolean;
  onSelect: () => void;
};

export function SuggestedScheduleCard({
  schedule,
  rank,
  services,
  checked,
  onSelect,
}: SuggestedScheduleCardProps) {
  const identity = schedule.slotIds.join(", ");

  return (
    <label
      className={`block cursor-pointer rounded-2xl border p-4 ${
        checked ? "border-teal-700 bg-teal-50" : "border-stone-200 bg-white"
      }`}
    >
      <span className="flex items-start gap-3">
        <input
          className="mt-1 size-4 accent-teal-800"
          type="radio"
          name="schedule"
          value={schedule.identity}
          checked={checked}
          aria-label={`برنامه ${persianDigits(rank)}، ${identity}`}
          onChange={onSelect}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-bold">برنامه {persianDigits(rank)}</span>
            <span dir="ltr" className="font-mono text-sm">
              {identity}
            </span>
          </span>

          <span className="mt-1 block text-sm text-stone-700">
            پایان <span dir="ltr">{formatClock(schedule.endMinutes)}</span>
            <span>
              {" "}
              · مجموع فاصله {persianDigits(schedule.totalGapMinutes)} دقیقه
            </span>
          </span>

          <ol className="mt-3 flex flex-col gap-3">
            {schedule.slots.map((slot, index) => (
              <ScheduleSlotDetails
                key={slot.id}
                slot={slot}
                services={services}
                gapMinutes={gapAfterSlot(schedule.slots, index)}
              />
            ))}
          </ol>
        </span>
      </span>
    </label>
  );
}
