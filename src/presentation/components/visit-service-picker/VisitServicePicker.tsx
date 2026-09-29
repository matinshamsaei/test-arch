import { MAX_SERVICES } from "@domain/scheduling/constants.ts";
import { useScheduling } from "../../hooks";

import { ServiceOption } from "./ServiceOption.tsx";
import { VisitOrderRow } from "./VisitOrderRow.tsx";

export function VisitServicePicker() {
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
            <ServiceOption
              key={service.id}
              service={service}
              checked={checked}
              disabled={locked || (!checked && selectedIds.length >= MAX_SERVICES)}
              onToggle={() => toggleService(service.id)}
            />
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
            <VisitOrderRow
              key={serviceId}
              serviceId={serviceId}
              rank={index + 1}
              services={services}
              canMoveUp={index > 0}
              canMoveDown={index < selectedIds.length - 1}
              locked={locked}
              onMoveUp={() => moveService(serviceId, -1)}
              onMoveDown={() => moveService(serviceId, 1)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
