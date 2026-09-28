import type {
  MockControlPort,
  CatalogPort,
  BookingPort,
  CapacityPort,
} from "../../../../application/ports/index";

export type InMemorySchedulingApi = CatalogPort &
  CapacityPort &
  BookingPort &
  MockControlPort;

export interface StoredSlot {
  id: string;
  serviceId: string;
  doctorId: string;
  clinicId: string;
  startMinutes: number;
  endMinutes: number;
  remainingCapacity: number;
}

export interface ApiOptions {
  readonly sleep?: (ms: number) => Promise<void>;
}
