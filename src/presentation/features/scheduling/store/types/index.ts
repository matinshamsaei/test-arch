import type {
  Schedule,
  Service,
  Slot,
} from "@domain/scheduling/types";
import type { MockMode } from "@application/scheduling/ports";

type ViewPhase =
  | "idle"
  | "loading"
  | "empty"
  | "ready"
  | "error"
  | "booking"
  | "booked";

type CatalogPhase = "loading" | "ready" | "error";

export interface BookingReceiptView {
  readonly bookingId: string;
  readonly status: "confirmed";
  readonly slots: readonly Slot[];
}

interface SchedulingActions {
  loadCatalog: () => Promise<void>;
  toggleService: (serviceId: string) => void;
  moveService: (serviceId: string, direction: -1 | 1) => void;
  setWindowStart: (value: string) => void;
  setWindowEnd: (value: string) => void;
  search: () => Promise<void>;
  selectSchedule: (identity: string) => void;
  bookSelected: () => Promise<void>;
  setMockMode: (mode: MockMode) => void;
  resetData: () => Promise<void>;
}

export interface SchedulingState {
  readonly services: readonly Service[];
  readonly catalogPhase: CatalogPhase;
  readonly selectedIds: readonly string[];
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly formError: string | null;
  readonly phase: ViewPhase;
  readonly schedules: readonly Schedule[];
  readonly resultInputKey: string | null;
  readonly searchError: string | null;
  readonly bookingError: string | null;
  readonly conflictingSlotIds: readonly string[];
  readonly selectedIdentity: string | null;
  readonly receipt: BookingReceiptView | null;
  readonly mockMode: MockMode;
}

export type SchedulingStore = SchedulingState & SchedulingActions;
