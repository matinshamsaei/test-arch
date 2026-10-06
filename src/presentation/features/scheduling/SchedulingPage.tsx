import { useEffect } from "react";

import {
  SCHEDULE_DATE,
  SCHEDULE_TIME_ZONE,
} from "@domain/scheduling/constants.ts";

import { StatusNotice } from "../../shared/components/status-notice";
import { primaryButtonClass } from "../../shared/styles.ts";
import {
  MockControlPanel,
  PresenceWindowFields,
  ScheduleResults,
  VisitServicePicker,
} from "./components";
import { useScheduling } from "./hooks";

export default function SchedulingPage() {
  const catalogPhase = useScheduling((state) => state.catalogPhase);
  const phase = useScheduling((state) => state.phase);
  const formError = useScheduling((state) => state.formError);
  const loadCatalog = useScheduling((state) => state.loadCatalog);
  const search = useScheduling((state) => state.search);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-teal-800">
          <span dir="ltr">
            {SCHEDULE_DATE} · {SCHEDULE_TIME_ZONE}
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-bold">برنامه‌ریزی نوبت چندخدمتی</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          دو یا سه خدمت را به ترتیب دریافت انتخاب کنید تا حداکثر سه برنامه
          برتر پیشنهاد شود.
        </p>
      </header>

      {catalogPhase === "loading" && (
        <StatusNotice tone="info" role="status">
          در حال دریافت خدمات…
        </StatusNotice>
      )}

      {catalogPhase === "error" && (
        <StatusNotice tone="error" role="alert">
          <p>دریافت خدمات ناموفق بود.</p>
          <button
            type="button"
            className={`${primaryButtonClass} mt-3`}
            onClick={() => void loadCatalog()}
          >
            دریافت دوباره خدمات
          </button>
        </StatusNotice>
      )}

      {catalogPhase === "ready" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <VisitServicePicker />
          <PresenceWindowFields />
          {formError && (
            <p id="form-error" role="alert" className="text-sm text-red-800">
              {formError}
            </p>
          )}
          <button
            type="submit"
            className={primaryButtonClass}
            disabled={phase === "booking"}
            aria-describedby={formError ? "form-error" : undefined}
          >
            جستجوی برنامه
          </button>
        </form>
      )}

      <ScheduleResults />

      <MockControlPanel />
    </main>
  );
}
