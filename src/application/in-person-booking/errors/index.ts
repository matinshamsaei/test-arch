export interface InPersonBookingError {
  readonly kind: "InPersonBookingError";
  readonly code: "BOOKING_NOT_FOUND";
  readonly message: string;
}

export function inPersonBookingError(message: string): InPersonBookingError {
  return { kind: "InPersonBookingError", code: "BOOKING_NOT_FOUND", message };
}

export function isInPersonBookingError(
  error: unknown,
): error is InPersonBookingError {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    error.kind === "InPersonBookingError"
  );
}
