import { useShallow } from "zustand/react/shallow";

import {
  canBook,
  isCurrentResult,
} from "../../store";
import { useScheduling } from "../../hooks";
import { primaryButtonClass, secondaryButtonClass } from "../../styles.ts";
import { StatusNotice } from "../status-notice";

import { BookingReceipt } from "./BookingReceipt.tsx";
import { SuggestedScheduleCard } from "./SuggestedScheduleCard.tsx";

export function ScheduleResults() {
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
        <StatusNotice tone="info" role="status">
          در حال محاسبه برنامه‌ها…
        </StatusNotice>
      )}
      {snapshot.phase === "booking" && (
        <StatusNotice tone="info" role="status">
          در حال ثبت برنامه انتخاب‌شده…
        </StatusNotice>
      )}

      {mismatch && (
        <StatusNotice tone="warning" role="status">
          ورودی‌ها تغییر کرده است. برای محاسبه دوباره جستجو کنید. برنامه قبلی با
          این ورودی قابل ثبت نیست.
        </StatusNotice>
      )}

      {snapshot.bookingError && (
        <StatusNotice tone="error" role="alert">
          {snapshot.bookingError}
        </StatusNotice>
      )}

      {snapshot.phase === "error" && (
        <StatusNotice tone="error" role="alert">
          <p>{snapshot.searchError}</p>
          <button
            type="button"
            className={`${secondaryButtonClass} mt-3`}
            onClick={() => void search()}
          >
            تلاش دوباره
          </button>
        </StatusNotice>
      )}

      {snapshot.phase === "empty" && current && (
        <StatusNotice tone="info" role="status">
          برنامه معتبری با این ترتیب و بازه پیدا نشد. ترتیب خدمات یا بازه حضور
          را عوض کنید.
        </StatusNotice>
      )}

      {showSchedules && (
        <fieldset
          disabled={snapshot.phase === "booking"}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
        >
          <legend className="sr-only">برنامه‌های پیشنهادی</legend>
          {snapshot.schedules.map((schedule, index) => (
            <SuggestedScheduleCard
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
        <BookingReceipt
          receipt={snapshot.receipt}
          services={snapshot.services}
        />
      )}
    </section>
  );
}
