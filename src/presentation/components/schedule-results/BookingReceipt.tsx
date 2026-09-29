import { formatClock } from "@domain/scheduling/utils";
import type { Service } from "@domain/scheduling/types";
import type { BookingReceiptView } from "../../store";
import { serviceTitle } from "../../formatting";

type BookingReceiptProps = {
  receipt: BookingReceiptView;
  services: readonly Service[];
};

export function BookingReceipt({ receipt, services }: BookingReceiptProps) {
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
