export interface Service {
  readonly id: string;
  readonly title: string;
  readonly durationMinutes: number;
}

export interface Slot {
  readonly id: string;
  readonly serviceId: string;
  readonly doctorId: string;
  readonly clinicId: string;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly remainingCapacity: number;
}

export interface PresenceWindow {
  readonly startMinutes: number;
  readonly endMinutes: number;
}

export interface Schedule {
  readonly identity: string;
  readonly slotIds: readonly string[];
  readonly slots: readonly Slot[];
  readonly endMinutes: number;
  readonly totalGapMinutes: number;
}

export interface SlotSnapshot {
  readonly date: string;
  readonly timeZone: string;
  readonly slots: readonly Slot[];
}
