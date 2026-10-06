import { useState } from "react";

import type {
  CancellationReason,
  InPersonBooking,
} from "@domain/in-person-booking/types";

import { primaryButtonClass, secondaryButtonClass } from "../../shared/styles.ts";
import { useActiveInPersonBookings } from "./use-active-in-person-bookings.ts";
import { useCancelInPersonBooking } from "./use-cancel-in-person-booking.ts";
import { useCompleteInPersonBooking } from "./use-complete-in-person-booking.ts";

const REASONS: readonly { value: CancellationReason; label: string }[] = [
  { value: "clinic-closed", label: "بسته بودن مطب" },
  { value: "patient-absent", label: "عدم حضور بیمار" },
  { value: "doctor-absent", label: "عدم حضور پزشک" },
];

const KIND_LABEL: Record<InPersonBooking["kind"], string> = {
  "in-person": "حضوری",
  service: "خدمات",
};

const STATUS_LABEL: Record<InPersonBooking["status"], string> = {
  reserved: "رزرو شده",
  "awaiting-payment": "در انتظار پرداخت",
  confirmed: "تأیید شده",
  cancelled: "لغو شده",
  completed: "پایان یافته",
};

export default function InPersonBookingPage() {
  const { items, isPending, isFetching, loadError } = useActiveInPersonBookings();
  const completeMutation = useCompleteInPersonBooking();
  const cancelMutation = useCancelInPersonBooking();

  const pendingOrderCode =
    completeMutation.isPending
      ? (completeMutation.variables ?? null)
      : cancelMutation.isPending
        ? (cancelMutation.variables?.orderCode ?? null)
        : null;

  const actionError =
    completeMutation.actionError ?? cancelMutation.actionError;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">نوبت حضوری</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          نوبت‌های باز. دکمه‌ها از عمل‌های مجاز هر نوبت می‌آیند.
        </p>
      </header>

      {loadError && <p role="alert" className="text-sm text-red-800">{loadError}</p>}
      {actionError && <p role="alert" className="text-sm text-red-800">{actionError}</p>}
      {isPending && items.length === 0 && (
        <p className="text-sm text-stone-600">در حال دریافت نوبت‌ها…</p>
      )}
      {!isPending && !loadError && items.length === 0 && (
        <p className="text-sm text-stone-600">نوبت بازی نیست.</p>
      )}
      {isFetching && items.length > 0 && (
        <p className="text-xs text-stone-500">در حال به‌روزرسانی…</p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.booking.orderCode}
            className="rounded-2xl border border-stone-200 bg-white p-4"
          >
            <h2 className="font-medium">{item.booking.patientName}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {item.booking.orderCode} · {KIND_LABEL[item.booking.kind]} ·{" "}
              {STATUS_LABEL[item.booking.status]}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.actions.complete && (
                <button
                  type="button"
                  className={primaryButtonClass}
                  disabled={pendingOrderCode === item.booking.orderCode}
                  onClick={() =>
                    completeMutation.mutate(item.booking.orderCode)
                  }
                >
                  پذیرش
                </button>
              )}
              {item.actions.cancel && (
                <CancelControl
                  pending={pendingOrderCode === item.booking.orderCode}
                  onCancel={async (reason) => {
                    try {
                      await cancelMutation.mutateAsync({
                        orderCode: item.booking.orderCode,
                        reason,
                      });
                      return true;
                    } catch {
                      return false;
                    }
                  }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function CancelControl({
  pending,
  onCancel,
}: {
  readonly pending: boolean;
  readonly onCancel: (reason: CancellationReason) => Promise<boolean>;
}) {
  const [reason, setReason] = useState<CancellationReason>("clinic-closed");

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onCancel(reason);
      }}
    >
      <select
        className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-sm"
        value={reason}
        onChange={(event) =>
          setReason(event.target.value as CancellationReason)
        }
      >
        {REASONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className={secondaryButtonClass} disabled={pending}>
        لغو
      </button>
    </form>
  );
}
