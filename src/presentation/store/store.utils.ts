import { isSchedulingError } from "../../application/errors";
import type { SearchInput } from "../../application/use-cases/search-schedules";
import { SCHEDULE_DATE } from "../../domain/scheduling/constants";
import { parseClock } from "../../domain/scheduling/utils";

import type { SchedulingState } from "./store.types";

export function formKey(
  state: Pick<SchedulingState, "selectedIds" | "windowStart" | "windowEnd">,
): string {
  return `${state.selectedIds.join(">")}|${state.windowStart}|${state.windowEnd}`;
}

export function isCurrentResult(
  state: Pick<
    SchedulingState,
    "resultInputKey" | "selectedIds" | "windowStart" | "windowEnd"
  >,
): boolean {
  return (
    state.resultInputKey != null && state.resultInputKey === formKey(state)
  );
}

export function canBook(
  state: Pick<
    SchedulingState,
    | "phase"
    | "selectedIdentity"
    | "resultInputKey"
    | "selectedIds"
    | "windowStart"
    | "windowEnd"
    | "schedules"
  >,
): boolean {
  if (
    state.phase !== "ready" ||
    state.selectedIdentity == null ||
    !isCurrentResult(state)
  )
    return false;
  return state.schedules.some(
    (schedule) => schedule.identity === state.selectedIdentity,
  );
}

export function clearedFieldError(
  state: SchedulingState,
): Partial<SchedulingState> {
  if (state.phase !== "error") return { formError: null };
  return { formError: null, phase: "idle", searchError: null };
}

export function toSearchInput(state: SchedulingState): SearchInput {
  const startMinutes = parseClock(state.windowStart);
  const endMinutes = parseClock(state.windowEnd);
  if (startMinutes == null || endMinutes == null) {
    throw new Error("Presence window was not validated.");
  }

  return {
    date: SCHEDULE_DATE,
    serviceIds: state.selectedIds,
    window: { startMinutes, endMinutes },
  };
}

export function searchFailureMessage(error: unknown): string {
  if (isSchedulingError(error) && error.code === "TRANSIENT") {
    return "دریافت نوبت‌ها ناموفق بود.";
  }
  return "محاسبه برنامه‌ها ناموفق بود.";
}

export function capacityMessage(ids: readonly string[]): string {
  const list = ids.join("، ");
  const noun = ids.length > 1 ? "نوبت‌های" : "نوبت";
  return `ثبت انجام نشد. ظرفیت ${noun} ${list} پر شده است. پیشنهادها با ظرفیت تازه محاسبه شد.`;
}
