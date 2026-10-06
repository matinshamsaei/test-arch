import { inPersonBookingError } from "@application/in-person-booking/errors";
import type { InPersonBookingRepository } from "@application/in-person-booking/repositories";
import type { InPersonBooking } from "@domain/in-person-booking/types";
import type { HttpClient } from "@infrastructure/http";

import {
  ACTIVE_BOOKING_STATUSES,
  FilterType,
  IN_PERSON_BOOKING_TYPES,
  endpoints,
} from "./api-types.ts";
import type {
  GetDoctorResponse,
  GetInPersonBookingsListResponse,
} from "./api-types.ts";
import { toDomainBooking } from "./mapper.ts";

export interface HttpInPersonBookingApiOptions {
  readonly http: HttpClient;
  /** Doctor recId used as ProviderId on GetAll. Resolved via GetDoctor when omitted. */
  readonly providerId?: string;
  readonly pageSize?: number;
  readonly filterType?: number;
}

async function resolveProviderId(
  http: HttpClient,
  providerId: string | undefined,
): Promise<string> {
  if (providerId?.trim()) return providerId.trim();

  const doctor = await http.request<GetDoctorResponse>({
    path: endpoints.getDoctor,
    method: "GET",
  });
  return String(doctor.recId);
}

export function createHttpInPersonBookingApi(
  options: HttpInPersonBookingApiOptions,
): InPersonBookingRepository {
  const pageSize = options.pageSize ?? 50;
  const filterType = options.filterType ?? FilterType.All;
  let cache: InPersonBooking[] = [];
  let resolvedProviderId: string | null = options.providerId?.trim() || null;

  async function providerId(): Promise<string> {
    if (resolvedProviderId) return resolvedProviderId;
    resolvedProviderId = await resolveProviderId(options.http, undefined);
    return resolvedProviderId;
  }

  async function fetchPage(
    pageNumber: number,
  ): Promise<GetInPersonBookingsListResponse> {
    return options.http.request<GetInPersonBookingsListResponse>({
      path: endpoints.getAll,
      method: "GET",
      query: {
        pageNumber,
        pageSize,
        NeedTotalCount: true,
        ProviderId: await providerId(),
        FilterType: filterType,
        BookingStatuses: [...ACTIVE_BOOKING_STATUSES],
        BookingTypes: [...IN_PERSON_BOOKING_TYPES],
      },
    });
  }

  async function listAll(): Promise<InPersonBooking[]> {
    const first = await fetchPage(1);
    const pages = [first];
    const totalPages = Math.max(
      1,
      Math.ceil(first.totalCount / Math.max(first.pageSize, 1)),
    );

    for (let page = 2; page <= totalPages; page += 1) {
      pages.push(await fetchPage(page));
    }

    const items = pages
      .flatMap((page) => page.queryResult)
      .map(toDomainBooking)
      .filter((booking): booking is InPersonBooking => booking !== null);

    cache = items;
    return items.map((booking) => ({ ...booking }));
  }

  return {
    async list() {
      return listAll();
    },

    async findByOrderCode(orderCode) {
      const cached = cache.find((item) => item.orderCode === orderCode);
      if (cached) return { ...cached };

      const items = await listAll();
      const booking = items.find((item) => item.orderCode === orderCode);
      return booking ? { ...booking } : null;
    },

    async save(booking) {
      if (booking.status === "completed") {
        await options.http.request<void>({
          path: endpoints.completed,
          method: "POST",
          body: { orderCode: booking.orderCode },
        });
      } else if (booking.status === "cancelled") {
        await options.http.request<void>({
          path: endpoints.cancelled,
          method: "POST",
          body: { orderCode: booking.orderCode },
        });
      } else {
        throw inPersonBookingError(
          `Booking ${booking.orderCode} has no remote command for status ${booking.status}.`,
        );
      }

      cache = cache.filter((item) => item.orderCode !== booking.orderCode);
    },
  };
}
