export type InPersonBookingKind = "in-person" | "service";

export type InPersonBookingStatus =
  | "reserved"
  | "awaiting-payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export type CancellationReason =
  | "clinic-closed"
  | "patient-absent"
  | "doctor-absent";

export interface InPersonBooking {
  readonly orderCode: string;
  readonly patientName: string;
  readonly kind: InPersonBookingKind;
  readonly status: InPersonBookingStatus;
  readonly cancellationReason: CancellationReason | null;
}

export interface InPersonBookingActions {
  readonly complete: boolean;
  readonly cancel: boolean;
}
