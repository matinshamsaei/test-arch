import { isInPersonBookingError } from "@application/in-person-booking/errors";
import { isInPersonBookingRuleError } from "@domain/in-person-booking";
import type { InPersonBookingRuleCode } from "@domain/in-person-booking/errors";

const RULE_MESSAGES: Record<InPersonBookingRuleCode, string> = {
  INVALID_ORDER: "کد سفارش لازم است.",
  INVALID_CANCELLATION: "دلیل لغو را انتخاب کنید.",
  ACTION_NOT_ALLOWED: "این عمل برای نوبت مجاز نیست.",
};

function httpStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  if (!("status" in error)) return null;
  return typeof error.status === "number" ? error.status : null;
}

export function messageFor(error: unknown): string {
  if (isInPersonBookingRuleError(error)) return RULE_MESSAGES[error.code];
  if (isInPersonBookingError(error)) return "نوبت پیدا نشد.";
  const status = httpStatus(error);
  if (status === 401 || status === 403) {
    return "نشست منقضی شده است. دوباره وارد شوید.";
  }
  if (status !== null) return "ارتباط با سرور ناموفق بود.";
  return "عملیات ناموفق بود.";
}
