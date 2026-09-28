export type SchedulingErrorCode =
  | "SLOT_UNAVAILABLE"
  | "TRANSIENT"
  | "INVALID_REQUEST";

export class SchedulingError extends Error {
  readonly code: SchedulingErrorCode;
  readonly conflictingSlotIds: readonly string[];

  constructor(
    code: SchedulingErrorCode,
    message: string,
    conflictingSlotIds: readonly string[] = [],
  ) {
    super(message);
    this.name = "SchedulingError";
    this.code = code;
    this.conflictingSlotIds = conflictingSlotIds;
  }
}

export function isSchedulingError(error: unknown): error is SchedulingError {
  return error instanceof SchedulingError;
}
