import type { SlotSnapshot } from "../../../domain/scheduling/types";

export interface CapacityPort {
  getSlots(date: string): Promise<SlotSnapshot>;
}
