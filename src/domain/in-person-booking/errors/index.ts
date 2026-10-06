export type InPersonBookingRuleCode =
  | "INVALID_ORDER"
  | "INVALID_CANCELLATION"
  | "ACTION_NOT_ALLOWED";

export interface InPersonBookingRuleError {
  readonly kind: "InPersonBookingRuleError";
  readonly code: InPersonBookingRuleCode;
  readonly message: string;
}

export function inPersonBookingRuleError(
  code: InPersonBookingRuleCode,
  message: string,
): InPersonBookingRuleError {
  return { kind: "InPersonBookingRuleError", code, message };
}

export function isInPersonBookingRuleError(
  error: unknown,
): error is InPersonBookingRuleError {
  return isKind(error, "InPersonBookingRuleError");
}

function isKind(error: unknown, kind: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    error.kind === kind
  );
}
