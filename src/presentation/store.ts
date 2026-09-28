import { createStore } from 'zustand/vanilla';
import { MAX_SERVICES, SCHEDULE_DATE } from '../domain/constants.ts';
import { parseClock } from '../domain/time.ts';
import type { Schedule, Service, Slot } from '../domain/types.ts';
import type { SchedulingDependencies } from '../application/dependencies.ts';
import { isSchedulingError } from '../application/errors.ts';
import type { MockMode } from '../application/ports.ts';
import type { SearchInput } from '../application/schedule-search.ts';
import { validateForm } from './form.ts';

export type ViewPhase = 'idle' | 'loading' | 'empty' | 'ready' | 'error' | 'booking' | 'booked';
export type CatalogPhase = 'loading' | 'ready' | 'error';

export interface BookingReceiptView {
  readonly bookingId: string;
  readonly status: 'confirmed';
  readonly slots: readonly Slot[];
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

export interface SchedulingActions {
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

export type SchedulingStore = SchedulingState & SchedulingActions;

const initialState: SchedulingState = {
  services: [],
  catalogPhase: 'loading',
  selectedIds: ['S1', 'S2', 'S3'],
  windowStart: '09:00',
  windowEnd: '14:00',
  formError: null,
  phase: 'idle',
  schedules: [],
  resultInputKey: null,
  searchError: null,
  bookingError: null,
  conflictingSlotIds: [],
  selectedIdentity: null,
  receipt: null,
  mockMode: 'normal',
};

export function formKey(state: Pick<SchedulingState, 'selectedIds' | 'windowStart' | 'windowEnd'>): string {
  return `${state.selectedIds.join('>')}|${state.windowStart}|${state.windowEnd}`;
}

export function isCurrentResult(
  state: Pick<SchedulingState, 'resultInputKey' | 'selectedIds' | 'windowStart' | 'windowEnd'>,
): boolean {
  return state.resultInputKey != null && state.resultInputKey === formKey(state);
}

export function canBook(
  state: Pick<
    SchedulingState,
    | 'phase'
    | 'selectedIdentity'
    | 'resultInputKey'
    | 'selectedIds'
    | 'windowStart'
    | 'windowEnd'
    | 'schedules'
  >,
): boolean {
  if (state.phase !== 'ready' || state.selectedIdentity == null || !isCurrentResult(state)) return false;
  return state.schedules.some((schedule) => schedule.identity === state.selectedIdentity);
}

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
      const conflictingSlotIds = preserveBookingError ? state.conflictingSlotIds : [];

      set({
        phase: 'loading',
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
        if (currentEpoch !== epoch || outcome.status === 'stale') return;

        set({
          schedules: outcome.schedules,
          resultInputKey: key,
          formError: null,
          phase: outcome.schedules.length === 0 ? 'empty' : 'ready',
        });
      } catch (error) {
        if (currentEpoch !== epoch) return;
        set({
          phase: 'error',
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
        set({ catalogPhase: 'loading' });
        try {
          const services = await dependencies.catalog.getServices();
          if (currentEpoch !== epoch) return;
          set({ services, catalogPhase: 'ready' });
        } catch {
          if (currentEpoch !== epoch) return;
          set({ catalogPhase: 'error' });
        }
      },

      toggleService(serviceId) {
        const state = get();
        if (state.phase === 'booking') return;

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
        if (state.phase === 'booking') return;

        const index = state.selectedIds.indexOf(serviceId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= state.selectedIds.length) return;

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
        if (get().phase === 'booking') return;
        await runSearch(false);
      },

      selectSchedule(identity) {
        const state = get();
        if (state.phase === 'booking' || !isCurrentResult(state)) return;
        if (!state.schedules.some((schedule) => schedule.identity === identity)) return;
        set({ selectedIdentity: identity });
      },

      async bookSelected() {
        const state = get();
        if (state.phase === 'booking' || !canBook(state)) return;

        const schedule = state.schedules.find((item) => item.identity === state.selectedIdentity);
        if (!schedule) return;

        const slotIds = schedule.slotIds;
        const bookedSlots = schedule.slots.map((slot) => ({ ...slot }));
        const currentEpoch = epoch;
        set({ phase: 'booking', bookingError: null, conflictingSlotIds: [] });

        try {
          const receipt = await dependencies.book.execute(slotIds);
          if (currentEpoch !== epoch) return;
          set({
            phase: 'booked',
            receipt: {
              bookingId: receipt.bookingId,
              status: receipt.status,
              slots: bookedSlots,
            },
          });
        } catch (error) {
          if (currentEpoch !== epoch) return;
          if (isSchedulingError(error) && error.code === 'SLOT_UNAVAILABLE') {
            set({
              phase: 'idle',
              bookingError: capacityMessage(error.conflictingSlotIds),
              conflictingSlotIds: error.conflictingSlotIds,
              selectedIdentity: null,
            });
            await runSearch(true);
            return;
          }
          set({
            phase: 'ready',
            bookingError: 'ثبت ناموفق بود. دوباره تلاش کنید.',
          });
        }
      },

      setMockMode(mode) {
        if (get().phase === 'booking') return;
        dependencies.controls.setMode(mode);
        set({ mockMode: mode });
      },

      async resetData() {
        if (get().phase === 'booking') return;
        epoch += 1;
        const currentEpoch = epoch;
        const { selectedIds, windowStart, windowEnd } = get();
        dependencies.controls.reset();
        set({
          ...initialState,
          selectedIds,
          windowStart,
          windowEnd,
          catalogPhase: 'loading',
        });

        try {
          const services = await dependencies.catalog.getServices();
          if (currentEpoch !== epoch) return;
          set({ services, catalogPhase: 'ready' });
        } catch {
          if (currentEpoch !== epoch) return;
          set({ catalogPhase: 'error' });
        }
      },
    };
  });
}

function clearedFieldError(state: SchedulingState): Partial<SchedulingState> {
  if (state.phase !== 'error') return { formError: null };
  return { formError: null, phase: 'idle', searchError: null };
}

function toSearchInput(state: SchedulingState): SearchInput {
  const startMinutes = parseClock(state.windowStart);
  const endMinutes = parseClock(state.windowEnd);
  if (startMinutes == null || endMinutes == null) {
    throw new Error('Presence window was not validated.');
  }

  return {
    date: SCHEDULE_DATE,
    serviceIds: state.selectedIds,
    window: { startMinutes, endMinutes },
  };
}

function searchFailureMessage(error: unknown): string {
  if (isSchedulingError(error) && error.code === 'TRANSIENT') {
    return 'دریافت نوبت‌ها ناموفق بود.';
  }
  return 'محاسبه برنامه‌ها ناموفق بود.';
}

function capacityMessage(ids: readonly string[]): string {
  const list = ids.join('، ');
  const noun = ids.length > 1 ? 'نوبت‌های' : 'نوبت';
  return `ثبت انجام نشد. ظرفیت ${noun} ${list} پر شده است. پیشنهادها با ظرفیت تازه محاسبه شد.`;
}
