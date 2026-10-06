import { createStore } from "zustand/vanilla";

import type { SchedulingDependencies } from "@application/scheduling/dependencies.ts";
import { isSchedulingError } from "@application/scheduling/errors";
import { validateForm } from "../validation";
import { MAX_SERVICES } from "@domain/scheduling/constants.ts";

import type { SchedulingState, SchedulingStore } from "./types";
import {
  canBook,
  capacityMessage,
  clearedFieldError,
  formKey,
  isCurrentResult,
  searchFailureMessage,
  toSearchInput,
} from "./utils";

const initialState: SchedulingState = {
  services: [],
  catalogPhase: "loading",
  selectedIds: ["S1", "S2", "S3"],
  windowStart: "09:00",
  windowEnd: "14:00",
  formError: null,
  phase: "idle",
  schedules: [],
  resultInputKey: null,
  searchError: null,
  bookingError: null,
  conflictingSlotIds: [],
  selectedIdentity: null,
  receipt: null,
  mockMode: "normal",
};

export function createSchedulingStore(dependencies: SchedulingDependencies) {
  let epoch = 0;

  return createStore<SchedulingStore>()((set, get) => {
    async function runSearch(preserveBookingError: boolean): Promise<void> {
      const state = get();
      const formError = validateForm(state);
      if (formError) {
        set({ formError });
        return;
      }

      const input = toSearchInput(state);
      const key = formKey(state);
      const currentEpoch = epoch;
      const bookingError = preserveBookingError ? state.bookingError : null;
      const conflictingSlotIds = preserveBookingError
        ? state.conflictingSlotIds
        : [];

      set({
        phase: "loading",
        formError: null,
        searchError: null,
        bookingError,
        conflictingSlotIds,
        schedules: [],
        selectedIdentity: null,
        receipt: preserveBookingError ? state.receipt : null,
      });

      try {
        const outcome = await dependencies.search.execute(input);
        if (currentEpoch !== epoch || outcome.status === "stale") return;

        set({
          schedules: outcome.schedules,
          resultInputKey: key,
          formError: null,
          phase: outcome.schedules.length === 0 ? "empty" : "ready",
        });
      } catch (error) {
        if (currentEpoch !== epoch) return;
        set({
          phase: "error",
          searchError: searchFailureMessage(error),
          schedules: [],
          selectedIdentity: null,
        });
      }
    }

    return {
      ...initialState,

      async loadCatalog() {
        const currentEpoch = epoch;
        set({ catalogPhase: "loading" });
        try {
          const services = await dependencies.catalog.getServices();
          if (currentEpoch !== epoch) return;
          set({ services, catalogPhase: "ready" });
        } catch {
          if (currentEpoch !== epoch) return;
          set({ catalogPhase: "error" });
        }
      },

      toggleService(serviceId) {
        const state = get();
        if (state.phase === "booking") return;

        if (state.selectedIds.includes(serviceId)) {
          set({
            selectedIds: state.selectedIds.filter((id) => id !== serviceId),
            ...clearedFieldError(state),
          });
          return;
        }

        if (state.selectedIds.length >= MAX_SERVICES) return;
        set({
          selectedIds: [...state.selectedIds, serviceId],
          ...clearedFieldError(state),
        });
      },

      moveService(serviceId, direction) {
        const state = get();
        if (state.phase === "booking") return;

        const index = state.selectedIds.indexOf(serviceId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= state.selectedIds.length)
          return;

        const selectedIds = [...state.selectedIds];
        const current = selectedIds[index];
        const neighbor = selectedIds[nextIndex];
        if (current === undefined || neighbor === undefined) return;
        selectedIds[index] = neighbor;
        selectedIds[nextIndex] = current;
        set({ selectedIds, ...clearedFieldError(state) });
      },

      setWindowStart(value) {
        const state = get();
        set({ windowStart: value, ...clearedFieldError(state) });
      },

      setWindowEnd(value) {
        const state = get();
        set({ windowEnd: value, ...clearedFieldError(state) });
      },

      async search() {
        if (get().phase === "booking") return;
        await runSearch(false);
      },

      selectSchedule(identity) {
        const state = get();
        if (state.phase === "booking" || !isCurrentResult(state)) return;
        if (!state.schedules.some((schedule) => schedule.identity === identity))
          return;
        set({ selectedIdentity: identity });
      },

      async bookSelected() {
        const state = get();
        if (state.phase === "booking" || !canBook(state)) return;

        const schedule = state.schedules.find(
          (item) => item.identity === state.selectedIdentity,
        );
        if (!schedule) return;

        const slotIds = schedule.slotIds;
        const bookedSlots = schedule.slots.map((slot) => ({ ...slot }));
        const currentEpoch = epoch;
        set({ phase: "booking", bookingError: null, conflictingSlotIds: [] });

        try {
          const receipt = await dependencies.book.execute(slotIds);
          if (currentEpoch !== epoch) return;
          set({
            phase: "booked",
            receipt: {
              bookingId: receipt.bookingId,
              status: receipt.status,
              slots: bookedSlots,
            },
          });
        } catch (error) {
          if (currentEpoch !== epoch) return;
          if (isSchedulingError(error) && error.code === "SLOT_UNAVAILABLE") {
            set({
              phase: "idle",
              bookingError: capacityMessage(error.conflictingSlotIds),
              conflictingSlotIds: error.conflictingSlotIds,
              selectedIdentity: null,
            });
            await runSearch(true);
            return;
          }
          set({
            phase: "ready",
            bookingError: "ثبت ناموفق بود. دوباره تلاش کنید.",
          });
        }
      },

      setMockMode(mode) {
        if (get().phase === "booking") return;
        dependencies.controls.setMode(mode);
        set({ mockMode: mode });
      },

      async resetData() {
        if (get().phase === "booking") return;
        epoch += 1;
        const currentEpoch = epoch;
        const { selectedIds, windowStart, windowEnd } = get();
        dependencies.controls.reset();
        set({
          ...initialState,
          selectedIds,
          windowStart,
          windowEnd,
          catalogPhase: "loading",
        });

        try {
          const services = await dependencies.catalog.getServices();
          if (currentEpoch !== epoch) return;
          set({ services, catalogPhase: "ready" });
        } catch {
          if (currentEpoch !== epoch) return;
          set({ catalogPhase: "error" });
        }
      },
    };
  });
}
