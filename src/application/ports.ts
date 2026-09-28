import type { Service, SlotSnapshot } from '../domain/types.ts';

export interface CatalogPort {
  getServices(): Promise<readonly Service[]>;
}

export interface CapacityPort {
  getSlots(date: string): Promise<SlotSnapshot>;
}

export interface BookCommand {
  readonly slotIds: readonly string[];
}

export interface BookingReceipt {
  readonly bookingId: string;
  readonly slotIds: readonly string[];
  readonly status: 'confirmed';
}

export interface BookingPort {
  book(command: BookCommand): Promise<BookingReceipt>;
}

export type MockMode = 'normal' | 'out-of-order' | 'transient-error' | 'capacity-conflict';

export interface MockControlPort {
  setMode(mode: MockMode): void;
  reset(): void;
}
