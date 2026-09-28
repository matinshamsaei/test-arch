import { useShallow } from "zustand/react/shallow";

import { formatClock } from "../../domain/scheduling/utils";
import type {
  Schedule,
  Service,
  Slot,
} from "../../domain/scheduling/types/index.ts";
import { canBook, isCurrentResult } from "../store/store.utils.ts";
import type { BookingReceiptView } from "../store/store.types.ts";
import {
  persianDigits,
  serviceTitle,
} from "../formatting/scheduling-formatters.ts";
import { useScheduling } from "../hooks";
import { primaryButtonClass, secondaryButtonClass } from "../styles.ts";

import { Notice } from "./Notice.tsx";

export function Results() {
  const snapshot = useScheduling(
    useShallow((state) => ({
      phase: state.phase,
      schedules: state.schedules,
      services: state.services,
      searchError: state.searchError,
      bookingError: state.bookingError,
      selectedIdentity: state.selectedIdentity,
      receipt: state.receipt,
      resultInputKey: state.resultInputKey,
      selectedIds: state.selectedIds,
      windowStart: state.windowStart,
      windowEnd: state.windowEnd,
    })),
  );
  const search = useScheduling((state) => state.search);
  const selectSchedule = useScheduling((state) => state.selectSchedule);
  const bookSelected = useScheduling((state) => state.bookSelected);

  const current = isCurrentResult(snapshot);

  const mismatch =
    snapshot.resultInputKey != null && !current && snapshot.phase !== "loading";

  const showSchedules =
    snapshot.schedules.length > 0 &&
    (snapshot.phase === "booking" || (snapshot.phase === "ready" && current));

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="results-heading"
      aria-live="polite"
      aria-busy={snapshot.phase === "loading" || snapshot.phase === "booking"}
    >
      <h2 id="results-heading" className="text-base font-bold">
        برنامه‌ها
      </h2>

      <p className="text-sm leading-6 text-stone-600">
        اولویت با پایان زودتر است، بعد فاصله کمتر، بعد ترتیب شناسه نوبت. فاصله
        یعنی شروع نوبت بعدی منهای پایان نوبت قبلی.
      </p>

      {snapshot.phase === "loading" && (
        <Notice tone="info" role="status">
          در حال محاسبه برنامه‌ها…
        </Notice>
      )}
      {snapshot.phase === "booking" && (
        <Notice tone="info" role="status">
          در حال ثبت برنامه انتخاب‌شده…
        </Notice>
      )}

      {mismatch && (
        <Notice tone="warning" role="status">
          ورودی‌ها تغییر کرده است. برای محاسبه دوباره جستجو کنید. برنامه قبلی با
          این ورودی قابل ثبت نیست.
        </Notice>
      )}

      {snapshot.bookingError && (
        <Notice tone="error" role="alert">
          {snapshot.bookingError}
        </Notice>
      )}

      {snapshot.phase === "error" && (
        <Notice tone="error" role="alert">
          <p>{snapshot.searchError}</p>
          <button
            type="button"
            className={`${secondaryButtonClass} mt-3`}
            onClick={() => void search()}
          >
            تلاش دوباره
          </button>
        </Notice>
      )}

      {snapshot.phase === "empty" && current && (
        <Notice tone="info" role="status">
          برنامه معتبری با این ترتیب و بازه پیدا نشد. ترتیب خدمات یا بازه حضور
          را عوض کنید.
        </Notice>
      )}

      {showSchedules && (
        <fieldset
          disabled={snapshot.phase === "booking"}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
        >
          <legend className="sr-only">برنامه‌های پیشنهادی</legend>
          {snapshot.schedules.map((schedule, index) => (
            <ScheduleOption
              key={schedule.identity}
              schedule={schedule}
              rank={index + 1}
              services={snapshot.services}
              checked={snapshot.selectedIdentity === schedule.identity}
              onSelect={() => selectSchedule(schedule.identity)}
            />
          ))}
        </fieldset>
      )}

      {showSchedules && (
        <button
          type="button"
          className={primaryButtonClass}
          disabled={!canBook(snapshot)}
          aria-busy={snapshot.phase === "booking"}
          onClick={() => void bookSelected()}
        >
          {snapshot.phase === "booking" ? "در حال ثبت…" : "ثبت این برنامه"}
        </button>
      )}

      {snapshot.receipt && (
        <Receipt receipt={snapshot.receipt} services={snapshot.services} />
      )}
    </section>
  );
}

type ScheduleOptionProps = {
  schedule: Schedule;
  rank: number;
  services: readonly Service[];
  checked: boolean;
  onSelect: () => void;
};

function ScheduleOption({
  schedule,
  rank,
  services,
  checked,
  onSelect,
}: ScheduleOptionProps) {
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
              <SlotRow
                key={slot.id}
                slot={slot}
                services={services}
                gapMinutes={gapAfter(schedule.slots, index)}
              />
            ))}
          </ol>
        </span>
      </span>
    </label>
  );
}

type SlotRowProps = {
  slot: Slot;
  services: readonly Service[];
  gapMinutes: number | null;
};

function SlotRow({ slot, services, gapMinutes }: SlotRowProps) {
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

export type ReceiptProps = {
  receipt: BookingReceiptView;
  services: readonly Service[];
};

function Receipt({ receipt, services }: ReceiptProps) {
  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
      aria-labelledby="receipt-heading"
    >
      <h2 id="receipt-heading" className="text-base font-bold text-emerald-950">
        ثبت شد
      </h2>

      <p className="mt-2 text-sm text-emerald-950">
        شناسه:{" "}
        <span dir="ltr" className="font-mono">
          {receipt.bookingId}
        </span>
      </p>

      <p className="mt-1 text-sm text-emerald-950">وضعیت: تأییدشده</p>

      <ol className="mt-3 flex flex-col gap-2">
        {receipt.slots.map((slot) => (
          <li key={slot.id} className="text-sm text-emerald-950">
            <span dir="ltr" className="font-mono">
              {slot.id}
            </span>

            <span>
              {" "}
              · {serviceTitle(services, slot.serviceId)} · پزشک {slot.doctorId}{" "}
              · مرکز {slot.clinicId} ·{" "}
            </span>

            <span dir="ltr" className="font-mono">
              {formatClock(slot.startMinutes)}–{formatClock(slot.endMinutes)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function gapAfter(slots: readonly Slot[], index: number): number | null {
  const current = slots[index];
  const next = slots[index + 1];

  if (!current || !next) return null;

  return next.startMinutes - current.endMinutes;
}
