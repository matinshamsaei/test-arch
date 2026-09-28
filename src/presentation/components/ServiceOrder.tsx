import { MAX_SERVICES } from "../../domain/scheduling/constants.ts";
import { useScheduling } from "../hooks";
import {
  persianDigits,
  serviceTitle,
} from "../formatting/scheduling-formatters.ts";
import { secondaryButtonClass } from "../styles.ts";

export function ServiceOrder() {
  const services = useScheduling((state) => state.services);
  const selectedIds = useScheduling((state) => state.selectedIds);
  const phase = useScheduling((state) => state.phase);
  const toggleService = useScheduling((state) => state.toggleService);
  const moveService = useScheduling((state) => state.moveService);

  const locked = phase === "booking";

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4"
      aria-labelledby="services-heading"
    >
      <h2 id="services-heading" className="text-base font-bold">
        خدمات و ترتیب دریافت
      </h2>

      <ul className="mt-3 flex flex-col gap-2">
        {services.map((service) => {
          const checked = selectedIds.includes(service.id);

          return (
            <li key={service.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-stone-200 px-3">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-800"
                  checked={checked}
                  disabled={
                    locked || (!checked && selectedIds.length >= MAX_SERVICES)
                  }
                  onChange={() => toggleService(service.id)}
                />

                <span className="font-medium">{service.title}</span>

                <span className="text-sm text-stone-600">
                  {persianDigits(service.durationMinutes)} دقیقه
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-4 text-sm font-medium text-stone-700">ترتیب دریافت</h3>
      {selectedIds.length === 0 ? (
        <p className="mt-2 text-sm text-stone-600">
          هنوز خدمتی انتخاب نشده است.
        </p>
      ) : (
        <ol className="mt-2 flex flex-col gap-2">
          {selectedIds.map((serviceId, index) => (
            <li
              key={serviceId}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-stone-50 px-3"
            >
              <span>
                {persianDigits(index + 1)}. {serviceTitle(services, serviceId)}
              </span>

              <span className="flex gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={locked || index === 0}
                  aria-label={`انتقال ${serviceTitle(services, serviceId)} به بالا`}
                  onClick={() => moveService(serviceId, -1)}
                >
                  بالا
                </button>

                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={locked || index === selectedIds.length - 1}
                  aria-label={`انتقال ${serviceTitle(services, serviceId)} به پایین`}
                  onClick={() => moveService(serviceId, 1)}
                >
                  پایین
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
