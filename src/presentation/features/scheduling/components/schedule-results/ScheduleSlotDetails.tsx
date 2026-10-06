import { formatClock } from "@domain/scheduling/utils";
import type { Service, Slot } from "@domain/scheduling/types";
import { persianDigits, serviceTitle } from "../../formatting";

type ScheduleSlotDetailsProps = {
  slot: Slot;
  services: readonly Service[];
  gapMinutes: number | null;
};

export function ScheduleSlotDetails({
  slot,
  services,
  gapMinutes,
}: ScheduleSlotDetailsProps) {
  return (
    <li className="border-s-2 border-teal-700 ps-3">
      <span className="block text-sm font-medium">
        {serviceTitle(services, slot.serviceId)}
      </span>

      <span className="mt-1 block text-sm text-stone-700">
        پزشک {slot.doctorId} · مرکز {slot.clinicId}
      </span>

      <span dir="ltr" className="mt-1 block font-mono text-sm">
        {formatClock(slot.startMinutes)}–{formatClock(slot.endMinutes)}
      </span>

      {gapMinutes != null && (
        <span className="mt-1 block text-xs text-stone-600">
          فاصله تا نوبت بعد: {persianDigits(gapMinutes)} دقیقه
        </span>
      )}
    </li>
  );
}
